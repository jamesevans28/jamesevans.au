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
    'AI adoption for business: assessments, workflow automation, and setting up Claude, OpenAI and Copilot, plus custom software and hands-on tech help.',
  alternates: { canonical: '/services/' },
};

export default function ServicesPage() {
  return (
    <>
      <JsonLd data={professionalServiceSchema()} />
      <section className="border-line relative overflow-hidden border-b">
        <SparkField density={26} seed={5} />
        <Container className="relative py-16 sm:py-20">
          <p className="text-volt text-xs font-bold tracking-[0.16em] uppercase">
            AI adoption
          </p>
          <h1 className="text-ink mt-3 max-w-3xl text-4xl font-extrabold sm:text-5xl">
            {aiHeadline}
          </h1>
          <p className="text-ink-muted mt-5 max-w-2xl text-lg leading-relaxed">
            {aiIntro}
          </p>
          <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <li className="text-ink-muted text-xs font-bold tracking-widest uppercase">
              Working daily in
            </li>
            {aiTools.map((tool) => (
              <li key={tool} className="text-ink font-semibold">
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
                  <span className="font-display text-flare text-2xl font-extrabold tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 className="font-display text-ink mt-2 text-xl font-extrabold">
                    {offering.title}
                  </h2>
                  <p className="text-volt mt-1 font-semibold">
                    {offering.tagline}
                  </p>
                </div>
                <p className="text-ink-muted text-sm leading-relaxed">
                  {offering.description}
                </p>
                <div>
                  <p className="text-ink-muted text-xs font-bold tracking-widest uppercase">
                    What you get
                  </p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {offering.youGet.map((item) => (
                      <li key={item} className="text-ink flex gap-2 text-sm">
                        <span aria-hidden="true" className="text-flare">
                          &#9656;
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="border-line text-ink mt-auto border-t pt-4 text-sm">
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
                  <h2 className="font-display text-ink text-2xl font-extrabold">
                    {service.title}
                  </h2>
                  <p className="text-volt mt-1 font-semibold">
                    {service.tagline}
                  </p>
                </div>
                <p className="text-ink-muted leading-relaxed">
                  {service.description}
                </p>
                <div>
                  <p className="text-ink-muted text-xs font-bold tracking-widest uppercase">
                    What you get
                  </p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {service.youGet.map((item) => (
                      <li key={item} className="text-ink flex gap-2 text-sm">
                        <span aria-hidden="true" className="text-flare">
                          ▸
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="border-line text-ink-muted mt-auto border-t pt-4 text-sm">
                  <span className="text-ink font-semibold">For: </span>
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
              className="border-line bg-paper rounded-[var(--radius-card)] border p-6"
            >
              <span className="font-display text-flare text-3xl font-extrabold tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="font-display text-ink mt-2 text-lg font-bold">
                {step.title}
              </h3>
              <p className="text-ink-muted mt-1 text-sm leading-relaxed">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
        <p className="text-ink-muted mt-8 text-sm">
          <span className="text-ink font-semibold">Where: </span>
          {serviceArea}
        </p>
      </Section>

      <Section>
        <div className="border-volt rounded-[var(--radius-card)] border-2 p-8 text-center sm:p-12">
          <h2 className="text-ink text-3xl font-extrabold">
            Tell me what you need.
          </h2>
          <p className="text-ink-muted mx-auto mt-3 max-w-xl">
            No obligation, just a straight conversation about whether I can help
            and what it would take.
          </p>
          <div className="mt-6 flex justify-center">
            <ButtonLink href="/contact/" variant="primary">
              Start a conversation
            </ButtonLink>
          </div>
          <p className="text-ink-muted mt-4 text-sm">
            Or email{' '}
            <a
              href={`mailto:${site.email}`}
              className="text-volt font-semibold hover:underline"
            >
              {site.email}
            </a>
          </p>
        </div>
      </Section>
    </>
  );
}
