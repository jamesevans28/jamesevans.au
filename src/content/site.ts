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
  tagline: 'Software engineering and AI adoption, done properly.',
  intro:
    "Twenty-five years building software and leading the teams that build it, now including the technology behind Australia Post's Point of Sale in around 4,000 stores. I design and ship real products, and I help businesses adopt AI in a way that actually sticks. Two things I do well, and they make each other better.",
  description:
    'James Evans is a Melbourne software engineering leader with 25 years of experience. Custom web and mobile apps, engineering leadership, and practical AI adoption: assessments, workflow automation, and setting up Claude, OpenAI and Microsoft Copilot.',
} as const;

export const navLinks = [
  { href: '/services/', label: 'Services' },
  { href: '/experience/', label: 'Resume' },
  { href: '/work/', label: 'Work' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
] as const;

export type Stat = { value: string; label: string };

export const stats: Stat[] = [
  { value: '25 yrs', label: 'in software engineering' },
  { value: '~4,000', label: "stores running my team's Point of Sale" },
  { value: '250k+', label: 'assets captured by Audify, built end-to-end' },
  { value: 'Daily', label: 'hands-on with Claude, Copilot and OpenAI' },
];
