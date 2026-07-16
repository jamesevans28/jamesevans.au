import { site, stats } from '@/content/site';
import { aiHeadline, aiIntro, aiOfferings, aiTools } from '@/content/ai';
import { featuredCaseStudies } from '@/content/work';
import { Card } from '@/components/Card';
import { Container } from '@/components/Container';
import { Section, SectionHeading } from '@/components/Section';
import { ButtonLink } from '@/components/Button';
import { SparkField } from '@/components/SparkField';
import { ServicesGrid } from '@/components/ServicesGrid';
import { CaseStudyCard } from '@/components/CaseStudyCard';
import { Testimonials } from '@/components/Testimonials';
import { Duotone } from '@/components/Duotone';

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <SparkField density={34} seed={11} />
        <Container className="relative py-20 sm:py-28">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-volt">
            {site.name} · {site.location}
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[1.02] text-ink sm:text-6xl md:text-7xl">
            Helping businesses put{' '}
            <span className="text-volt">AI to work</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
            {site.intro}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/services/" variant="primary">
              Explore AI services
            </ButtonLink>
            <ButtonLink href="/contact/" variant="ghost">
              Book an assessment
            </ButtonLink>
          </div>
          <ul className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-ink-muted">
            <li className="text-xs font-bold uppercase tracking-widest text-ink-muted">
              Working daily in
            </li>
            {aiTools.map((tool) => (
              <li key={tool} className="text-ink">
                {tool}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Credibility strip */}
      <section className="border-y-2 border-ink bg-surface">
        <Container>
          <dl className="grid grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={
                  'px-2 py-8 sm:px-5 ' +
                  (i % 2 === 1 ? 'border-l border-line ' : '') +
                  (i >= 2 ? 'border-t border-line lg:border-t-0 ' : '') +
                  (i % 4 !== 0 ? 'lg:border-l' : '')
                }
              >
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block font-display text-3xl font-extrabold tabular-nums text-volt sm:text-4xl">
                    {stat.value}
                  </span>
                  <span className="mt-1 block text-sm text-ink-muted">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* AI, front and centre */}
      <Section>
        <SectionHeading eyebrow="AI adoption" title={aiHeadline} intro={aiIntro} />
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {aiOfferings.map((offering) => (
            <li key={offering.slug}>
              <Card className="flex h-full flex-col gap-3">
                <h3 className="font-display text-xl font-extrabold text-ink">
                  {offering.title}
                </h3>
                <p className="font-semibold text-volt">{offering.tagline}</p>
                <p className="text-sm leading-relaxed text-ink-muted">
                  {offering.description}
                </p>
                <p className="mt-auto border-t border-line pt-3 text-sm text-ink">
                  {offering.outcome}
                </p>
              </Card>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/services/" variant="primary">
            See how AI adoption works
          </ButtonLink>
          <ButtonLink href="/contact/" variant="ghost">
            Book an assessment
          </ButtonLink>
        </div>
      </Section>

      {/* Supporting services */}
      <Section className="bg-surface">
        <SectionHeading
          eyebrow="Beyond AI"
          title="Twenty-five years of engineering behind it"
          intro="AI advice lands better coming from someone who still builds the systems. I also do the software, consulting and hands-on tech work that backs it up."
        />
        <div className="mt-8">
          <ServicesGrid teaser />
        </div>
        <div className="mt-8">
          <ButtonLink href="/services/" variant="ghost">
            Explore all services
          </ButtonLink>
        </div>
      </Section>

      {/* Featured work */}
      <Section className="bg-surface">
        <SectionHeading
          eyebrow="Selected work"
          title="Things I have shipped"
          intro="A few projects that show the range, from a national retail system to an app I built and still run."
        />
        <ul className="mt-8 grid gap-5 md:grid-cols-2">
          {featuredCaseStudies.map((study) => (
            <li key={study.slug}>
              <CaseStudyCard study={study} />
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <ButtonLink href="/work/" variant="ghost">
            See all work
          </ButtonLink>
        </div>
      </Section>

      <Testimonials />

      {/* Warm close */}
      <Section>
        <div className="grid items-center gap-10 md:grid-cols-[1fr_auto]">
          <div className="max-w-xl">
            <h2 className="text-3xl font-extrabold text-ink sm:text-4xl">
              Got something that needs building, or fixing?
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-muted">
              Whether it is a whole product or a stubborn tech problem, I am
              happy to take a look and give you a straight answer.
            </p>
            <div className="mt-8">
              <ButtonLink href="/contact/" variant="primary">
                Get in touch
              </ButtonLink>
            </div>
          </div>
          <Duotone
            src="/images/portrait.jpg"
            alt="James Evans"
            width={421}
            height={421}
            variant="cutout"
            className="mx-auto w-48 sm:w-56 md:w-64"
            sizes="(max-width: 768px) 12rem, 16rem"
          />
        </div>
      </Section>
    </>
  );
}
