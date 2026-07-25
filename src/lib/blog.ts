import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import matter from 'gray-matter';
import { postSchema, wordCount, type Post } from './blog-schema';

/**
 * Build-time blog data access. This module runs ONLY during `next build` /
 * `next dev` — the site is a static export, so there is no request-time
 * server. Pages call these functions from server components and the results
 * are baked into HTML.
 *
 * Two sources:
 *   1. DynamoDB — canonical store for published posts (see docs/BLOG_PLAN.md §3)
 *   2. content-drafts/*.md — local working copies, dev only, never deployed
 *
 * With no AWS credentials (a contributor running `next dev`, or CI running
 * tests) DynamoDB is skipped rather than failing the build.
 */

export type BlogPost = Post & {
  /** Estimated reading time in whole minutes, floor 1. */
  readingMinutes: number;
  words: number;
};

const TABLE = process.env.BLOG_TABLE ?? 'jamesevans.au-blog';
const REGION = process.env.AWS_REGION ?? 'ap-southeast-2';
const DRAFTS_DIR = resolve(process.cwd(), 'content-drafts');

function decorate(post: Post): BlogPost {
  const words = wordCount(post.bodyMarkdown);
  return {
    ...post,
    words,
    // 200 wpm is the usual reading-speed assumption for prose.
    readingMinutes: Math.max(1, Math.round(words / 200)),
  };
}

/**
 * Read local draft markdown files.
 *
 * Gated on BLOG_INCLUDE_DRAFTS rather than NODE_ENV: `next build` always sets
 * NODE_ENV=production, including the local preview build that exists precisely
 * to render a draft. The deploy workflow never sets this variable, so drafts
 * cannot reach production.
 */
function includeDrafts(): boolean {
  return process.env.BLOG_INCLUDE_DRAFTS === '1' || isDevServer();
}

function isDevServer(): boolean {
  return process.env.NODE_ENV === 'development';
}

function readLocalDrafts(): BlogPost[] {
  if (!includeDrafts()) return [];
  if (!existsSync(DRAFTS_DIR)) return [];

  const posts: BlogPost[] = [];
  for (const file of readdirSync(DRAFTS_DIR)) {
    if (!file.endsWith('.md')) continue;
    const raw = readFileSync(resolve(DRAFTS_DIR, file), 'utf8');
    const { data, content } = matter(raw);
    const parsed = postSchema.safeParse({ ...data, bodyMarkdown: content });
    if (!parsed.success) {
      // Loud but non-fatal: a broken local draft shouldn't block dev work.
      console.warn(
        `[blog] skipping content-drafts/${file}: ${parsed.error.issues
          .map((i) => `${i.path.join('.')} ${i.message}`)
          .join('; ')}`,
      );
      continue;
    }
    posts.push(decorate(parsed.data));
  }
  return posts;
}

/**
 * Query DynamoDB for every published post, newest first. Returns [] when no
 * credentials are configured so local dev and CI still build.
 */
async function readPublishedFromDynamo(): Promise<BlogPost[]> {
  if (process.env.BLOG_SOURCE === 'local') return [];

  let docClient;
  try {
    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb');
    docClient = DynamoDBDocumentClient.from(
      new DynamoDBClient({ region: REGION }),
    );
  } catch {
    console.warn('[blog] AWS SDK unavailable — building with no remote posts.');
    return [];
  }

  const { QueryCommand } = await import('@aws-sdk/lib-dynamodb');
  const posts: BlogPost[] = [];
  let cursor: Record<string, unknown> | undefined;

  try {
    do {
      const page = await docClient.send(
        new QueryCommand({
          TableName: TABLE,
          IndexName: 'by-status',
          KeyConditionExpression: 'gsi1pk = :status',
          ExpressionAttributeValues: { ':status': 'published' },
          ScanIndexForward: false, // newest first
          ExclusiveStartKey: cursor,
        }),
      );
      for (const raw of page.Items ?? []) {
        const parsed = postSchema.safeParse(raw);
        if (!parsed.success) {
          // A published item that fails validation is a real problem: fail the
          // build rather than silently dropping a live post.
          throw new Error(
            `[blog] invalid published post "${String(raw.slug)}": ${parsed.error.issues
              .map((i) => `${i.path.join('.')} ${i.message}`)
              .join('; ')}`,
          );
        }
        posts.push(decorate(parsed.data));
      }
      cursor = page.LastEvaluatedKey;
    } while (cursor);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('[blog] invalid')) throw err;
    const name = err instanceof Error ? err.name : 'Unknown';
    // Missing creds / no table yet: build the site without a blog rather than
    // blocking every other page.
    if (
      name === 'CredentialsProviderError' ||
      name === 'ResourceNotFoundException' ||
      name === 'AccessDeniedException' ||
      name === 'UnrecognizedClientException'
    ) {
      console.warn(
        `[blog] DynamoDB unavailable (${name}) — building with no remote posts.`,
      );
      return [];
    }
    throw err;
  }

  return posts;
}

let cache: Promise<BlogPost[]> | null = null;

/** All posts visible to the current build, newest first. */
export function getAllPosts(): Promise<BlogPost[]> {
  // Memoised: generateStaticParams + every page calls this during one build.
  cache ??= (async () => {
    const [remote, local] = await Promise.all([
      readPublishedFromDynamo(),
      Promise.resolve(readLocalDrafts()),
    ]);
    // A local draft with the same slug shadows the remote copy, so `blog pull`
    // + edit previews the new version.
    const bySlug = new Map(remote.map((p) => [p.slug, p]));
    for (const draft of local) bySlug.set(draft.slug, draft);

    return [...bySlug.values()].sort((a, b) =>
      (b.publishedAt ?? b.updatedAt ?? '').localeCompare(
        a.publishedAt ?? a.updatedAt ?? '',
      ),
    );
  })();
  return cache;
}

/** Posts that should appear in the index, sitemap, and feed. */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const all = await getAllPosts();
  return all.filter((p) => p.status === 'published');
}

/**
 * Posts that get a rendered page. Includes drafts only when drafts are
 * explicitly enabled (`blog preview`), so a production deploy renders
 * published posts and nothing else.
 */
export async function getRenderablePosts(): Promise<BlogPost[]> {
  const all = await getAllPosts();
  if (includeDrafts()) return all;
  return all.filter((p) => p.status === 'published');
}

export async function getPost(slug: string): Promise<BlogPost | undefined> {
  const posts = await getRenderablePosts();
  return posts.find((p) => p.slug === slug);
}
