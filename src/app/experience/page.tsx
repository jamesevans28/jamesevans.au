import type { Metadata } from 'next';
import {
  resumeHeadline,
  resumeTagline,
  professionalSummary,
  roles,
  earlierRoles,
  skills,
  education,
} from '@/content/experience';
import { site } from '@/content/site';
import { formatRange } from '@/lib/dates';
import { Container } from '@/components/Container';
import { Section } from '@/components/Section';
import { ButtonLink } from '@/components/Button';
import { Duotone } from '@/components/Duotone';

export const metadata: Metadata = {
  title: 'Resume',
  description:
    "James Evans, Software Engineering Leader. 25 years across software delivery and team leadership, currently Engineering Manager at Australia Post, with hands-on AI adoption experience. Full resume and PDF download.",
  alternates: { canonical: '/experience/' },
};

export default function ExperiencePage() {
  return (
    <>
      {/* Resume header */}
      <section className="border-b border-line">
        <Container className="py-14 sm:py-20">
          <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
            <Duotone
              src="/images/portrait.jpg"
              alt="James Evans"
              width={421}
              height={421}
              priority
              variant="cutout"
              className="w-32 sm:w-40"
              sizes="10rem"
            />
            <div>
              <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">
                {site.name}
              </h1>
              <p className="mt-1 font-display text-lg font-bold text-volt">
                {resumeHeadline}
              </p>
              <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">
                {resumeTagline}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <ButtonLink href="/resume.pdf" variant="primary">
                  Download PDF resume
                </ButtonLink>
                <ButtonLink href={`mailto:${site.email}`} variant="ghost">
                  Contact me
                </ButtonLink>
              </div>
              <p className="mt-4 text-sm text-ink-muted">
                {site.location} · {site.email} ·{' '}
                <a
                  href={site.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-volt hover:underline"
                >
                  LinkedIn
                </a>
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Professional summary */}
      <Section>
        <div className="max-w-3xl">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-volt">
            Summary
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-ink">
            {professionalSummary}
          </p>
        </div>
      </Section>

      {/* Skills, scannable near the top for recruiters */}
      <Section className="bg-surface">
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-volt">
          Skills
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li
              key={skill}
              className="rounded-full border border-line bg-paper px-3 py-1 text-sm font-medium text-ink"
            >
              {skill}
            </li>
          ))}
        </ul>
      </Section>

      {/* Experience timeline */}
      <Section>
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-volt">
          Experience
        </h2>
        <ol className="mt-8 border-l-2 border-line">
          {roles.map((role, i) => (
            <li
              key={`${role.company}-${role.start}`}
              className="relative pb-10 pl-8 last:pb-0"
            >
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
                        &#9656;
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

      {/* Earlier career + education */}
      <Section className="bg-surface">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-volt">
              Earlier career
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
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
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-volt">
              Education
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {education.map((e) => (
                <li key={e.qualification} className="text-sm">
                  <p className="font-semibold text-ink">{e.qualification}</p>
                  <p className="text-ink-muted">
                    {e.institution} · {e.years}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-[var(--radius-card)] border border-line bg-paper p-6">
              <p className="text-sm text-ink-muted">
                Prefer a copy to keep or forward?
              </p>
              <div className="mt-4">
                <ButtonLink href="/resume.pdf" variant="ghost">
                  Download PDF resume
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
