/**
 * Generates public/og/blog/<slug>.png — one branded share image per post.
 *
 * Runs as part of `npm run build` (prebuild), reading the same post source the
 * site does, so a newly published post always has its OG image before the
 * pages that reference it are exported. Existing images are reused unless
 * --force is passed, keeping incremental builds quick.
 *
 * Voltage styling matches scripts/generate-og.mjs: deep ink ground, spark
 * strokes, bold headline, citrus rule.
 */
import sharp from 'sharp';
import { mkdirSync, existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import matter from 'gray-matter';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = resolve(root, 'public/og/blog');

const W = 1200;
const H = 630;
const force = process.argv.includes('--force');

// ---- Post sources -------------------------------------------------------
// Mirrors src/lib/blog.ts: DynamoDB for published posts, plus local drafts
// when explicitly enabled. Kept as a standalone reader so this script has no
// dependency on the Next build graph.

async function fromDynamo() {
  if (process.env.BLOG_SOURCE === 'local') return [];
  let docClient;
  let QueryCommand;
  try {
    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
    const lib = await import('@aws-sdk/lib-dynamodb');
    QueryCommand = lib.QueryCommand;
    docClient = lib.DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: process.env.AWS_REGION ?? 'ap-southeast-2',
      }),
    );
  } catch {
    return [];
  }

  const table = process.env.BLOG_TABLE ?? 'jamesevans.au-blog';
  const posts = [];
  let cursor;
  try {
    do {
      const page = await docClient.send(
        new QueryCommand({
          TableName: table,
          IndexName: 'by-status',
          KeyConditionExpression: 'gsi1pk = :s',
          ExpressionAttributeValues: { ':s': 'published' },
          ExclusiveStartKey: cursor,
        }),
      );
      for (const item of page.Items ?? []) {
        posts.push({ slug: item.slug, title: item.title, publishedAt: item.publishedAt });
      }
      cursor = page.LastEvaluatedKey;
    } while (cursor);
  } catch (err) {
    console.warn(`[og] DynamoDB unavailable (${err.name}) — skipping remote posts.`);
    return [];
  }
  return posts;
}

function fromDrafts() {
  const includeDrafts =
    process.env.BLOG_INCLUDE_DRAFTS === '1' ||
    process.env.NODE_ENV === 'development';
  if (!includeDrafts) return [];

  const dir = resolve(root, 'content-drafts');
  if (!existsSync(dir)) return [];

  const posts = [];
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.md')) continue;
    const { data } = matter(readFileSync(resolve(dir, file), 'utf8'));
    if (data.slug && data.title) {
      posts.push({ slug: data.slug, title: data.title, publishedAt: data.publishedAt });
    }
  }
  return posts;
}

// ---- Rendering ----------------------------------------------------------

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic seed from the slug, so an image is stable across rebuilds. */
function seedFrom(slug) {
  let h = 0;
  for (const ch of slug) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  return Math.abs(h) || 1;
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Greedy wrap on an approximate glyph width — good enough for a headline. */
function wrapTitle(title, maxChars = 26) {
  const words = title.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  // Four lines is the most that fits; truncate rather than overflow the card.
  if (lines.length > 4) {
    return [...lines.slice(0, 3), `${lines[3].slice(0, maxChars - 1)}…`];
  }
  return lines;
}

function buildSvg({ title, publishedAt }) {
  const rng = mulberry32(seedFrom(title));
  let sparks = '';
  for (let i = 0; i < 34; i++) {
    const x = rng() * W;
    const y = rng() * H;
    const len = 20 + rng() * 55;
    sparks += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + len).toFixed(1)}" y2="${(y - len * 1.6).toFixed(1)}" stroke="#7c89ff" stroke-width="3" stroke-linecap="round" opacity="0.12"/>`;
  }

  const lines = wrapTitle(title);
  const fontSize = lines.length >= 4 ? 62 : lines.length === 3 ? 70 : 78;
  const lineHeight = fontSize * 1.14;
  // Vertically centre the block in the area below the eyebrow.
  const blockTop = 250 - ((lines.length - 1) * lineHeight) / 2;

  const titleSvg = lines
    .map(
      (line, i) =>
        `<text x="86" y="${(blockTop + i * lineHeight).toFixed(1)}" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" font-weight="800" fill="#f2f2fa">${escapeXml(line)}</text>`,
    )
    .join('');

  const dateLabel = publishedAt
    ? new Intl.DateTimeFormat('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(publishedAt))
    : '';

  return `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#0c0c18"/>
  ${sparks}
  <rect x="86" y="70" width="64" height="8" fill="#ffc400"/>
  <text x="86" y="130" font-family="Arial, sans-serif" font-size="25" font-weight="700" letter-spacing="4" fill="#7c89ff">JAMES EVANS · BLOG</text>
  ${titleSvg}
  <text x="86" y="545" font-family="Arial, sans-serif" font-size="26" font-weight="600" fill="#9c9cb8">${escapeXml(dateLabel)}</text>
  <text x="${W - 86}" y="545" text-anchor="end" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#ff4d2e">jamesevans.au</text>
</svg>`;
}

// ---- Main ---------------------------------------------------------------

const posts = [...(await fromDynamo()), ...fromDrafts()];

// De-dupe: a local draft of an already-published post shadows the remote copy.
const bySlug = new Map(posts.map((p) => [p.slug, p]));

if (bySlug.size === 0) {
  console.log('[og] no posts found — nothing to generate.');
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });

// Drop images for posts that no longer exist, so unpublishing removes its card.
const wanted = new Set([...bySlug.keys()].map((slug) => `${slug}.png`));
for (const file of readdirSync(outDir)) {
  if (file.endsWith('.png') && !wanted.has(file)) {
    rmSync(resolve(outDir, file));
    console.log(`[og] removed stale ${file}`);
  }
}

let written = 0;
let skipped = 0;
for (const post of bySlug.values()) {
  const target = resolve(outDir, `${post.slug}.png`);
  if (!force && existsSync(target)) {
    skipped++;
    continue;
  }
  await sharp(Buffer.from(buildSvg(post))).png().toFile(target);
  written++;
  console.log(`[og] wrote public/og/blog/${post.slug}.png`);
}

console.log(
  `[og] blog OG images: ${written} written, ${skipped} up to date (${bySlug.size} posts).`,
);
