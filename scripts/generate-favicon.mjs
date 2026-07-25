/**
 * Generates the site icons from a single vector JE monogram.
 *
 *   public/favicon.ico          16/32/48 multi-size, for legacy browsers
 *   public/icon.svg             scalable, what modern browsers prefer
 *   public/icon-192.png         Android / PWA
 *   public/icon-512.png         Android / PWA, splash
 *   public/apple-icon.png       180x180, iOS home screen (opaque, padded)
 *
 * Run via `npm run favicon`. Re-run if the palette changes.
 *
 * The letters are hand-built vector paths rather than SVG <text>. Bricolage
 * Grotesque ships as a woff2 for the browser but is not installed
 * system-wide, so sharp/librsvg would silently substitute a different face
 * (this is the same reason generate-og.mjs falls back to Georgia). Paths keep
 * the mark identical everywhere and stay legible at 16px.
 *
 * Design: volt ground, paper letterforms. Just the monogram; no trailing dot.
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const publicDir = resolve(root, 'public');

// Voltage tokens (mirrors src/lib/palette.ts).
const VOLT = '#2337ff';
const PAPER = '#ffffff';

/**
 * Monogram on a 100x100 grid.
 *
 * Geometric slab forms, deliberately heavy: at 16px anything lighter than
 * ~9 units of stroke turns to mush. The J and E share a baseline and cap
 * height.
 */
const STROKE = 11; // stem thickness
const CAP_TOP = 26;
const BASELINE = 74;

// --- J: vertical stem with a foot hooking left ---
const J_RIGHT = 45;
const J_STEM_X = J_RIGHT - STROKE;
const J_HOOK_LEFT = 21;
const J_HOOK_TOP = BASELINE - STROKE;

const jPath = [
  `M ${J_STEM_X} ${CAP_TOP}`,
  `H ${J_RIGHT}`,
  `V ${BASELINE}`,
  `H ${J_HOOK_LEFT}`,
  `V ${J_HOOK_TOP}`,
  `H ${J_STEM_X}`,
  'Z',
].join(' ');

// --- E: vertical stem with three arms ---
// Tucked close to the J: at 16px a wide gap reads as two separate marks.
const E_LEFT = 51;
const E_RIGHT = 76;
const E_STEM_R = E_LEFT + STROKE;
const MID_TOP = 44;
const MID_BOT = MID_TOP + STROKE - 1; // mid arm slightly lighter, as in type

const ePath = [
  // stem
  `M ${E_LEFT} ${CAP_TOP}`,
  `H ${E_RIGHT}`,
  `V ${CAP_TOP + STROKE}`,
  `H ${E_STEM_R}`,
  `V ${MID_TOP}`,
  `H ${E_RIGHT - 4}`,
  `V ${MID_BOT}`,
  `H ${E_STEM_R}`,
  `V ${BASELINE - STROKE}`,
  `H ${E_RIGHT}`,
  `V ${BASELINE}`,
  `H ${E_LEFT}`,
  'Z',
].join(' ');

/**
 * Horizontal nudge to optically centre the drawn ink. The paths are laid out
 * left-to-right from the J's hook, so shift the group rather than hand-tuning
 * every coordinate.
 */
const CENTRING_SHIFT = (100 - (E_RIGHT - J_HOOK_LEFT)) / 2 - J_HOOK_LEFT;

/**
 * Build the icon SVG.
 * @param {object} opts
 * @param {number} opts.size    output pixel size
 * @param {number} opts.radius  corner radius on the 100-grid (0 = square)
 * @param {number} opts.inset   padding on the 100-grid (iOS wants none)
 */
function icon({ size, radius = 22, inset = 0 }) {
  const span = 100 - inset * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="${VOLT}"${radius ? ` rx="${radius}" ry="${radius}"` : ''}/>
  <g transform="translate(${inset} ${inset}) scale(${span / 100})">
    <g transform="translate(${CENTRING_SHIFT.toFixed(2)} 0)">
      <path d="${jPath}" fill="${PAPER}"/>
      <path d="${ePath}" fill="${PAPER}"/>
    </g>
  </g>
</svg>`;
}

/**
 * Dedicated 16px artwork, drawn on a 16-unit grid so every edge lands on a
 * whole pixel.
 *
 * Scaling the 100-grid mark down to 16px puts every stem edge on a fractional
 * boundary (a 11-unit stroke becomes 1.76px), and the antialiasing smears the
 * J into the E. Browsers still show a 16px favicon in the tab, so it is worth
 * hand-fitting rather than accepting the blur.
 *
 * Layout: 2px stems, 1px counters, J hook and E arms all on integers.
 *
 *   x:  2 3 4 5 6 7 8 9 10 11 12 13
 *   J stem at x=5..6, hook foot x=2..6
 *   E stem at x=8..9, arms reach to x=12
 */
function icon16() {
  const P = PAPER;
  const r = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${P}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" shape-rendering="crispEdges">
  <rect width="16" height="16" rx="3" ry="3" fill="${VOLT}"/>
  ${r(5, 3, 2, 9)}${r(2, 10, 3, 2)}
  ${r(8, 3, 2, 9)}${r(10, 3, 3, 2)}${r(10, 7, 2, 1)}${r(10, 10, 3, 2)}
</svg>`;
}

mkdirSync(publicDir, { recursive: true });

// Scalable icon: modern browsers prefer this and it stays crisp at any size.
writeFileSync(resolve(publicDir, 'icon.svg'), `${icon({ size: 100 })}\n`, 'utf8');
console.log('[favicon] wrote public/icon.svg');

// PNG raster sizes.
const pngs = [
  { file: 'icon-192.png', size: 192, opts: {} },
  { file: 'icon-512.png', size: 512, opts: {} },
  // iOS masks its own corners and shows no transparency, so square + padded.
  { file: 'apple-icon.png', size: 180, opts: { radius: 0, inset: 10 } },
];

for (const { file, size, opts } of pngs) {
  await sharp(Buffer.from(icon({ size, ...opts })))
    .png()
    .toFile(resolve(publicDir, file));
  console.log(`[favicon] wrote public/${file} (${size}x${size})`);
}

/**
 * favicon.ico with 16/32/48 frames, written by hand.
 *
 * sharp cannot emit .ico, and the format is simple enough not to justify a
 * dependency: a 6-byte header, a 16-byte directory entry per image, then the
 * PNG payloads. Modern Windows and all browsers accept PNG-compressed frames.
 */
const icoSizes = [16, 32, 48];
const frames = await Promise.all(
  icoSizes.map(async (size) => ({
    size,
    // 16px uses the hand-fitted pixel grid; larger frames scale the vector.
    data: await sharp(Buffer.from(size === 16 ? icon16() : icon({ size, radius: 16 })))
      .png()
      .toBuffer(),
  })),
);

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type 1 = icon
header.writeUInt16LE(frames.length, 4);

let offset = 6 + frames.length * 16;
const entries = [];
for (const frame of frames) {
  const entry = Buffer.alloc(16);
  // 0 means 256 in the ICO format; our sizes are all under that.
  entry.writeUInt8(frame.size === 256 ? 0 : frame.size, 0); // width
  entry.writeUInt8(frame.size === 256 ? 0 : frame.size, 1); // height
  entry.writeUInt8(0, 2); // palette count
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(frame.data.length, 8);
  entry.writeUInt32LE(offset, 12);
  entries.push(entry);
  offset += frame.data.length;
}

writeFileSync(
  resolve(publicDir, 'favicon.ico'),
  Buffer.concat([header, ...entries, ...frames.map((f) => f.data)]),
);
console.log(
  `[favicon] wrote public/favicon.ico (${icoSizes.join(', ')}px frames)`,
);
