/** The service offerings, plus how engagement works. */

export type Service = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  youGet: string[];
  forWho: string;
};

export const services: Service[] = [
  {
    slug: 'ai-adoption',
    title: 'AI adoption',
    tagline: 'Put AI to work in your business, sensibly.',
    description:
      'I help teams fold AI into the way they already work, using it every day myself across the tools that matter: Claude, Microsoft 365 Copilot and GitHub Copilot. Practical wins, not hype, with a clear eye on where AI helps and where it does not.',
    youGet: [
      'A review of where AI can genuinely save you time',
      'Hands-on setup of Claude, M365 Copilot and GitHub Copilot',
      'Workflows, prompts and guardrails your team will actually use',
    ],
    forWho:
      'Businesses and teams that want to adopt AI properly, without the guesswork.',
  },
  {
    slug: 'software-development',
    title: 'Software development',
    tagline: 'Web and mobile apps, built end to end.',
    description:
      'Design, build, host and maintain real products, not prototypes. Twenty-five years of shipping software, from a single form to a multi-tenant platform, increasingly with AI built in where it earns its place.',
    youGet: [
      'Web and mobile apps designed and built from scratch',
      'AI features built in where they add real value',
      'Cloud hosting set up properly (AWS or Google Cloud)',
      'Ongoing maintenance and support you can rely on',
    ],
    forWho: 'Businesses that need a custom app built right and kept running.',
  },
  {
    slug: 'advice-consulting',
    title: 'Technology advice and consulting',
    tagline: 'A senior engineering brain, on call.',
    description:
      "Fractional engineering leadership for teams that don't have a CTO. Architecture reviews, build-vs-buy calls, vendor selection, an AI strategy that fits your business, and help hiring the right people.",
    youGet: [
      'Architecture and code reviews with clear recommendations',
      'An AI strategy grounded in what actually works',
      '“Should we build or buy?” answered honestly',
      'Vendor selection and hiring support',
    ],
    forWho: 'Small businesses and founders making big technology decisions.',
  },
  {
    slug: 'tech-problems',
    title: 'Tech problems, solved',
    tagline: 'The stuff that just needs to work.',
    description:
      'Slow machines, backups that never ran, email that broke, networks that drop out, migrations that stalled. Fixed properly, and explained in plain English.',
    youGet: [
      'Diagnosis and a proper fix, not a band-aid',
      'Backups, email, networking and migrations sorted',
      'Everything explained so you understand what happened',
    ],
    forWho: 'Anyone tired of tech that fights them.',
  },
  {
    slug: 'hardware-installations',
    title: 'Hardware and installations',
    tagline: 'Set up once, done right.',
    description:
      'Machines, upgrades, networks, devices and point-of-sale gear, specified, installed and configured. The day-job domain, at your place.',
    youGet: [
      'Hardware specified and supplied to suit the job',
      'Networks and devices installed and configured',
      'Point-of-sale and retail tech set up and tested',
    ],
    forWho: 'Businesses and individuals setting up or upgrading.',
  },
];

export const engagementSteps = [
  {
    title: 'Chat',
    body: 'A no-obligation conversation about what you need and where you are stuck.',
  },
  {
    title: 'Scope',
    body: 'I map out the work and the options, with the trade-offs laid out plainly.',
  },
  {
    title: 'Quote',
    body: 'A fixed quote for defined work, or an hourly rate for open-ended help.',
  },
  {
    title: 'Deliver',
    body: 'The work gets done, you stay informed, and I stand behind it afterwards.',
  },
] as const;

export const serviceArea =
  'Melbourne for on-site work; remote anywhere in Australia and beyond.';
