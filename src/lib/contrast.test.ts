import { describe, it, expect } from 'vitest';
import { contrastRatio, hexToRgb, AA_NORMAL, AA_LARGE } from './contrast';
import { lightPalette, darkPalette } from './palette';

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('returns 1 for identical colours', () => {
    expect(contrastRatio('#2337ff', '#2337ff')).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#0e0e1a', '#ffffff')).toBeCloseTo(
      contrastRatio('#ffffff', '#0e0e1a'),
      5,
    );
  });
});

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#ff4d2e')).toEqual({ r: 255, g: 77, b: 46 });
  });

  it('expands 3-digit shorthand', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('throws on invalid hex', () => {
    expect(() => hexToRgb('#zzz')).toThrow();
    expect(() => hexToRgb('#12')).toThrow();
  });
});

/**
 * The design system cannot regress below accessible contrast. Each entry is a
 * [foreground, background] pairing actually used in the UI, with the WCAG
 * threshold it must clear.
 */
describe.each([
  ['light', lightPalette],
  ['dark', darkPalette],
] as const)('%s theme meets WCAG AA', (themeName, p) => {
  const normalTextPairs: Array<[string, string, string]> = [
    ['ink on paper', p.ink, p.paper],
    ['ink on surface', p.ink, p.surface],
    ['ink-muted on paper', p.inkMuted, p.paper],
    ['ink-muted on surface', p.inkMuted, p.surface],
    ['volt on paper', p.volt, p.paper],
    ['volt on surface', p.volt, p.surface],
    // Accent fills carry the fixed on-accent ink, NOT the theme ink.
    ['on-accent on flare (CTA)', p.onAccent, p.flare],
    ['on-accent on citrus (marker)', p.onAccent, p.citrus],
    // Ghost button hover: paper text on a volt fill.
    ['paper on volt (ghost hover)', p.paper, p.volt],
    // Article prose (.prose-volt in globals.css): body copy, links and the
    // table header / code-block surface.
    ['volt on paper (prose link)', p.volt, p.paper],
    ['ink-muted on paper (prose body)', p.inkMuted, p.paper],
    ['ink on surface (prose th / pre)', p.ink, p.surface],
  ];

  it.each(normalTextPairs)('%s ≥ 4.5:1', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it('paper vs ink is a strong pairing (large UI) ≥ 3:1', () => {
    expect(contrastRatio(p.paper, p.ink)).toBeGreaterThanOrEqual(AA_LARGE);
  });

  it('flare is not usable as prose text on paper', () => {
    // Documents why the prose link hover thickens the underline instead of
    // recolouring to flare: it fails AA for normal text in the light theme.
    // If this ever passes in BOTH themes, flare text becomes an option again.
    const ratio = contrastRatio(p.flare, p.paper);
    if (themeName === 'light') {
      expect(ratio).toBeLessThan(AA_NORMAL);
    }
  });
});
