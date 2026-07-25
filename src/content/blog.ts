/**
 * Static copy for the blog section. Post content itself lives in DynamoDB
 * (see src/lib/blog.ts); this is the framing around it.
 *
 * Editorial scope, decided 25 July 2026 (docs/BLOG_PLAN.md §10): AI in
 * everyday life, written for everyday people and small businesses — not for
 * engineers.
 */

export const blog = {
  eyebrow: 'Writing',
  title: 'Blog',
  heading: 'AI, in plain English.',
  description:
    'Practical writing about using AI in everyday life and small business: how-to guides, tips and tricks, creative uses, and honest takes on the latest AI tools and trends.',
  intro:
    'Practical, jargon-free writing about actually using AI: guides you can follow, tips worth stealing, unusual ways to put it to work, and honest takes on what the latest tools are really good for.',
  emptyState:
    'The first articles are on their way. In the meantime, take a look at what I do or get in touch.',
} as const;

/** Human labels for the fixed tag taxonomy in src/lib/blog-schema.ts. */
export const tagLabels = {
  guides: 'Guides',
  tips: 'Tips & tricks',
  'small-business': 'Small business',
  personal: 'Personal use',
  trends: 'Trends',
  commentary: 'Commentary',
} as const;
