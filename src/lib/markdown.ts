import { unified, type PluggableList } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize, { defaultSchema, type Options as SanitizeOptions } from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeStringify from 'rehype-stringify';

/**
 * Markdown → HTML, at build time only. The output is baked into the static
 * export, so a rendered post ships zero client-side JavaScript.
 *
 * Sanitisation runs BEFORE the syntax highlighter and heading plugins: post
 * bodies are trusted (only James publishes) but treating them as untrusted
 * costs nothing and means a copy-pasted snippet can never inject script.
 */

// Allow the attributes the highlighter and heading anchors need, on top of
// the safe defaults. rehype-pretty-code emits data-* attributes and per-token
// inline styles (the --shiki-light/--shiki-dark custom properties the prose CSS
// selects on), all of which the default schema would otherwise strip.
const schema: SanitizeOptions = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      'className',
      'style',
      'dataLanguage',
      'dataTheme',
    ],
    pre: [
      ...(defaultSchema.attributes?.pre ?? []),
      'className',
      'style',
      'tabIndex',
      'dataLanguage',
      'dataTheme',
    ],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      'className',
      'style',
      'dataLine',
    ],
    div: [...(defaultSchema.attributes?.div ?? []), 'className'],
    figure: [
      ...(defaultSchema.attributes?.figure ?? []),
      'className',
      'dataRehypePrettyCodeFigure',
    ],
  },
};

/**
 * Declared as a PluggableList so each plugin's options object is checked
 * against that plugin's own Options type. Passing options through the chained
 * `.use(plugin, opts)` form defeats inference for plugins that declare a
 * single optional parameter (unified resolves them as zero-parameter).
 */
const plugins: PluggableList = [
  remarkParse,
  remarkGfm,
  // allowDangerousHtml is deliberately OFF: raw HTML in a post body is dropped.
  remarkRehype,
  [rehypeSanitize, schema],
  [
    rehypePrettyCode,
    {
      // Two themes so code blocks follow the site's light/dark toggle via CSS
      // (see the prose styles in globals.css).
      theme: { light: 'github-light', dark: 'github-dark-dimmed' },
      keepBackground: false,
    },
  ],
  rehypeSlug,
  [
    rehypeAutolinkHeadings,
    { behavior: 'wrap', properties: { className: 'heading-anchor' } },
  ],
  rehypeStringify,
];

const processor = unified().use(plugins);

export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await processor.process(markdown);
  return String(file);
}

/** Headings (h2/h3) for an on-page table of contents. */
export type Heading = { depth: 2 | 3; text: string; id: string };

export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  let inFence = false;

  for (const line of markdown.split('\n')) {
    // Don't treat `## ` inside a fenced code block as a heading.
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!match?.[1] || !match[2]) continue;

    const text = match[2]
      // Strip inline markdown so the ToC reads as plain text.
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[*_`]/g, '')
      .trim();

    headings.push({
      depth: match[1].length === 2 ? 2 : 3,
      text,
      id: slugifyHeading(text),
    });
  }
  return headings;
}

/**
 * Mirrors github-slugger, which is what rehype-slug uses for heading ids —
 * the table of contents must link to ids that actually exist on the page.
 *
 * Two behaviours are easy to get wrong and are load-bearing here: whitespace is
 * replaced character by character (NOT collapsed), and the string is not
 * trimmed. So "AI & You" becomes "ai--you", because the ampersand is removed
 * and both surrounding spaces each become a hyphen.
 */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-');
}
