/**
 * Single source of truth for the Voltage palette, mirroring the tokens in
 * globals.css. The contrast test (contrast.test.ts) asserts every pairing
 * used in the UI meets WCAG AA, so the design system cannot regress below
 * accessible contrast. If you change a value here, change it in globals.css.
 */

// Text placed on flare/citrus fills is always this near-black, in BOTH
// themes — white-on-coral and white-on-yellow both fail AA. See contrast.test.
export const ON_ACCENT_INK = '#0c0c18';

export const lightPalette = {
  paper: '#ffffff',
  surface: '#f4f5fb',
  ink: '#0e0e1a',
  inkMuted: '#4e4e66',
  volt: '#2337ff',
  voltDeep: '#1723b8',
  flare: '#ff4d2e',
  citrus: '#ffc400',
  line: '#e3e5f0',
  onAccent: ON_ACCENT_INK,
} as const;

export const darkPalette = {
  paper: '#0c0c18',
  surface: '#16162b',
  ink: '#f2f2fa',
  inkMuted: '#9c9cb8',
  volt: '#7c89ff',
  voltDeep: '#2a2a45',
  flare: '#ff7a5c',
  citrus: '#ffd23f',
  line: '#2a2a45',
  onAccent: ON_ACCENT_INK,
} as const;

export type PaletteKey = keyof typeof lightPalette;
