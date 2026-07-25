import { describe, it, expect } from 'vitest';
import { renderMarkdown, extractHeadings, slugifyHeading } from './markdown';

describe('renderMarkdown', () => {
  it('renders basic markdown', async () => {
    const html = await renderMarkdown('## Hello\n\nSome **bold** text.');
    expect(html).toContain('<h2');
    expect(html).toContain('<strong>bold</strong>');
  });

  it('renders GFM tables', async () => {
    const html = await renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |');
    expect(html).toContain('<table>');
    expect(html).toContain('<td>1</td>');
  });

  it('strips script tags', async () => {
    const html = await renderMarkdown('<script>alert(1)</script>\n\nText');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('alert(1)');
  });

  it('strips event-handler attributes', async () => {
    const html = await renderMarkdown('<img src=x onerror="alert(1)">');
    expect(html).not.toContain('onerror');
  });

  it('strips javascript: URLs', async () => {
    const html = await renderMarkdown('[click](javascript:alert(1))');
    expect(html).not.toContain('javascript:');
  });

  it('gives headings stable ids for anchor links', async () => {
    const html = await renderMarkdown('## First Section\n\n### A Sub-Section');
    expect(html).toContain('id="first-section"');
    expect(html).toContain('id="a-sub-section"');
  });

  it('wraps headings in an anchor', async () => {
    const html = await renderMarkdown('## Linkable');
    expect(html).toContain('class="heading-anchor"');
    expect(html).toContain('href="#linkable"');
  });

  it('highlights fenced code with theme-aware custom properties', async () => {
    const html = await renderMarkdown('```js\nconst x = 1;\n```');
    expect(html).toContain('data-language="js"');
    // Both themes are emitted so CSS can pick one per colour scheme.
    expect(html).toContain('--shiki-light');
    expect(html).toContain('--shiki-dark');
  });

  it('leaves inline code unhighlighted', async () => {
    const html = await renderMarkdown('Use `npm run dev` to start.');
    expect(html).toContain('<code>npm run dev</code>');
  });
});

describe('extractHeadings', () => {
  it('extracts h2 and h3 headings in document order', () => {
    const headings = extractHeadings('## One\n\ntext\n\n### Two\n\n## Three');
    expect(headings).toEqual([
      { depth: 2, text: 'One', id: 'one' },
      { depth: 3, text: 'Two', id: 'two' },
      { depth: 2, text: 'Three', id: 'three' },
    ]);
  });

  it('ignores the h1 level and deeper levels', () => {
    const headings = extractHeadings('# Title\n\n#### Deep\n\n## Real');
    expect(headings.map((h) => h.text)).toEqual(['Real']);
  });

  it('ignores hash characters inside fenced code blocks', () => {
    const markdown = ['## Real', '', '```bash', '## not a heading', '```'].join(
      '\n',
    );
    expect(extractHeadings(markdown).map((h) => h.text)).toEqual(['Real']);
  });

  it('strips inline markdown from heading text', () => {
    const headings = extractHeadings('## Use **AI** for `email`');
    expect(headings[0]?.text).toBe('Use AI for email');
  });

  it('strips links but keeps their text', () => {
    const headings = extractHeadings('## See [my services](/services/)');
    expect(headings[0]?.text).toBe('See my services');
  });

  it('produces ids matching what the renderer emits', async () => {
    const markdown = '## Five Ways to Use AI, Properly!';
    const [heading] = extractHeadings(markdown);
    const html = await renderMarkdown(markdown);
    // The table of contents must link to ids that actually exist on the page.
    expect(html).toContain(`id="${heading?.id}"`);
  });
});

describe('slugifyHeading', () => {
  it('lowercases, strips punctuation, and hyphenates', () => {
    expect(slugifyHeading('Hello, World!')).toBe('hello-world');
    expect(slugifyHeading('AI in 2026: What Changed')).toBe(
      'ai-in-2026-what-changed',
    );
    expect(slugifyHeading('Émigré Café')).toBe('émigré-café');
  });

  it('replaces whitespace per character rather than collapsing it', () => {
    // github-slugger (used by rehype-slug) does NOT collapse runs of
    // whitespace, so a stripped character between two spaces leaves two
    // hyphens. Collapsing here would produce table-of-contents links that
    // point at ids the page does not have.
    expect(slugifyHeading('AI & You')).toBe('ai--you');
    expect(slugifyHeading('Spaced  Out')).toBe('spaced--out');
  });
});

describe('table of contents anchors', () => {
  // Regression guard: these titles all exercise punctuation handling that
  // previously produced ids the rendered page did not contain.
  const titles = [
    'AI & You',
    'Cost/Benefit',
    'A + B = C',
    'Tips (and tricks)',
    '50% of the time',
    'What about "quotes"?',
    "Don't Do This",
    'AI in 2026: What Changed',
  ];

  it('every extracted heading id exists in the rendered HTML', async () => {
    const markdown = titles.map((t) => `## ${t}`).join('\n\n');
    const html = await renderMarkdown(markdown);
    const headings = extractHeadings(markdown);

    expect(headings).toHaveLength(titles.length);
    for (const heading of headings) {
      expect(html, `missing anchor for "${heading.text}"`).toContain(
        `id="${heading.id}"`,
      );
    }
  });
});
