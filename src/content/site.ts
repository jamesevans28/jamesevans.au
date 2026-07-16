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
  tagline: 'Helping businesses put AI to work.',
  intro:
    "I help businesses adopt AI in a way that actually sticks. Assessing where it pays off, building AI skills that automate real work, and getting Claude, OpenAI or Copilot running for your team. Backed by twenty-five years of engineering, including leading the technology behind Australia Post's Point of Sale in around 4,000 stores.",
  description:
    'James Evans helps Melbourne businesses adopt AI: assessments, workflow automation, and setting up Claude, OpenAI and Microsoft Copilot. Backed by 25 years of software engineering, plus custom apps and hands-on tech help.',
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
  { value: 'Daily', label: 'hands-on with Claude, Copilot and OpenAI' },
  { value: '25 yrs', label: 'in software engineering' },
  { value: '~4,000', label: "stores running my team's Point of Sale" },
  { value: '250k+', label: 'assets captured by Audify, built end-to-end' },
];
