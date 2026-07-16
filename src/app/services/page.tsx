import type { Metadata } from 'next';
import { services, engagementSteps, serviceArea } from '@/content/services';
import { aiHeadline, aiIntro, aiOfferings, aiTools } from '@/content/ai';
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
    'AI adoption for business: assessments, workflow automation, and setting up Claude, OpenAI and Microsoft Copilot. Plus custom software, consulting and hands-on tech help in Melbourne and remote.',
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
            AI adoption
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold text-ink sm:text-5xl">
            {aiHeadline}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">
            {aiIntro}
          </p>
          <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <li className="text-xs font-bold uppercase tracking-widest text-ink-muted">
              Working daily in
            </li>
            {aiTools.map((tool) => (
              <li key={tool} className="font-semibold text-ink">
                {tool}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* The three AI offerings, in detail */}
      <Section>
        <ol className="grid gap-6 md:grid-cols-3">
          {aiOfferings.map((offering, i) => (
            <li key={offering.slug}>
              <Card className="flex h-full flex-col gap-4">
                <div>
                  <span className="font-display text-2xl font-extrabold tabular-nums text-flare">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 className="mt-2 font-display text-xl font-extrabold text-ink">
                    {offering.title}
                  </h2>
                  <p className="mt-1 font-semibold text-volt">
                    {offering.tagline}
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-ink-muted">
                  {offering.description}
                </p>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">
                    What you get
                  </p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {offering.youGet.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-ink">
                        <span aria-hidden="true" className="text-flare">
                          &#9656;
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-auto border-t border-line pt-4 text-sm text-ink">
                  {offering.outcome}
                </p>
              </Card>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <ButtonLink href="/contact/" variant="primary">
            Book an AI assessment
          </ButtonLink>
        </div>
      </Section>

      <Section className="bg-surface">
        <SectionHeading
          eyebrow="Beyond AI"
          title="The engineering behind the advice"
          intro="AI is where most businesses want to start, but I also do the software, consulting and hands-on tech work that makes it real."
        />
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
