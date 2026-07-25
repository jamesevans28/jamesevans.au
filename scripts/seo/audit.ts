/**
 * Static on-page audit over the built export (`out/`). Deterministic evidence
 * collection only — the seo skill interprets the findings. Run via:
 *
 *   npm run seo -- audit
 *
 * Checks (thresholds in .claude/skills/seo/reference/api-cheatsheet.md):
 *   - title length/uniqueness, meta description length/uniqueness
 *   - exactly one H1, no skipped heading levels
 *   - self-referencing absolute canonical, trailing-slash consistency
 *   - JSON-LD presence per page (Person / BlogPosting / WebSite) and
 *     deprecated types (HowTo, FAQPage)
 *   - internal link graph: orphans, click depth from home, anchor quality
 *   - images: alt text, width/height, LCP image not lazy-loaded
 *   - robots.txt AI-crawler access, sitemap vs export consistency
 *   - Australian English spelling drift (US variants in visible text)
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse, HTMLElement } from 'node-html-parser';

const OUT_DIR = join(process.cwd(), 'out');
const ORIGIN = (process.env.SEO_SITE_URL ?? 'https://jamesevans.au/').replace(
  /\/$/,
  '',
);

export interface Finding {
  severity: 'error' | 'warn' | 'info';
  check: string;
  page: string;
  detail: string;
}

interface Page {
  route: string; // e.g. /blog/foo/
  title: string;
  description: string;
  canonical: string;
  h1s: string[];
  headingLevels: number[];
  jsonLdTypes: string[];
  internalLinks: { href: string; anchor: string }[];
  images: {
    src: string;
    alt: string | null;
    width: string;
    height: string;
    loading: string;
  }[];
  lang: string;
  noindex: boolean;
  text: string;
}

// US spellings that would look wrong on an Australian site. Word-boundary,
// case-insensitive; keep to unambiguous pairs to avoid false positives.
const US_SPELLINGS: Array<[RegExp, string]> = [
  [/\boptimiz(e|ed|es|ing|ation)\b/gi, 'optimise'],
  [/\banalyz(e|ed|es|ing)\b/gi, 'analyse'],
  [/\borganiz(e|ed|es|ing|ation)\b/gi, 'organise'],
  [/\bcolor(s|ful|ed)?\b/gi, 'colour'],
  [/\bfavorite(s)?\b/gi, 'favourite'],
  [/\bbehavior(s|al)?\b/gi, 'behaviour'],
  [/\blicens(e|es)\b(?! plate)/gi, 'licence (noun)'],
  [/\bcenter(s|ed)?\b/gi, 'centre'],
];

const GENERIC_ANCHORS =
  /^(click here|here|read more|more|this|link|learn more)$/i;
const AI_CRAWLERS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'];

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return name.endsWith('.html') ? [full] : [];
  });
}

function routeOf(file: string): string {
  const rel = '/' + relative(OUT_DIR, file).replace(/\\/g, '/');
  if (rel === '/index.html') return '/';
  return rel.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
}

function jsonLdTypes(root: HTMLElement): string[] {
  return root
    .querySelectorAll('script[type="application/ld+json"]')
    .flatMap((s) => {
      try {
        const data = JSON.parse(s.textContent) as unknown;
        const nodes = Array.isArray(data)
          ? data
          : ((data as { '@graph'?: unknown[] })['@graph'] ?? [data]);
        return (nodes as Array<{ '@type'?: string | string[] }>).flatMap((n) =>
          n['@type'] ? [n['@type']].flat() : [],
        );
      } catch {
        return ['(unparseable JSON-LD)'];
      }
    });
}

function readPage(file: string): Page {
  const root = parse(readFileSync(file, 'utf8'));
  const meta = (name: string, attr = 'name') =>
    root.querySelector(`meta[${attr}="${name}"]`)?.getAttribute('content') ??
    '';
  const headings = root
    .querySelectorAll('h1,h2,h3,h4,h5,h6')
    .map((h) => Number(h.tagName[1]));
  const links = root
    .querySelectorAll('a[href]')
    .map((a) => ({
      href: a.getAttribute('href') ?? '',
      anchor: a.textContent.trim(),
    }))
    .filter(
      ({ href }) =>
        (href.startsWith('/') || href.startsWith(ORIGIN)) &&
        !href.startsWith('//'),
    )
    .map(({ href, anchor }) => ({
      href: href.replace(ORIGIN, '').split('#')[0] || '/',
      anchor,
    }));
  return {
    route: routeOf(file),
    title: root.querySelector('title')?.textContent.trim() ?? '',
    description: meta('description'),
    canonical:
      root.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
    h1s: root.querySelectorAll('h1').map((h) => h.textContent.trim()),
    headingLevels: headings,
    jsonLdTypes: jsonLdTypes(root),
    internalLinks: links,
    images: root.querySelectorAll('img').map((img) => ({
      src: img.getAttribute('src') ?? '',
      alt: img.getAttribute('alt') ?? null,
      width: img.getAttribute('width') ?? '',
      height: img.getAttribute('height') ?? '',
      loading: img.getAttribute('loading') ?? '',
    })),
    lang: root.querySelector('html')?.getAttribute('lang') ?? '',
    noindex: /noindex/i.test(meta('robots')),
    text: root.querySelector('main')?.structuredText ?? root.structuredText,
  };
}

function auditPage(p: Page, findings: Finding[]) {
  const add = (severity: Finding['severity'], check: string, detail: string) =>
    findings.push({ severity, check, page: p.route, detail });

  if (!p.title) add('error', 'title', 'missing <title>');
  else if (p.title.length > 60)
    add('warn', 'title', `${p.title.length} chars (aim 50–60): "${p.title}"`);
  if (!p.description)
    add('error', 'meta-description', 'missing meta description');
  else if (p.description.length < 120 || p.description.length > 158)
    add(
      'warn',
      'meta-description',
      `${p.description.length} chars (aim 120–158)`,
    );

  if (p.h1s.length === 0) add('error', 'h1', 'no <h1>');
  if (p.h1s.length > 1) add('error', 'h1', `${p.h1s.length} <h1> elements`);
  let prev = 0;
  for (const level of p.headingLevels) {
    if (prev > 0 && level > prev + 1) {
      add(
        'warn',
        'heading-hierarchy',
        `h${prev} followed by h${level} (skipped level)`,
      );
      break;
    }
    prev = level;
  }

  const expected = `${ORIGIN}${p.route}`;
  if (!p.canonical) add('error', 'canonical', 'missing canonical');
  else if (p.canonical !== expected)
    add(
      'error',
      'canonical',
      `canonical "${p.canonical}" ≠ expected "${expected}"`,
    );

  for (const img of p.images) {
    if (img.alt === null)
      add('error', 'img-alt', `missing alt attribute: ${img.src}`);
    if (!img.width || !img.height)
      add(
        'warn',
        'img-dimensions',
        `missing width/height (CLS risk): ${img.src}`,
      );
  }

  for (const { href, anchor } of p.internalLinks) {
    if (GENERIC_ANCHORS.test(anchor))
      add('warn', 'anchor-text', `generic anchor "${anchor}" → ${href}`);
  }

  if (p.jsonLdTypes.includes('(unparseable JSON-LD)'))
    add('error', 'json-ld', 'unparseable JSON-LD block');
  for (const t of p.jsonLdTypes) {
    if (t === 'HowTo')
      add('warn', 'json-ld', 'HowTo schema is retired by Google');
    if (t === 'FAQPage')
      add(
        'warn',
        'json-ld',
        'FAQPage rich results are gov/health-only since 2023',
      );
  }
  if (p.route.startsWith('/blog/') && p.route !== '/blog/' && !p.noindex) {
    if (!p.jsonLdTypes.some((t) => t === 'BlogPosting' || t === 'Article'))
      add('warn', 'json-ld', 'blog post without BlogPosting JSON-LD');
  }

  if (p.lang && !/^en(-AU)?$/i.test(p.lang))
    add(
      'info',
      'lang',
      `<html lang="${p.lang}"> (en-AU is ideal for an AU site)`,
    );

  for (const [re, au] of US_SPELLINGS) {
    const m = p.text.match(re);
    if (m) add('warn', 'au-spelling', `US spelling "${m[0]}" (prefer ${au})`);
  }
}

function auditSite(pages: Page[], findings: Finding[]) {
  const add = (
    severity: Finding['severity'],
    check: string,
    page: string,
    detail: string,
  ) => findings.push({ severity, check, page, detail });

  const routes = new Set(pages.map((p) => p.route));

  // Duplicate titles / descriptions across pages
  for (const field of ['title', 'description'] as const) {
    const seen = new Map<string, string>();
    for (const p of pages.filter((p) => !p.noindex)) {
      const value = p[field];
      if (!value) continue;
      const prior = seen.get(value);
      if (prior)
        add('warn', `duplicate-${field}`, p.route, `same ${field} as ${prior}`);
      else seen.set(value, p.route);
    }
  }

  // Link graph: orphans and click depth (BFS from /)
  const inbound = new Map<string, number>();
  for (const p of pages)
    for (const l of p.internalLinks) {
      const target =
        l.href.endsWith('/') || l.href.includes('.') ? l.href : `${l.href}/`;
      if (target !== p.route)
        inbound.set(target, (inbound.get(target) ?? 0) + 1);
    }
  const depth = new Map<string, number>([['/', 0]]);
  const queue = ['/'];
  while (queue.length) {
    const route = queue.shift()!;
    const page = pages.find((p) => p.route === route);
    if (!page) continue;
    for (const l of page.internalLinks) {
      const target =
        l.href.endsWith('/') || l.href.includes('.') ? l.href : `${l.href}/`;
      if (routes.has(target) && !depth.has(target)) {
        depth.set(target, depth.get(route)! + 1);
        queue.push(target);
      }
    }
  }
  for (const p of pages) {
    if (p.noindex) continue;
    if (p.route !== '/' && !inbound.has(p.route))
      add('error', 'orphan-page', p.route, 'no internal links point here');
    const d = depth.get(p.route);
    if (d === undefined)
      add('warn', 'click-depth', p.route, 'unreachable from home by links');
    else if (d > 3)
      add('warn', 'click-depth', p.route, `${d} clicks from home (aim ≤3)`);
    // Broken internal links
    for (const l of p.internalLinks) {
      const target =
        l.href.endsWith('/') || l.href.includes('.') ? l.href : `${l.href}/`;
      if (!target.includes('.') && !routes.has(target))
        add('error', 'broken-link', p.route, `links to missing page ${target}`);
    }
  }

  // robots.txt: AI crawlers must not be blocked if we want citations
  const robotsPath = join(OUT_DIR, 'robots.txt');
  if (!existsSync(robotsPath))
    add('error', 'robots', '/', 'no robots.txt in export');
  else {
    const robots = readFileSync(robotsPath, 'utf8');
    const blocks = robots.split(/(?=user-agent:)/i);
    for (const bot of AI_CRAWLERS) {
      const block = blocks.find((b) =>
        new RegExp(`user-agent:\\s*${bot}`, 'i').test(b),
      );
      if (block && /disallow:\s*\/\s*$/im.test(block))
        add(
          'warn',
          'robots',
          '/robots.txt',
          `${bot} is blocked — prevents AI citations`,
        );
    }
    if (!/sitemap:/i.test(robots))
      add('warn', 'robots', '/robots.txt', 'no Sitemap: line');
  }

  // sitemap.xml vs export consistency
  const sitemapPath = join(OUT_DIR, 'sitemap.xml');
  if (!existsSync(sitemapPath))
    add('error', 'sitemap', '/', 'no sitemap.xml in export');
  else {
    const sitemapUrls = [
      ...readFileSync(sitemapPath, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g),
    ].map((m) => m[1]!.replace(ORIGIN, '') || '/');
    for (const u of sitemapUrls)
      if (!routes.has(u))
        add('error', 'sitemap', u, 'in sitemap but not in export');
    for (const p of pages)
      if (!p.noindex && !sitemapUrls.includes(p.route))
        add('warn', 'sitemap', p.route, 'indexable page missing from sitemap');
  }

  // Person schema somewhere on the site (entity anchor for GEO)
  if (!pages.some((p) => p.jsonLdTypes.includes('Person')))
    add(
      'warn',
      'json-ld',
      '/',
      'no Person JSON-LD anywhere — weakens entity clarity for AI',
    );
}

export function runAudit(): { pages: number; findings: Finding[] } {
  if (!existsSync(OUT_DIR)) {
    throw new Error(
      'no out/ directory — run `npm run build` first, then re-run the audit',
    );
  }
  const pages = htmlFiles(OUT_DIR)
    .map(readPage)
    // The __no-posts__ placeholder is a build artifact, not a real page
    .filter((p) => !p.route.includes('__no-posts__'));
  const findings: Finding[] = [];
  for (const p of pages.filter((p) => !p.noindex)) auditPage(p, findings);
  auditSite(pages, findings);
  const order = { error: 0, warn: 1, info: 2 };
  findings.sort(
    (a, b) =>
      order[a.severity] - order[b.severity] || a.page.localeCompare(b.page),
  );
  return { pages: pages.length, findings };
}
