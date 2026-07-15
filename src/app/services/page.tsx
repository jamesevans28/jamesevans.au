import type { Metadata } from 'next';
import { services, engagementSteps, serviceArea } from '@/content/services';
import { site } from '@/content/site';
import { Container } from '@/components/Container';
import { Section, SectionHeading } from '@/components/Section';
import { Card } from '@/components/Card';
import { ButtonLink } from '@/components/Button';
import { SparkField } from '@/components/SparkField';
import { JsonLd, professionalServiceSchema } from '@/lib/jsonld';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'AI adoption, custom software development, technology consulting, tech troubleshooting, and hardware installations for businesses and individuals in Melbourne and remote.',
  alternates: { canonical: '/services/' },
};

export default function ServicesPage() {
  return (
    <>
      <JsonLd data={professionalServiceSchema()} />
      <section className="relative overflow-hidden border-b border-line">
        <SparkField density={26} seed={5} />
        <Container className="relative py-16 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-volt">
            Work with me
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold text-ink sm:text-5xl">
            Whatever the technology, I can help.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">
            AI adoption, software, advice, everyday tech problems and hardware,
            with the same twenty-five years of experience behind every job, big
            or small.
          </p>
        </Container>
      </section>

      <Section>
        <ul className="grid gap-6 md:grid-cols-2">
          {services.map((service) => (
            <li key={service.slug}>
              <Card className="flex h-full flex-col gap-4">
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-ink">
                    {service.title}
                  </h2>
                  <p className="mt-1 font-semibold text-volt">
                    {service.tagline}
                  </p>
                </div>
                <p className="leading-relaxed text-ink-muted">
                  {service.description}
                </p>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">
                    What you get
                  </p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {service.youGet.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-ink">
                        <span aria-hidden="true" className="text-flare">
                          ▸
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-auto border-t border-line pt-4 text-sm text-ink-muted">
                  <span className="font-semibold text-ink">For: </span>
                  {service.forWho}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section className="bg-surface">
        <SectionHeading
          eyebrow="How it works"
          title="Simple, and no surprises"
          intro="Four steps from first hello to work delivered."
        />
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {engagementSteps.map((step, i) => (
            <li
              key={step.title}
              className="rounded-[var(--radius-card)] border border-line bg-paper p-6"
            >
              <span className="font-display text-3xl font-extrabold text-flare tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 font-display text-lg font-bold text-ink">
                {step.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-sm text-ink-muted">
          <span className="font-semibold text-ink">Where: </span>
          {serviceArea}
        </p>
      </Section>

      <Section>
        <div className="rounded-[var(--radius-card)] border-2 border-volt p-8 text-center sm:p-12">
          <h2 className="text-3xl font-extrabold text-ink">
            Tell me what you need.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-muted">
            No obligation, just a straight conversation about whether I can
            help and what it would take.
          </p>
          <div className="mt-6 flex justify-center">
            <ButtonLink href="/contact/" variant="primary">
              Start a conversation
            </ButtonLink>
          </div>
          <p className="mt-4 text-sm text-ink-muted">
            Or email{' '}
            <a
              href={`mailto:${site.email}`}
              className="font-semibold text-volt hover:underline"
            >
              {site.email}
            </a>
          </p>
        </div>
      </Section>
    </>
  );
}
