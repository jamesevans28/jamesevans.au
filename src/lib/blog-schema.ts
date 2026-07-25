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

/* ------------------------------------------------------------------ *
 * Research briefs
 *
 * The blog-research skill runs unattended on a schedule and queues briefs
 * here; blog-post later picks the highest-scoring unused one. Both live in
 * the same table (pk='BRIEF') so a scheduled run on any machine sees the same
 * queue. See docs/BLOG_PLAN.md §11.
 * ------------------------------------------------------------------ */

/** The six criteria from the research skill, each scored 1-5. */
export const scoreSchema = z.object({
  searchDemand: z.number().int().min(1).max(5),
  audienceFit: z.number().int().min(1).max(5),
  engagement: z.number().int().min(1).max(5),
  ourAngle: z.number().int().min(1).max(5),
  durability: z.number().int().min(1).max(5),
  evidence: z.number().int().min(1).max(5),
});

export type Scores = z.infer<typeof scoreSchema>;

/** Max achievable total, used for thresholds and display. */
export const SCORE_MAX = 30;

/**
 * Write a post immediately at or above this total. Chosen so a topic must be
 * strong on most criteria, not merely high-traffic.
 */
export const WRITE_THRESHOLD = 22;

/**
 * Publish without review at or above this total — AND only when the evidence
 * gate below passes. Deliberately high: unreviewed content goes public under
 * James's name.
 */
export const AUTOPUBLISH_THRESHOLD = 26;

/** Criteria that veto a topic outright when weak, regardless of total. */
const VETO_CRITERIA = ['audienceFit', 'ourAngle', 'evidence'] as const;

export function scoreTotal(scores: Scores): number {
  return Object.values(scores).reduce((sum, n) => sum + n, 0);
}

/** A single verified statistic from the brief's evidence table. */
export const factSchema = z.object({
  claim: z.string().min(3),
  value: z.string().min(1),
  sourceUrl: z.url(),
  /** ISO date or a coarse label like "Apr 2026" — as published. */
  sourceDate: z.string().min(4),
  /** e.g. "AU", "US", "global". Wrong geography is a real failure mode. */
  geography: z.string().min(2),
  /** True when sources disagree; the post must attribute both or omit it. */
  conflicting: z.boolean().default(false),
  /** True when traced to the study/vendor/regulator, not a round-up blog. */
  primarySource: z.boolean().default(false),
});

export type Fact = z.infer<typeof factSchema>;

export const briefSchema = z.object({
  /** Slug of the brief itself; the post may choose a different one. */
  briefId: z
    .string()
    .min(3)
    .max(80)
    .regex(slugPattern, 'must be lowercase kebab-case'),
  topic: z.string().min(10).max(200),
  pillar: z.enum(tagValues),
  suggestedTitle: z.string().min(10).max(TITLE_MAX),
  suggestedSlug: z
    .string()
    .min(3)
    .max(80)
    .regex(slugPattern, 'must be lowercase kebab-case'),
  timeliness: z.enum(['newsy', 'evergreen']),
  scores: scoreSchema,
  /** Full markdown brief, following the template in the research skill. */
  markdown: z.string().min(200),
  facts: z.array(factSchema).default([]),
  /** Claims that failed verification; the post must not make them. */
  doNotClaim: z.array(z.string()).default([]),
  sources: z.array(z.url()).min(1),
  status: z.enum(['queued', 'used', 'rejected']).default('queued'),
  researchedAt: isoDate,
  /** Set when a post is written from this brief. */
  usedAt: isoDate.optional(),
  usedBySlug: z.string().optional(),
});

export type Brief = z.infer<typeof briefSchema>;

export const briefItemSchema = briefSchema.safeExtend({
  pk: z.literal('BRIEF'),
  sk: z.string(),
  gsi1pk: z.string(),
  gsi1sk: z.string(),
});

export type BriefItem = z.infer<typeof briefItemSchema>;

/**
 * Build DynamoDB keys for a brief. The GSI partitions by brief status and
 * sorts by zero-padded score, so "highest-scoring queued brief" is a single
 * descending Query with Limit=1.
 */
export function briefToItem(brief: Brief): BriefItem {
  const total = scoreTotal(brief.scores);
  return {
    ...brief,
    pk: 'BRIEF',
    sk: brief.briefId,
    gsi1pk: `BRIEF#${brief.status}`,
    // Pad so lexicographic order matches numeric order, then date-tiebreak.
    gsi1sk: `${String(total).padStart(2, '0')}#${brief.researchedAt}`,
  };
}

/**
 * Decide what should happen with a scored brief.
 *
 * Auto-publishing is gated on evidence quality, not just the total: the real
 * risk of unattended publishing is a misattributed statistic going out under
 * James's name, which a high topic score does nothing to prevent.
 */
export function briefAction(brief: {
  scores: Scores;
  facts?: Fact[];
  timeliness?: 'newsy' | 'evergreen';
}): {
  action: 'discard' | 'queue' | 'write' | 'write-and-publish';
  total: number;
  reasons: string[];
} {
  const total = scoreTotal(brief.scores);

  const vetoed = VETO_CRITERIA.filter((key) => brief.scores[key] <= 2);
  if (vetoed.length > 0) {
    return {
      action: 'discard',
      total,
      reasons: vetoed.map((key) => `${key} scored ${brief.scores[key]} (<=2 vetoes the topic)`),
    };
  }

  if (total < WRITE_THRESHOLD) {
    return {
      action: 'queue',
      total,
      reasons: [`total ${total}/${SCORE_MAX} is below the write threshold of ${WRITE_THRESHOLD}`],
    };
  }

  if (total < AUTOPUBLISH_THRESHOLD) {
    return {
      action: 'write',
      total,
      reasons: [`total ${total}/${SCORE_MAX} clears ${WRITE_THRESHOLD}; below auto-publish ${AUTOPUBLISH_THRESHOLD}`],
    };
  }

  // Above the auto-publish score. Now the evidence has to be clean.
  const facts = brief.facts ?? [];
  const blockers: string[] = [];

  if (facts.some((f) => f.conflicting)) {
    blockers.push('a fact is marked CONFLICTING — needs a human to choose the framing');
  }
  if (facts.some((f) => !f.primarySource)) {
    blockers.push('a fact is not traced to a primary source');
  }
  if (brief.scores.evidence < 5) {
    blockers.push(`evidence scored ${brief.scores.evidence}/5 — auto-publish needs 5`);
  }
  if (brief.timeliness === 'newsy') {
    // A newsy claim can be overtaken between research and publish.
    blockers.push('newsy topics are reviewed before publishing');
  }

  if (blockers.length > 0) {
    return { action: 'write', total, reasons: blockers };
  }

  return {
    action: 'write-and-publish',
    total,
    reasons: [`total ${total}/${SCORE_MAX} with clean, primary-sourced evidence`],
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
