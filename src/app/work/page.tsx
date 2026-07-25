import type { Metadata } from 'next';
import { caseStudies } from '@/content/work';
import { Container } from '@/components/Container';
import { Section } from '@/components/Section';
import { SparkField } from '@/components/SparkField';

export const metadata: Metadata = {
  title: 'Work',
  description:
    'Case studies from 25 years shipping software: Audify for Kairos Strategies, Point of Sale at national scale, and a 50-robot CRM migration.',
  alternates: { canonical: '/work/' },
};

export default function WorkPage() {
  return (
    <>
      <section className="border-line relative overflow-hidden border-b">
        <SparkField density={30} seed={19} />
        <Container className="relative py-16 sm:py-20">
          <p className="text-volt text-xs font-bold tracking-[0.16em] uppercase">
            Selected work
          </p>
          <h1 className="text-ink mt-3 max-w-3xl text-4xl font-extrabold sm:text-5xl">
            Problems, and how I solved them.
          </h1>
          <p className="text-ink-muted mt-5 max-w-2xl text-lg leading-relaxed">
            A cross-section of the work: real products and real outcomes, from a
            national retail system to an app I built from scratch and still run
            today.
          </p>
        </Container>
      </section>

      <Section>
        <div className="flex flex-col gap-8">
          {caseStudies.map((study, i) => (
            <article
              key={study.slug}
              className="border-line bg-surface grid gap-6 rounded-[var(--radius-card)] border p-6 sm:p-8 lg:grid-cols-[1fr_auto]"
            >
              <div className="max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="font-display text-flare text-sm font-extrabold tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <ul className="flex flex-wrap gap-2">
                    {study.tags.map((tag) => (
                      <li
                        key={tag}
                        className="border-line text-ink-muted rounded-full border px-2.5 py-0.5 text-xs font-medium"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>

                <h2 className="font-display text-ink mt-3 text-2xl font-extrabold">
                  {study.name}
                </h2>
                <p className="text-volt mt-1 text-sm font-semibold">
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
                    <dt className="text-ink-muted text-xs font-bold tracking-widest uppercase">
                      The problem
                    </dt>
                    <dd className="text-ink-muted mt-1 leading-relaxed">
                      {study.problem}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted text-xs font-bold tracking-widest uppercase">
                      The approach
                    </dt>
                    <dd className="text-ink-muted mt-1 leading-relaxed">
                      {study.approach}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted text-xs font-bold tracking-widest uppercase">
                      The outcome
                    </dt>
                    <dd className="text-ink mt-1 leading-relaxed">
                      {study.outcome}
                    </dd>
                  </div>
                </dl>
              </div>

              {study.metrics ? (
                <dl className="border-line flex flex-row flex-wrap content-start gap-6 border-t pt-6 lg:w-52 lg:flex-col lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
                  {study.metrics.map((m) => (
                    <div key={m.label}>
                      <dt className="sr-only">{m.label}</dt>
                      <dd>
                        <span className="font-display text-volt block text-3xl font-extrabold tabular-nums">
                          {m.value}
                        </span>
                        <span className="text-ink-muted mt-0.5 block text-xs">
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
