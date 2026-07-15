import type { Metadata } from 'next';
import {
  roles,
  earlierRoles,
  skills,
  education,
} from '@/content/experience';
import { site } from '@/content/site';
import { formatRange } from '@/lib/dates';
import { Container } from '@/components/Container';
import { Section, SectionHeading } from '@/components/Section';
import { ButtonLink } from '@/components/Button';
import { Duotone } from '@/components/Duotone';

export const metadata: Metadata = {
  title: 'Experience',
  description:
    "James Evans's career: Engineering Manager at Australia Post, engineering leadership at Telstra, and 25 years across software engineering roles in Australia, New Zealand and the UK.",
  alternates: { canonical: '/experience/' },
};

export default function ExperiencePage() {
  return (
    <>
      <section className="border-b border-line">
        <Container className="py-16 sm:py-20">
          <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
            <Duotone
              src="/images/portrait.jpg"
              alt="James Evans"
              width={421}
              height={421}
              priority
              className="w-32 sm:w-40"
              sizes="10rem"
            />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-volt">
                The online resume
              </p>
              <h1 className="mt-3 text-4xl font-extrabold text-ink sm:text-5xl">
                {site.name}
              </h1>
              <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-muted">
                Software engineering leader, {site.location}. Twenty-five years
                building software and the teams that build it.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Timeline */}
      <Section>
        <SectionHeading eyebrow="Career" title="Where I have worked" />
        <ol className="mt-10 border-l-2 border-line">
          {roles.map((role, i) => (
            <li key={`${role.company}-${role.start}`} className="relative pb-10 pl-8 last:pb-0">
              <span
                aria-hidden="true"
                className={
                  'absolute -left-[7px] top-1.5 size-3 rounded-full ' +
                  (i === 0 ? 'bg-flare' : 'bg-volt')
                }
              />
              <p className="text-sm font-semibold tabular-nums text-volt">
                {formatRange(role.start, role.end)}
              </p>
              <h3 className="mt-1 font-display text-xl font-extrabold text-ink">
                {role.title}
              </h3>
              <p className="text-sm font-semibold text-ink-muted">
                {role.company} · {role.location}
              </p>
              <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">
                {role.summary}
              </p>
              {role.highlights ? (
                <ul className="mt-3 flex max-w-2xl flex-col gap-1.5">
                  {role.highlights.map((h) => (
                    <li key={h} className="flex gap-2 text-sm text-ink">
                      <span aria-hidden="true" className="text-flare">
                        ▸
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      </Section>

      {/* Earlier roles + skills + education */}
      <Section className="bg-surface">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-ink">
              Earlier career
            </h2>
            <ul className="mt-5 flex flex-col gap-3">
              {earlierRoles.map((role) => (
                <li
                  key={`${role.company}-${role.years}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-line pb-3 text-sm"
                >
                  <span className="font-semibold text-ink">
                    {role.title} · {role.company}
                  </span>
                  <span className="tabular-nums text-ink-muted">
                    {role.location} · {role.years}
                  </span>
                </li>
              ))}
            </ul>

            <h2 className="mt-10 font-display text-2xl font-extrabold text-ink">
              Education
            </h2>
            <ul className="mt-5 flex flex-col gap-3">
              {education.map((e) => (
                <li key={e.qualification} className="text-sm">
                  <p className="font-semibold text-ink">{e.qualification}</p>
                  <p className="text-ink-muted">
                    {e.institution} · {e.years}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl font-extrabold text-ink">
              Skills
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border border-line bg-paper px-3 py-1 text-sm font-medium text-ink"
                >
                  {skill}
                </li>
              ))}
            </ul>

            <div className="mt-10 rounded-[var(--radius-card)] border border-line bg-paper p-6">
              <p className="text-sm text-ink-muted">
                Want the short version to keep or share?
              </p>
              <div className="mt-4">
                <ButtonLink href="/contact/" variant="ghost">
                  Request a PDF resume
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
