/**
 * Case studies in problem → approach → outcome shape. Kairos Strategies and
 * Audify are named with James's permission (Jul 2026). Keep customer names and
 * internal audit details out; use demo-tenant data for any screenshots.
 */

export type CaseStudy = {
  slug: string;
  name: string;
  role: string;
  client?: string;
  clientUrl?: string;
  tags: string[];
  problem: string;
  approach: string;
  outcome: string;
  metrics?: { value: string; label: string }[];
  featured?: boolean;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: 'audify',
    name: 'Audify',
    role: 'Designed, built and still run end to end',
    client: 'Kairos Strategies',
    clientUrl: 'https://kairosstrategies.com.au',
    tags: [
      'React',
      'React Native / Expo',
      'Firestore',
      'Google Cloud',
      'AI pipeline',
      'Offline-first',
    ],
    problem:
      'Field auditors need to capture asset and condition data on-site, often on long shifts with no reliable connectivity, and turn it into reporting that national contracts depend on.',
    approach:
      'A multi-tenant platform built from the ground up: an offline-first web app and native iOS/Android apps sharing a Firestore backend on Google Cloud (Australian data residency). A crash-safe photo queue, a custom audit form builder, QR asset lookup, an AI defect-detection pipeline, Excel reporting and multi-environment deployments.',
    outcome:
      'A production system trusted on national government contracts, capturing hundreds of thousands of asset records, and still maintained and evolved today.',
    metrics: [
      { value: '250k+', label: 'asset records captured' },
      { value: '2', label: 'native platforms + web, one codebase' },
      { value: 'Offline', label: 'first, for real field conditions' },
    ],
    featured: true,
  },
  {
    slug: 'point-of-sale-at-scale',
    name: 'Point of Sale at national scale',
    role: 'Engineering Manager, Australia Post',
    tags: ['Retail', 'High availability', 'Team leadership'],
    problem:
      'A national retailer needs its point-of-sale system to work in every store, every day, with a team that can deliver change safely against that reliability bar.',
    approach:
      'Leading the engineering team that owns the POS platform across the retail network, balancing delivery cadence, reliability and hands-on technical direction, with AI developer tooling adopted across the team.',
    outcome:
      'Point of Sale running across around 4,000 stores, with engineering delivery focused on keeping a business-critical system dependable.',
    metrics: [{ value: '~4,000', label: 'stores' }],
    featured: true,
  },
  {
    slug: 'crm-migration-robots',
    name: 'Migrating 200,000 customers by robot',
    role: 'Senior Software Engineer, Telstra',
    tags: ['Automation', 'OpenSpan', 'Scale'],
    problem:
      'Two hundred thousand customers had to move between two CRMs, a volume that would cost a fortune and take forever to do by hand.',
    approach:
      'A front-end automation solution on a fleet of 50 robot machines running 24/7, driving the migration through the existing UIs with OpenSpan (a technology learnt for the project).',
    outcome:
      'The full migration completed automatically, saving over $500k in manual effort.',
    metrics: [
      { value: '200k', label: 'customers migrated' },
      { value: '$500k+', label: 'manual effort saved' },
      { value: '50', label: 'robots, running 24/7' },
    ],
  },
  {
    slug: 'project-tracker',
    name: 'Project tracker for 300 daily users',
    role: 'Senior Software Engineer, Telstra',
    tags: ['PHP', 'Angular', 'MySQL', 'AWS'],
    problem:
      'Teams were tracking and reporting on projects by hand, losing hours every week to admin.',
    approach:
      'A project tracking and reporting application designed and built from the ground up in PHP, Angular and MySQL, hosted on AWS.',
    outcome:
      'Over 300 daily users, saving an estimated 1 to 2 hours per person per week.',
    metrics: [
      { value: '300+', label: 'daily users' },
      { value: '1-2 hrs', label: 'saved per person per week' },
    ],
  },
];

export const featuredCaseStudies = caseStudies.filter((c) => c.featured);
