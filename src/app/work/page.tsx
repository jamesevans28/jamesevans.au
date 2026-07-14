import type { Metadata } from 'next';
import { caseStudies } from '@/content/work';
import { Container } from '@/components/Container';
import { Section } from '@/components/Section';
import { SparkField } from '@/components/SparkField';

export const metadata: Metadata = {
  title: 'Work',
  description:
    'Case studies from 25 years of shipping software — Audify (a field-auditing platform built for Kairos Strategies), Point of Sale at national scale, a 50-robot CRM migration, and more.',
  alternates: { canonical: '/work/' },
};

export default function WorkPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <SparkField density={30} seed={19} />
        <Container className="relative py-16 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-volt">
            Selected work
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold text-ink sm:text-5xl">
            Problems, and how I solved them.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">
            A cross-section of the work — real products and real outcomes, from
            a national retail system to an app I built from scratch and still
            run today.
          </p>
        </Container>
      </section>

      <Section>
        <div className="flex flex-col gap-8">
          {caseStudies.map((study, i) => (
            <article
              key={study.slug}
              className="grid gap-6 rounded-[var(--radius-card)] border border-line bg-surface p-6 sm:p-8 lg:grid-cols-[1fr_auto]"
            >
              <div className="max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="font-display text-sm font-extrabold tabular-nums text-flare">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <ul className="flex flex-wrap gap-2">
                    {study.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-ink-muted"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>

                <h2 className="mt-3 font-display text-2xl font-extrabold text-ink">
                  {study.name}
                </h2>
                <p className="mt-1 text-sm font-semibold text-volt">
                  {study.role}
                  {study.client ? (
                    <>
                      {' · '}
                      {study.clientUrl ? (
                        <a
                          href={study.clientUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {study.client}
                        </a>
                      ) : (
                        study.client
                      )}
                    </>
                  ) : null}
                </p>

                <dl className="mt-4 flex flex-col gap-3">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-widest text-ink-muted">
                      The problem
                    </dt>
                    <dd className="mt-1 leading-relaxed text-ink-muted">
                      {study.problem}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-widest text-ink-muted">
                      The approach
                    </dt>
                    <dd className="mt-1 leading-relaxed text-ink-muted">
                      {study.approach}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-widest text-ink-muted">
                      The outcome
                    </dt>
                    <dd className="mt-1 leading-relaxed text-ink">
                      {study.outcome}
                    </dd>
                  </div>
                </dl>
              </div>

              {study.metrics ? (
                <dl className="flex flex-row flex-wrap content-start gap-6 border-t border-line pt-6 lg:w-52 lg:flex-col lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                  {study.metrics.map((m) => (
                    <div key={m.label}>
                      <dt className="sr-only">{m.label}</dt>
                      <dd>
                        <span className="block font-display text-3xl font-extrabold tabular-nums text-volt">
                          {m.value}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-muted">
                          {m.label}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
