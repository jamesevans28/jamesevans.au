/**
 * Generates public/og.png — the social share image. Branded Voltage card:
 * deep ink ground, spark strokes, Bricolage-style bold headline, duotone
 * portrait cutout on citrus. Run via `npm run og`. Regenerate if the
 * portrait or wording changes.
 */
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const W = 1200;
const H = 630;

const portrait = readFileSync(resolve(root, 'public/images/portrait.jpg'));
const portraitB64 = portrait.toString('base64');

// Deterministic spark strokes.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(11);
let sparks = '';
for (let i = 0; i < 40; i++) {
  const x = rng() * W;
  const y = rng() * H;
  const len = 20 + rng() * 60;
  sparks += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + len).toFixed(1)}" y2="${(y - len * 1.6).toFixed(1)}" stroke="#7c89ff" stroke-width="3" stroke-linecap="round" opacity="0.12"/>`;
}

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <clipPath id="circle"><circle cx="960" cy="315" r="150"/></clipPath>
    <filter id="gray"><feColorMatrix type="saturate" values="0"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="#0c0c18"/>
  ${sparks}
  <!-- citrus disc behind portrait -->
  <circle cx="960" cy="315" r="176" fill="#ffc400"/>
  <image href="data:image/jpeg;base64,${portraitB64}" x="810" y="165" width="300" height="300" clip-path="url(#circle)" filter="url(#gray)" preserveAspectRatio="xMidYMid slice"/>
  <circle cx="960" cy="315" r="150" fill="#2337ff" opacity="0.28" clip-path="url(#circle)"/>

  <text x="90" y="150" font-family="Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="4" fill="#7c89ff">JAMES EVANS · MELBOURNE</text>
  <text x="86" y="300" font-family="Georgia, 'Times New Roman', serif" font-size="86" font-weight="800" fill="#f2f2fa">Making</text>
  <text x="86" y="390" font-family="Georgia, 'Times New Roman', serif" font-size="86" font-weight="800" fill="#f2f2fa">technology</text>
  <text x="86" y="480" font-family="Georgia, 'Times New Roman', serif" font-size="86" font-weight="800" fill="#7c89ff">work<tspan fill="#ff4d2e">.</tspan></text>

  <text x="90" y="560" font-family="Arial, sans-serif" font-size="28" font-weight="600" fill="#9c9cb8">Software · apps · advice · tech help</text>
</svg>
`;

await sharp(Buffer.from(svg)).png().toFile(resolve(root, 'public/og.png'));
console.log('Wrote public/og.png (1200×630)');
