import type { Metadata } from 'next';
import { aboutIntro, aboutParagraphs, values } from '@/content/about';
import { site } from '@/content/site';
import { Section, SectionHeading } from '@/components/Section';
import { ButtonLink } from '@/components/Button';
import { Duotone } from '@/components/Duotone';

export const metadata: Metadata = {
  title: 'About',
  description:
    'James Evans is a software engineering leader in Melbourne who still ships code. From New Zealand to London to Melbourne, and the philosophy behind the work.',
  alternates: { canonical: '/about/' },
};

export default function AboutPage() {
  return (
    <>
      <Section>
        <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-start">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-volt">
              About
            </p>
            <h1 className="mt-3 text-4xl font-extrabold text-ink sm:text-5xl">
              The person behind the work.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-ink">{aboutIntro}</p>
            {aboutParagraphs.map((para) => (
              <p key={para} className="mt-4 leading-relaxed text-ink-muted">
                {para}
              </p>
            ))}
          </div>
          <Duotone
            src="/images/portrait.jpg"
            alt="James Evans"
            width={421}
            height={421}
            priority
            variant="cutout"
            className="mx-auto w-56 md:w-72"
            sizes="(max-width: 768px) 14rem, 18rem"
          />
        </div>
      </Section>

      <Section className="bg-surface">
        <SectionHeading eyebrow="How I work" title="What you can count on" />
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {values.map((value) => (
            <li
              key={value.title}
              className="rounded-[var(--radius-card)] border border-line border-t-[3px] border-t-volt bg-paper p-6"
            >
              <h3 className="font-display text-lg font-bold text-ink">
                {value.title}
              </h3>
              <p className="mt-2 leading-relaxed text-ink-muted">
                {value.body}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="rounded-[var(--radius-card)] border-2 border-volt p-8 text-center sm:p-12">
          <h2 className="text-3xl font-extrabold text-ink">Let us talk.</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-muted">
            If any of that sounds like the kind of person you want in your
            corner, I would love to hear what you are working on.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/contact/" variant="primary">
              Get in touch
            </ButtonLink>
            <ButtonLink href={site.linkedin} variant="ghost">
              Connect on LinkedIn
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
