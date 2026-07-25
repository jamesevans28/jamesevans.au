import { z } from 'zod';

/**
 * The single source of truth for what a blog post is. Shared by the authoring
 * CLI (scripts/blog/) and the build-time data layer (src/lib/blog.ts), so a
 * malformed item can never reach a page.
 *
 * SEO constraints are enforced here on purpose — title and description lengths
 * are the SERP budget, not style preferences. See docs/BLOG_PLAN.md §6.
 */

/** Lowercase, kebab-case, no leading/trailing/double hyphens. */
export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Tag taxonomy, fixed on purpose — see docs/BLOG_PLAN.md §10. */
export const tagValues = [
  'guides',
  'tips',
  'small-business',
  'personal',
  'trends',
  'commentary',
] as const;

export type Tag = (typeof tagValues)[number];

/** Google truncates SERP titles past ~60-65 chars; keep the whole title visible. */
const TITLE_MAX = 65;
/** Meta description sweet spot. Under 140 wastes space, over 160 truncates. */
const DESCRIPTION_MIN = 140;
const DESCRIPTION_MAX = 160;

const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'must be an ISO 8601 date');

/** Fields an author writes (markdown frontmatter). */
export const postFrontmatterSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(slugPattern, 'must be lowercase kebab-case'),
  title: z.string().min(10).max(TITLE_MAX),
  description: z.string().min(DESCRIPTION_MIN).max(DESCRIPTION_MAX),
  status: z.enum(['draft', 'published']),
  tags: z.array(z.enum(tagValues)).min(1).max(4),
  publishedAt: isoDate.optional(),
  updatedAt: isoDate.optional(),
  heroImage: z.string().startsWith('/images/blog/').optional(),
  heroImageAlt: z.string().min(5).max(160).optional(),
  canonicalUrl: z.url().optional(),
});

/** A full post: frontmatter plus the markdown body. */
export const postSchema = postFrontmatterSchema
  .extend({
    bodyMarkdown: z.string().min(200, 'a post needs real content'),
  })
  .refine((p) => p.status !== 'published' || Boolean(p.publishedAt), {
    message: 'a published post must have publishedAt',
    path: ['publishedAt'],
  })
  .refine((p) => !p.heroImage || Boolean(p.heroImageAlt), {
    message: 'heroImage requires heroImageAlt (accessibility + SEO)',
    path: ['heroImageAlt'],
  });

export type Post = z.infer<typeof postSchema>;
export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

/** A post as stored in DynamoDB: the post plus its key attributes. */
export const postItemSchema = postSchema.safeExtend({
  pk: z.literal('POST'),
  sk: z.string(),
  gsi1pk: z.enum(['draft', 'published']),
  gsi1sk: z.string(),
});

export type PostItem = z.infer<typeof postItemSchema>;

/** Build the DynamoDB key/index attributes for a post. */
export function toItem(post: Post): PostItem {
  return {
    ...post,
    pk: 'POST',
    sk: post.slug,
    gsi1pk: post.status,
    // Drafts have no publishedAt; sort them by last edit instead.
    gsi1sk: post.publishedAt ?? post.updatedAt ?? '',
  };
}

/**
 * Structural checks that need the rendered body rather than the frontmatter.
 * Returns human-readable problems; empty means clean.
 */
export function lintBody(post: Post): string[] {
  const problems: string[] = [];
  const body = post.bodyMarkdown;

  // The page renders the title as the only <h1>; a second one confuses crawlers.
  if (/^#\s+/m.test(body)) {
    problems.push(
      'body must not contain an H1 (`# ...`) — the title is the page H1; start sections at `## `',
    );
  }

  // Markdown images without alt text: ![](...) or ![ ](...)
  for (const match of body.matchAll(/!\[\s*\]\(([^)]+)\)/g)) {
    problems.push(`image is missing alt text: ${match[1] ?? '(unknown)'}`);
  }

  // Internal links must be root-relative with a trailing slash to match
  // next.config trailingSlash — otherwise CloudFront serves a 301 hop.
  for (const match of body.matchAll(/\]\((\/[^)\s]*)\)/g)) {
    const href = match[1];
    if (!href) continue;
    if (/\.(png|jpe?g|webp|avif|svg|pdf)$/i.test(href)) continue;
    if (!href.endsWith('/')) {
      problems.push(`internal link needs a trailing slash: ${href}`);
    }
  }

  if (wordCount(body) < 400) {
    problems.push(
      `body is ${wordCount(body)} words — thin content ranks poorly; aim for 1,200+`,
    );
  }

  return problems;
}

export function wordCount(markdown: string): number {
  return markdown.trim().split(/\s+/).filter(Boolean).length;
}
