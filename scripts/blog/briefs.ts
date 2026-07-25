/**
 * Brief queue access. Used by the CLI subcommands in index.ts and, through
 * them, by the scheduled blog-research / blog-post runs.
 *
 * Briefs share the posts table (pk='BRIEF') so a run on any machine sees the
 * same queue — see docs/BLOG_PLAN.md §11.
 */
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  briefSchema,
  briefToItem,
  scoreTotal,
  type Brief,
} from '../../src/lib/blog-schema';

export async function getBrief(
  client: DynamoDBDocumentClient,
  table: string,
  briefId: string,
): Promise<Brief | undefined> {
  const result = await client.send(
    new GetCommand({ TableName: table, Key: { pk: 'BRIEF', sk: briefId } }),
  );
  if (!result.Item) return undefined;
  const parsed = briefSchema.safeParse(result.Item);
  if (!parsed.success) {
    throw new Error(
      `stored brief "${briefId}" fails validation: ${parsed.error.issues
        .map((i) => `${i.path.join('.')} ${i.message}`)
        .join('; ')}`,
    );
  }
  return parsed.data;
}

export async function putBrief(
  client: DynamoDBDocumentClient,
  table: string,
  brief: Brief,
): Promise<void> {
  await client.send(
    new PutCommand({ TableName: table, Item: briefToItem(brief) }),
  );
}

/** Every brief with the given status, highest score first. */
export async function listBriefs(
  client: DynamoDBDocumentClient,
  table: string,
  status: Brief['status'],
  limit?: number,
): Promise<Brief[]> {
  const briefs: Brief[] = [];
  let cursor: Record<string, unknown> | undefined;

  do {
    const page = await client.send(
      new QueryCommand({
        TableName: table,
        IndexName: 'by-status',
        KeyConditionExpression: 'gsi1pk = :s',
        ExpressionAttributeValues: { ':s': `BRIEF#${status}` },
        // gsi1sk is the zero-padded score, so descending = best first.
        ScanIndexForward: false,
        ...(limit ? { Limit: limit } : {}),
        ExclusiveStartKey: cursor,
      }),
    );
    for (const item of page.Items ?? []) {
      const parsed = briefSchema.safeParse(item);
      if (parsed.success) briefs.push(parsed.data);
      else {
        // Don't let one malformed brief block the whole queue.
        console.warn(
          `  ! skipping invalid brief "${String(item.sk)}": ${parsed.error.issues[0]?.message ?? 'unknown'}`,
        );
      }
    }
    cursor = page.LastEvaluatedKey;
  } while (cursor && !limit);

  return briefs;
}

/** The brief blog-post should write next: highest-scoring queued one. */
export async function nextBrief(
  client: DynamoDBDocumentClient,
  table: string,
): Promise<Brief | undefined> {
  // Limit=1 is safe because the GSI is already sorted by score descending.
  const [best] = await listBriefs(client, table, 'queued', 1);
  return best;
}

/**
 * Mark a brief as consumed. Conditional on it still being queued, so two
 * concurrent scheduled runs can't both claim the same brief.
 */
export async function claimBrief(
  client: DynamoDBDocumentClient,
  table: string,
  briefId: string,
  postSlug: string,
): Promise<boolean> {
  try {
    await client.send(
      new UpdateCommand({
        TableName: table,
        Key: { pk: 'BRIEF', sk: briefId },
        UpdateExpression:
          'SET #status = :used, gsi1pk = :gsi, usedAt = :now, usedBySlug = :slug',
        ConditionExpression: '#status = :queued',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':used': 'used',
          ':queued': 'queued',
          ':gsi': 'BRIEF#used',
          ':now': new Date().toISOString(),
          ':slug': postSlug,
        },
      }),
    );
    return true;
  } catch (err) {
    if (err instanceof Error && err.name === 'ConditionalCheckFailedException') {
      return false; // Already claimed by another run.
    }
    throw err;
  }
}

export async function rejectBrief(
  client: DynamoDBDocumentClient,
  table: string,
  briefId: string,
): Promise<void> {
  await client.send(
    new UpdateCommand({
      TableName: table,
      Key: { pk: 'BRIEF', sk: briefId },
      UpdateExpression: 'SET #status = :rejected, gsi1pk = :gsi',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':rejected': 'rejected',
        ':gsi': 'BRIEF#rejected',
      },
    }),
  );
}

/**
 * Topics already covered or queued, for dedupe. A researcher running every 12
 * hours will keep rediscovering the same trends; without this it would queue
 * near-duplicates forever.
 */
export async function existingTopics(
  client: DynamoDBDocumentClient,
  table: string,
): Promise<Array<{ kind: 'post' | 'brief'; id: string; text: string }>> {
  const out: Array<{ kind: 'post' | 'brief'; id: string; text: string }> = [];

  for (const status of ['published', 'draft'] as const) {
    const page = await client.send(
      new QueryCommand({
        TableName: table,
        IndexName: 'by-status',
        KeyConditionExpression: 'gsi1pk = :s',
        ExpressionAttributeValues: { ':s': status },
      }),
    );
    for (const item of page.Items ?? []) {
      out.push({
        kind: 'post',
        id: String(item.slug),
        text: String(item.title ?? ''),
      });
    }
  }

  // Queued and used briefs both count: don't re-research a used topic either.
  for (const status of ['queued', 'used'] as const) {
    for (const brief of await listBriefs(client, table, status)) {
      out.push({ kind: 'brief', id: brief.briefId, text: brief.topic });
    }
  }

  return out;
}

/** Human-readable one-line summary for CLI output. */
export function summarise(brief: Brief): string {
  const total = scoreTotal(brief.scores);
  const flags = [
    brief.facts.some((f) => f.conflicting) ? 'CONFLICTING' : '',
    brief.facts.some((f) => !f.primarySource) ? 'non-primary' : '',
    brief.timeliness === 'newsy' ? 'newsy' : '',
  ].filter(Boolean);
  return `${String(total).padStart(2)}/30  ${brief.briefId}${flags.length ? `  [${flags.join(', ')}]` : ''}`;
}
