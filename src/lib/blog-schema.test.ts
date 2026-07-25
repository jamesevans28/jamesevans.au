import { describe, it, expect } from 'vitest';
import {
  postSchema,
  postItemSchema,
  toItem,
  lintBody,
  wordCount,
  slugPattern,
  tagValues,
  type Post,
} from './blog-schema';

/** A minimal post that passes every rule; tests override single fields. */
function validPost(overrides: Partial<Post> = {}): Post {
  return {
    slug: 'how-to-use-ai-for-email',
    title: 'How to Use AI to Write Better Emails',
    description:
      'A practical walkthrough of using AI to draft, shorten and soften everyday work emails, with the exact prompts to use and the traps to avoid.',
    status: 'published',
    publishedAt: '2026-07-20T09:00:00.000Z',
    updatedAt: '2026-07-20T09:00:00.000Z',
    tags: ['guides'],
    bodyMarkdown: `## A section\n\n${'word '.repeat(600)}`,
    ...overrides,
  } as Post;
}

describe('post schema', () => {
  it('accepts a well-formed post', () => {
    expect(postSchema.safeParse(validPost()).success).toBe(true);
  });

  it('enforces the SERP title budget', () => {
    expect(postSchema.safeParse(validPost({ title: 'Too short' })).success).toBe(
      false,
    );
    expect(
      postSchema.safeParse(validPost({ title: 'x'.repeat(66) })).success,
    ).toBe(false);
    expect(
      postSchema.safeParse(validPost({ title: 'x'.repeat(65) })).success,
    ).toBe(true);
  });

  it('enforces the meta description window of 140-160 chars', () => {
    expect(
      postSchema.safeParse(validPost({ description: 'x'.repeat(139) })).success,
    ).toBe(false);
    expect(
      postSchema.safeParse(validPost({ description: 'x'.repeat(161) })).success,
    ).toBe(false);
    expect(
      postSchema.safeParse(validPost({ description: 'x'.repeat(140) })).success,
    ).toBe(true);
    expect(
      postSchema.safeParse(validPost({ description: 'x'.repeat(160) })).success,
    ).toBe(true);
  });

  it('requires lowercase kebab-case slugs', () => {
    for (const bad of [
      'Not-Kebab',
      'has spaces',
      'trailing-',
      '-leading',
      'double--hyphen',
      'under_score',
    ]) {
      expect(slugPattern.test(bad), bad).toBe(false);
      expect(postSchema.safeParse(validPost({ slug: bad })).success, bad).toBe(
        false,
      );
    }
    expect(slugPattern.test('five-ways-to-use-ai-2026')).toBe(true);
  });

  it('rejects tags outside the fixed taxonomy', () => {
    expect(
      postSchema.safeParse(validPost({ tags: ['ai' as never] })).success,
    ).toBe(false);
    expect(postSchema.safeParse(validPost({ tags: [] })).success).toBe(false);
    for (const tag of tagValues) {
      expect(postSchema.safeParse(validPost({ tags: [tag] })).success, tag).toBe(
        true,
      );
    }
  });

  it('requires publishedAt on a published post', () => {
    const result = postSchema.safeParse(
      validPost({ status: 'published', publishedAt: undefined }),
    );
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('publishedAt');
  });

  it('allows a draft without publishedAt', () => {
    expect(
      postSchema.safeParse(
        validPost({ status: 'draft', publishedAt: undefined }),
      ).success,
    ).toBe(true);
  });

  it('requires alt text whenever a hero image is set', () => {
    expect(
      postSchema.safeParse(validPost({ heroImage: '/images/blog/a/hero.png' }))
        .success,
    ).toBe(false);
    expect(
      postSchema.safeParse(
        validPost({
          heroImage: '/images/blog/a/hero.png',
          heroImageAlt: 'A laptop showing a draft email',
        }),
      ).success,
    ).toBe(true);
  });

  it('rejects hero images hosted outside the blog image path', () => {
    expect(
      postSchema.safeParse(
        validPost({
          heroImage: 'https://example.com/x.png',
          heroImageAlt: 'External image',
        }),
      ).success,
    ).toBe(false);
  });

  it('rejects a body with no real content', () => {
    expect(postSchema.safeParse(validPost({ bodyMarkdown: '## Hi' })).success).toBe(
      false,
    );
  });
});

describe('toItem', () => {
  it('builds the DynamoDB key and index attributes', () => {
    const item = toItem(validPost());
    expect(item.pk).toBe('POST');
    expect(item.sk).toBe('how-to-use-ai-for-email');
    expect(item.gsi1pk).toBe('published');
    expect(item.gsi1sk).toBe('2026-07-20T09:00:00.000Z');
    expect(postItemSchema.safeParse(item).success).toBe(true);
  });

  it('sorts drafts by updatedAt, since they have no publishedAt', () => {
    const item = toItem(
      validPost({
        status: 'draft',
        publishedAt: undefined,
        updatedAt: '2026-07-24T00:00:00.000Z',
      }),
    );
    expect(item.gsi1pk).toBe('draft');
    expect(item.gsi1sk).toBe('2026-07-24T00:00:00.000Z');
  });
});

describe('lintBody', () => {
  it('passes a clean body', () => {
    expect(lintBody(validPost())).toEqual([]);
  });

  it('rejects a second H1 in the body', () => {
    const problems = lintBody(
      validPost({ bodyMarkdown: `# Another H1\n\n${'word '.repeat(600)}` }),
    );
    expect(problems.join(' ')).toContain('must not contain an H1');
  });

  it('flags images with no alt text', () => {
    const problems = lintBody(
      validPost({
        bodyMarkdown: `## S\n\n![](/images/blog/x.png)\n\n${'word '.repeat(600)}`,
      }),
    );
    expect(problems.join(' ')).toContain('missing alt text');
  });

  it('accepts images that have alt text', () => {
    const problems = lintBody(
      validPost({
        bodyMarkdown: `## S\n\n![A chart](/images/blog/x.png)\n\n${'word '.repeat(600)}`,
      }),
    );
    expect(problems).toEqual([]);
  });

  it('flags internal links missing a trailing slash', () => {
    const problems = lintBody(
      validPost({
        bodyMarkdown: `## S\n\n[services](/services)\n\n${'word '.repeat(600)}`,
      }),
    );
    expect(problems.join(' ')).toContain('trailing slash');
  });

  it('allows internal links with a trailing slash, and asset links without', () => {
    const problems = lintBody(
      validPost({
        bodyMarkdown: `## S\n\n[services](/services/) and [resume](/resume.pdf)\n\n${'word '.repeat(600)}`,
      }),
    );
    expect(problems).toEqual([]);
  });

  it('flags thin content', () => {
    const problems = lintBody(
      validPost({ bodyMarkdown: `## S\n\n${'word '.repeat(100)}` }),
    );
    expect(problems.join(' ')).toContain('thin content');
  });
});

describe('wordCount', () => {
  it('counts words, ignoring extra whitespace', () => {
    expect(wordCount('one two   three\n\nfour')).toBe(4);
    expect(wordCount('   ')).toBe(0);
  });
});
