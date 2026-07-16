/**
 * AI adoption is the headline offering. This module drives the AI-led section
 * on the homepage and the detailed block on /services. First-person, plain,
 * grounded in tools James uses daily (Claude, M365 Copilot, GitHub Copilot).
 */

export const aiHeadline = 'Get AI working in your business.';

export const aiIntro =
  "AI is genuinely useful now, if you know where to point it. I use Claude, Microsoft 365 Copilot and GitHub Copilot every day, at Australia Post and in my own product work, and I help other businesses do the same. Not a demo that impresses once, but tools your team actually reaches for on a Tuesday.";

export type AiOffering = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  youGet: string[];
  outcome: string;
};

export const aiOfferings: AiOffering[] = [
  {
    slug: 'ai-assessment',
    title: 'AI business assessment',
    tagline: 'Find the biggest wins before you spend a dollar.',
    description:
      'I sit with your team, look at how the work really flows, and find where AI would save the most time and money. You get a clear written report: your biggest pain points, ranked, and exactly where AI can help, with honest calls on what to skip.',
    youGet: [
      'A walkthrough of how your business actually works day to day',
      'Your pain points identified and ranked by impact and effort',
      'A written report with specific, costed AI recommendations',
      'A practical roadmap you can act on with or without me',
    ],
    outcome:
      'You know exactly where AI pays off, and where it does not, before committing time or budget.',
  },
  {
    slug: 'ai-skills',
    title: 'AI skills that automate your work',
    tagline: 'Turn repetitive work into a button.',
    description:
      'I build reusable AI "skills": packaged prompts, tools and small automations that do a real job in your workflow. Drafting the quote, triaging the inbox, turning notes into a report, checking a document against your rules. Built for your business, so they fit how you already work.',
    youGet: [
      'AI skills built around your real, repeatable tasks',
      'Connected to the tools you already use where it helps',
      'Guardrails so the output is safe to trust',
      'Handover and training so your team can run and tweak them',
    ],
    outcome:
      'The dull, repetitive parts of the day get faster, more consistent, and off your team\'s plate.',
  },
  {
    slug: 'ai-systems',
    title: 'AI systems, set up right',
    tagline: 'Claude, OpenAI or Copilot, working for you.',
    description:
      'Choosing and rolling out the right AI platform is where most businesses stall. I help you pick between Claude, OpenAI and Microsoft Copilot for your needs, get it set up securely, and show your team how to actually use it, with the settings, accounts and habits that make it stick.',
    youGet: [
      'Straight advice on which platform fits your business and budget',
      'Secure setup of Claude, OpenAI or Microsoft 365 Copilot',
      'Team training that turns access into everyday use',
      'Sensible policies so staff use AI safely with your data',
    ],
    outcome:
      'Your team is up and running on the right AI platform, using it with confidence.',
  },
];

/** The tools James works in daily, shown as trust signals. */
export const aiTools = ['Claude', 'OpenAI', 'Microsoft 365 Copilot', 'GitHub Copilot'];
