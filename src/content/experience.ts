/**
 * The online resume as typed data — single source of truth for the
 * Experience page, homepage stats, JSON-LD, and (later) the generated PDF.
 * Editing your resume = editing this file.
 *
 * Note: the original CV listed Telstra as the current role and dated the
 * Chapter Lead Principal position as "Present". That is corrected here —
 * Australia Post (from Nov 2023) is the current role.
 */

export type Role = {
  company: string;
  title: string;
  start: string; // ISO YYYY-MM
  end: string | 'present';
  location: string;
  summary: string;
  highlights?: string[];
};

export const currentRole: Role = {
  company: 'Australia Post',
  title: 'Engineering Manager — Point of Sale',
  start: '2023-11',
  end: 'present',
  location: 'Melbourne',
  summary:
    "I lead the engineering team behind Australia Post's Point of Sale system across the retail network — around 4,000 stores. My focus is delivery, team leadership and reliability for a system that has to work every day, in every store.",
  highlights: [
    'Own engineering delivery for the POS platform used across ~4,000 retail outlets.',
    'Lead and grow the engineering team, balancing hands-on technical direction with people leadership.',
    'Drive delivery cadence and reliability for a business-critical, high-availability retail system.',
  ],
};

export const roles: Role[] = [
  currentRole,
  {
    company: 'Telstra',
    title: 'Chapter Lead Principal (General Manager)',
    start: '2022-08',
    end: '2023-11',
    location: 'Melbourne',
    summary:
      'Led the Employee Experience Engineers across three chapters (30 staff), partnering closely with Product Owners, orchestrating resourcing, running OPEX vs CAPEX analysis and forecasting — while staying hands-on in code.',
    highlights: [
      "Ran Telstra's Software Engineering Graduate Program — 150 engineers across Australia and India, from interview through onboarding and training.",
      'Implemented a global resourcing strategy that lifted offshore exposure 15% and reduced costs by ~$200k p.a.',
      'Negotiated resource-partner agreements for a 9% rate reduction; delivered 5% year-on-year budget reductions.',
      'Raised engineering standards through CI/CD patterns, metrics, peer programming and code review.',
    ],
  },
  {
    company: 'Telstra',
    title: 'Engineering Chapter Lead',
    start: '2019-08',
    end: '2022-08',
    location: 'Melbourne',
    summary:
      "A pioneering Chapter Lead during Telstra's move to Scaled Agile, building and running a chapter of 20 engineers responsible for Telstra's Employee Tools — email, M365, device management, collaboration apps and HR systems.",
    highlights: [
      'Transformed the Employee Tools team into an Agile-at-scale model across software and hardware.',
      'Designed a learning framework for new engineers that drew onboarding demand from other business units.',
      'Increased permanent staff ratio by 30% and strengthened the on-call roster for critical systems.',
    ],
  },
  {
    company: 'Telstra',
    title: 'Senior Software Engineer',
    start: '2013-12',
    end: '2019-08',
    location: 'Melbourne',
    summary:
      'Designed, built and maintained complex software across the Workplace Technology teams, mentored junior engineers, and architected secure solutions to hard problems.',
    highlights: [
      'Built a project tracking & reporting app (PHP, Angular, MySQL on AWS) with 300+ daily users, saving 1–2 hours per person per week.',
      "Led a front-end automation solution migrating 200,000 customers between CRMs on a 50-machine OpenSpan robot fleet running 24/7 — saving over $500k in manual effort.",
      'Architected a head-office reception display showing live floor and desk availability from network traffic.',
    ],
  },
  {
    company: 'Telstra',
    title: 'Application Development Manager',
    start: '2012-06',
    end: '2013-12',
    location: 'Melbourne',
    summary:
      'Led a configuration team on the NICE product suite, transitioned development from vendor to a new in-house team, and introduced a successful Agile approach with fortnightly production releases.',
  },
  {
    company: 'NICE Systems',
    title: 'Senior Application Consultant',
    start: '2011-04',
    end: '2012-06',
    location: 'Melbourne',
    summary:
      "Sole representative for the Australasian region, managing customer support expectations and meeting SLAs for NICE's performance-management software suite.",
  },
];

/** Earlier career, shown compactly. */
export const earlierRoles = [
  { years: '2009–2011', title: 'Application Support', company: 'Australian Air Express', location: 'Melbourne' },
  { years: '2008–2009', title: 'Application Support', company: 'Merced Systems', location: 'London' },
  { years: '2007–2008', title: 'Quality Assurance', company: 'SEGA Europe', location: 'London' },
  { years: '2005–2007', title: 'Business Analyst', company: 'Fonterra', location: 'New Zealand' },
  { years: '2002–2005', title: 'Support Analyst', company: 'Fonterra', location: 'New Zealand' },
] as const;

export const skills = [
  'C# / .NET',
  'JavaScript — React, Vue, Angular',
  'PHP / Laravel',
  'APIs & microservices',
  'SQL — MySQL, Oracle',
  'CI/CD — Azure DevOps, Jenkins, GitLab',
  'Azure & AWS',
  'Docker',
] as const;

export const education = [
  {
    qualification: 'Bachelor of Science, Information Systems',
    institution: 'University of Waikato, New Zealand',
    years: '1999–2002',
  },
] as const;
