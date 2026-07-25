import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

/**
 * The data layer reads process.cwd() and env vars at module load, so each test
 * sets those up and then imports a fresh copy of the module.
 */

const originalCwd = process.cwd;
let workDir: string;

function seedDraft(name: string, frontmatter: string, body = 'word '.repeat(300)) {
  writeFileSync(
    resolve(workDir, 'content-drafts', `${name}.md`),
    `---\n${frontmatter}\n---\n\n${body}\n`,
    'utf8',
  );
}

const publishedFm = [
  'slug: a-published-post',
  'title: A Published Post About Everyday AI',
  `description: ${'x'.repeat(150)}`,
  'status: published',
  "publishedAt: '2026-07-20T09:00:00.000Z'",
  'tags:',
  '  - guides',
].join('\n');

const draftFm = [
  'slug: a-draft-post',
  'title: A Draft Post About Everyday AI Tools',
  `description: ${'y'.repeat(150)}`,
  'status: draft',
  "updatedAt: '2026-07-24T09:00:00.000Z'",
  'tags:',
  '  - tips',
].join('\n');

async function loadModule() {
  vi.resetModules();
  return import('./blog');
}

beforeEach(() => {
  workDir = mkdtempSync(resolve(tmpdir(), 'blog-test-'));
  mkdirSync(resolve(workDir, 'content-drafts'));
  process.cwd = () => workDir;
  // Never reach AWS from a unit test.
  vi.stubEnv('BLOG_SOURCE', 'local');
  vi.stubEnv('BLOG_INCLUDE_DRAFTS', '');
  vi.stubEnv('NODE_ENV', 'test');
});

afterEach(() => {
  process.cwd = originalCwd;
  rmSync(workDir, { recursive: true, force: true });
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('local draft loading', () => {
  it('reads a published local file and decorates it with reading time', async () => {
    seedDraft('a-published-post', publishedFm);
    vi.stubEnv('BLOG_INCLUDE_DRAFTS', '1');

    const { getPublishedPosts } = await loadModule();
    const posts = await getPublishedPosts();

    expect(posts).toHaveLength(1);
    expect(posts[0]?.slug).toBe('a-published-post');
    expect(posts[0]?.words).toBe(300);
    // 300 words at 200wpm rounds to 2 minutes.
    expect(posts[0]?.readingMinutes).toBe(2);
  });

  it('always reports at least one minute of reading time', async () => {
    seedDraft('a-published-post', publishedFm, 'word '.repeat(210));
    vi.stubEnv('BLOG_INCLUDE_DRAFTS', '1');

    const { getPublishedPosts } = await loadModule();
    expect((await getPublishedPosts())[0]?.readingMinutes).toBe(1);
  });

  it('skips an invalid draft without failing the build', async () => {
    seedDraft('broken', 'slug: broken\ntitle: Too short');
    seedDraft('a-published-post', publishedFm);
    vi.stubEnv('BLOG_INCLUDE_DRAFTS', '1');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { getAllPosts } = await loadModule();
    const posts = await getAllPosts();

    expect(posts.map((p) => p.slug)).toEqual(['a-published-post']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('broken'));
  });

  it('sorts posts newest first', async () => {
    seedDraft('a-published-post', publishedFm);
    seedDraft(
      'newer',
      publishedFm
        .replace('a-published-post', 'newer-post')
        .replace('2026-07-20', '2026-07-23'),
    );
    vi.stubEnv('BLOG_INCLUDE_DRAFTS', '1');

    const { getPublishedPosts } = await loadModule();
    expect((await getPublishedPosts()).map((p) => p.slug)).toEqual([
      'newer-post',
      'a-published-post',
    ]);
  });
});

describe('draft isolation', () => {
  it('hides local drafts unless drafts are explicitly enabled', async () => {
    seedDraft('a-published-post', publishedFm);
    seedDraft('a-draft-post', draftFm);

    const { getAllPosts } = await loadModule();
    // BLOG_INCLUDE_DRAFTS unset: local files are not read at all.
    expect(await getAllPosts()).toEqual([]);
  });

  it('excludes draft-status posts from the published list even when loaded', async () => {
    seedDraft('a-published-post', publishedFm);
    seedDraft('a-draft-post', draftFm);
    vi.stubEnv('BLOG_INCLUDE_DRAFTS', '1');

    const { getPublishedPosts, getRenderablePosts } = await loadModule();

    // Renderable includes the draft (that is the point of a preview build)...
    expect((await getRenderablePosts()).map((p) => p.slug)).toContain(
      'a-draft-post',
    );
    // ...but the index, sitemap and feed only ever see published posts.
    expect((await getPublishedPosts()).map((p) => p.slug)).toEqual([
      'a-published-post',
    ]);
  });

  it('renders only published posts when drafts are disabled', async () => {
    seedDraft('a-draft-post', draftFm);
    vi.stubEnv('BLOG_INCLUDE_DRAFTS', '1');
    const { getRenderablePosts } = await loadModule();
    expect((await getRenderablePosts()).map((p) => p.slug)).toContain(
      'a-draft-post',
    );

    // Same content, drafts disabled — as in a production deploy.
    vi.stubEnv('BLOG_INCLUDE_DRAFTS', '');
    const fresh = await loadModule();
    expect(await fresh.getRenderablePosts()).toEqual([]);
  });
});

describe('getPost', () => {
  it('finds a post by slug', async () => {
    seedDraft('a-published-post', publishedFm);
    vi.stubEnv('BLOG_INCLUDE_DRAFTS', '1');
    const { getPost } = await loadModule();
    expect((await getPost('a-published-post'))?.title).toContain(
      'A Published Post',
    );
  });

  it('returns undefined for an unknown slug', async () => {
    vi.stubEnv('BLOG_INCLUDE_DRAFTS', '1');
    const { getPost } = await loadModule();
    expect(await getPost('does-not-exist')).toBeUndefined();
  });
});

describe('missing drafts directory', () => {
  it('returns no posts rather than throwing', async () => {
    rmSync(resolve(workDir, 'content-drafts'), { recursive: true });
    vi.stubEnv('BLOG_INCLUDE_DRAFTS', '1');
    const { getAllPosts } = await loadModule();
    expect(await getAllPosts()).toEqual([]);
  });
});

describe('DynamoDB source', () => {
  /** Item shape as stored by the CLI (see toItem in blog-schema.ts). */
  function item(overrides: Record<string, unknown> = {}) {
    return {
      pk: 'POST',
      sk: 'from-dynamo',
      gsi1pk: 'published',
      gsi1sk: '2026-07-22T09:00:00.000Z',
      slug: 'from-dynamo',
      title: 'A Post Stored In DynamoDB About AI',
      description: 'z'.repeat(150),
      status: 'published',
      publishedAt: '2026-07-22T09:00:00.000Z',
      updatedAt: '2026-07-22T09:00:00.000Z',
      tags: ['trends'],
      bodyMarkdown: 'word '.repeat(300),
      ...overrides,
    };
  }

  /** Mock the SDK so `send` returns the given pages in order. */
  function mockDynamo(pages: Array<Record<string, unknown>>) {
    const send = vi.fn();
    for (const page of pages) send.mockResolvedValueOnce(page);
    vi.doMock('@aws-sdk/client-dynamodb', () => ({
      DynamoDBClient: class {},
    }));
    vi.doMock('@aws-sdk/lib-dynamodb', () => ({
      DynamoDBDocumentClient: { from: () => ({ send }) },
      QueryCommand: class {
        constructor(public input: unknown) {}
      },
    }));
    return send;
  }

  beforeEach(() => {
    // Opt back in to the remote source for this block.
    vi.stubEnv('BLOG_SOURCE', '');
  });

  it('reads published posts from the table', async () => {
    mockDynamo([{ Items: [item()] }]);
    const { getPublishedPosts } = await loadModule();
    const posts = await getPublishedPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0]?.slug).toBe('from-dynamo');
    expect(posts[0]?.readingMinutes).toBe(2);
  });

  it('follows pagination until the cursor is exhausted', async () => {
    const send = mockDynamo([
      { Items: [item()], LastEvaluatedKey: { pk: 'POST', sk: 'from-dynamo' } },
      { Items: [item({ slug: 'second-page-post', sk: 'second-page-post' })] },
    ]);
    const { getPublishedPosts } = await loadModule();
    const posts = await getPublishedPosts();
    expect(send).toHaveBeenCalledTimes(2);
    expect(posts.map((p) => p.slug)).toContain('second-page-post');
  });

  it('fails the build when a published item is invalid, never drops it silently', async () => {
    // A live post that no longer validates is a content bug that must surface.
    mockDynamo([{ Items: [item({ description: 'too short' })] }]);
    const { getPublishedPosts } = await loadModule();
    await expect(getPublishedPosts()).rejects.toThrow(/invalid published post/);
  });

  it('degrades to an empty blog when credentials are missing', async () => {
    const send = vi.fn().mockRejectedValue(
      Object.assign(new Error('no creds'), { name: 'CredentialsProviderError' }),
    );
    vi.doMock('@aws-sdk/client-dynamodb', () => ({ DynamoDBClient: class {} }));
    vi.doMock('@aws-sdk/lib-dynamodb', () => ({
      DynamoDBDocumentClient: { from: () => ({ send }) },
      QueryCommand: class {},
    }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { getPublishedPosts } = await loadModule();
    expect(await getPublishedPosts()).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('DynamoDB unavailable'),
    );
  });

  it('rethrows unexpected errors instead of hiding them', async () => {
    const send = vi
      .fn()
      .mockRejectedValue(
        Object.assign(new Error('throttled'), {
          name: 'ProvisionedThroughputExceededException',
        }),
      );
    vi.doMock('@aws-sdk/client-dynamodb', () => ({ DynamoDBClient: class {} }));
    vi.doMock('@aws-sdk/lib-dynamodb', () => ({
      DynamoDBDocumentClient: { from: () => ({ send }) },
      QueryCommand: class {},
    }));

    const { getPublishedPosts } = await loadModule();
    await expect(getPublishedPosts()).rejects.toThrow(/throttled/);
  });

  it('lets a local draft shadow the published copy of the same slug', async () => {
    mockDynamo([{ Items: [item()] }]);
    seedDraft(
      'from-dynamo',
      [
        'slug: from-dynamo',
        'title: The Locally Edited Version Of This Post',
        `description: ${'q'.repeat(150)}`,
        'status: published',
        "publishedAt: '2026-07-22T09:00:00.000Z'",
        'tags:',
        '  - trends',
      ].join('\n'),
    );
    vi.stubEnv('BLOG_INCLUDE_DRAFTS', '1');

    const { getPublishedPosts } = await loadModule();
    const posts = await getPublishedPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0]?.title).toBe('The Locally Edited Version Of This Post');
  });
});
