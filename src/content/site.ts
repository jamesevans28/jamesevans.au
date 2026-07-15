/**
 * Site-wide configuration and identity. Single source of truth for
 * name, contact, nav, and stats used across pages, metadata, and JSON-LD.
 */

export const site = {
  name: 'James Evans',
  domain: 'jamesevans.au',
  url: 'https://jamesevans.au',
  // Trading as James Evans (personal name). ABN pending; add when issued.
  tradingName: 'James Evans',
  abn: null as string | null,
  location: 'Melbourne, Australia',
  // Domain email via forwarding; the personal Gmail is never published.
  email: 'hello@jamesevans.au',
  linkedin: 'https://www.linkedin.com/in/-jamesevans/',
  tagline: 'Twenty-five years of making technology work.',
  intro:
    "By day I lead the engineering behind Australia Post's Point of Sale in around 4,000 stores. Beyond it I build apps, bring AI into everyday work, and give straight answers to businesses and people who need tech done right.",
  description:
    'James Evans is a Melbourne software engineering leader with 25 years of experience. Custom web and mobile apps, AI adoption, technology consulting, and hands-on tech help for businesses and individuals.',
} as const;

export const navLinks = [
  { href: '/services/', label: 'Services' },
  { href: '/experience/', label: 'Experience' },
  { href: '/work/', label: 'Work' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
] as const;

export type Stat = { value: string; label: string };

export const stats: Stat[] = [
  { value: '25 yrs', label: 'in software engineering' },
  { value: '~4,000', label: "stores running my team's Point of Sale" },
  { value: '150', label: "engineers launched via Telstra's graduate program" },
  { value: '250k+', label: 'assets captured by Audify, built end-to-end' },
];
