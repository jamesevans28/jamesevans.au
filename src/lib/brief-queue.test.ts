import { describe, it, expect, vi } from 'vitest';
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  claimBrief,
  existingTopics,
  listBriefs,
  nextBrief,
  summarise,
} from '../../scripts/blog/briefs';
import { briefSchema, type Brief } from './blog-schema';

/**
 * These exercise the queue's DynamoDB access against a stubbed client, so the
 * paging, ordering and claim-race behaviour is verified without needing AWS.
 */

function brief(overrides: Record<string, unknown> = {}): Brief {
  return briefSchema.parse({
    briefId: 'a-topic',
    topic: 'A topic about everyday AI use',
    pillar: 'guides',
    suggestedTitle: 'A Perfectly Reasonable Title For This Post',
    suggestedSlug: 'a-topic',
    timeliness: 'evergreen',
    scores: {
      searchDemand: 4,
      audienceFit: 4,
      engagement: 4,
      ourAngle: 4,
      durability: 4,
      evidence: 4,
    },
    markdown: 'x'.repeat(300),
    facts: [],
    doNotClaim: [],
    sources: ['https://example.com/a'],
    status: 'queued',
    researchedAt: '2026-07-25T09:00:00.000Z',
    ...overrides,
  });
}

/** Build a stub client whose send() returns queued pages in order. */
function stub(pages: Array<Record<string, unknown>>) {
  const send = vi.fn();
  for (const page of pages) send.mockResolvedValueOnce(page);
  return { client: { send } as unknown as DynamoDBDocumentClient, send };
}

describe('listBriefs', () => {
  it('queries the status partition of the by-status index', async () => {
    const { client, send } = stub([{ Items: [brief()] }]);
    await listBriefs(client, 'tbl', 'queued');

    const input = send.mock.calls[0]?.[0]?.input;
    expect(input.IndexName).toBe('by-status');
    expect(input.ExpressionAttributeValues[':s']).toBe('BRIEF#queued');
    // Descending, because gsi1sk is the zero-padded score.
    expect(input.ScanIndexForward).toBe(false);
  });

  it('pages through every result when unlimited', async () => {
    const { client, send } = stub([
      { Items: [brief()], LastEvaluatedKey: { pk: 'BRIEF', sk: 'a-topic' } },
      { Items: [brief({ briefId: 'b-topic', suggestedSlug: 'b-topic' })] },
    ]);
    const briefs = await listBriefs(client, 'tbl', 'queued');
    expect(send).toHaveBeenCalledTimes(2);
    expect(briefs.map((b) => b.briefId)).toEqual(['a-topic', 'b-topic']);
  });

  it('does not page when a limit is given', async () => {
    const { client, send } = stub([
      { Items: [brief()], LastEvaluatedKey: { pk: 'BRIEF', sk: 'a-topic' } },
    ]);
    const briefs = await listBriefs(client, 'tbl', 'queued', 1);
    expect(send).toHaveBeenCalledTimes(1);
    expect(briefs).toHaveLength(1);
  });

  it('skips a malformed brief rather than failing the whole queue', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { client } = stub([
      { Items: [{ pk: 'BRIEF', sk: 'broken', topic: 'too short' }, brief()] },
    ]);
    const briefs = await listBriefs(client, 'tbl', 'queued');
    expect(briefs.map((b) => b.briefId)).toEqual(['a-topic']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('broken'));
    warn.mockRestore();
  });
});

describe('nextBrief', () => {
  it('asks for a single item, relying on the index ordering', async () => {
    const { client, send } = stub([{ Items: [brief()] }]);
    const best = await nextBrief(client, 'tbl');
    expect(send.mock.calls[0]?.[0]?.input.Limit).toBe(1);
    expect(best?.briefId).toBe('a-topic');
  });

  it('returns undefined on an empty queue', async () => {
    const { client } = stub([{ Items: [] }]);
    expect(await nextBrief(client, 'tbl')).toBeUndefined();
  });
});

describe('claimBrief', () => {
  it('claims a queued brief and records the post slug', async () => {
    const { client, send } = stub([{}]);
    expect(await claimBrief(client, 'tbl', 'a-topic', 'my-post')).toBe(true);

    const input = send.mock.calls[0]?.[0]?.input;
    // Conditional so two concurrent runs cannot claim the same brief.
    expect(input.ConditionExpression).toContain('= :queued');
    expect(input.ExpressionAttributeValues[':slug']).toBe('my-post');
    expect(input.ExpressionAttributeValues[':gsi']).toBe('BRIEF#used');
  });

  it('returns false when another run already claimed it', async () => {
    const send = vi
      .fn()
      .mockRejectedValue(
        Object.assign(new Error('nope'), {
          name: 'ConditionalCheckFailedException',
        }),
      );
    const client = { send } as unknown as DynamoDBDocumentClient;
    expect(await claimBrief(client, 'tbl', 'a-topic', 'my-post')).toBe(false);
  });

  it('rethrows unexpected failures', async () => {
    const send = vi
      .fn()
      .mockRejectedValue(
        Object.assign(new Error('throttled'), {
          name: 'ProvisionedThroughputExceededException',
        }),
      );
    const client = { send } as unknown as DynamoDBDocumentClient;
    await expect(claimBrief(client, 'tbl', 'a', 'b')).rejects.toThrow(
      /throttled/,
    );
  });
});

describe('existingTopics', () => {
  it('collects published posts, drafts, and queued and used briefs', async () => {
    const { client, send } = stub([
      { Items: [{ slug: 'live-post', title: 'A Live Post' }] }, // published
      { Items: [{ slug: 'draft-post', title: 'A Draft Post' }] }, // draft
      { Items: [brief()] }, // queued briefs
      { Items: [brief({ briefId: 'used-topic', suggestedSlug: 'used-topic', status: 'used' })] },
    ]);

    const topics = await existingTopics(client, 'tbl');
    expect(send).toHaveBeenCalledTimes(4);
    expect(topics.map((t) => t.id)).toEqual([
      'live-post',
      'draft-post',
      'a-topic',
      'used-topic',
    ]);
    // Used briefs count too: don't re-research a topic already written up.
    expect(topics.find((t) => t.id === 'used-topic')?.kind).toBe('brief');
  });
});

describe('summarise', () => {
  it('shows the score out of 30', () => {
    expect(summarise(brief())).toContain('24/30');
  });

  it('flags evidence problems that block auto-publishing', () => {
    const line = summarise(
      brief({
        timeliness: 'newsy',
        facts: [
          {
            claim: 'SME adoption rate',
            value: '1%',
            sourceUrl: 'https://example.com/x',
            sourceDate: '2026',
            geography: 'AU',
            conflicting: true,
            primarySource: false,
          },
        ],
      }),
    );
    expect(line).toContain('CONFLICTING');
    expect(line).toContain('non-primary');
    expect(line).toContain('newsy');
  });

  it('shows no flags for a clean brief', () => {
    expect(summarise(brief())).not.toContain('[');
  });
});
