import { Section, SectionHeading } from './Section';
import {
  testimonials,
  hasPlaceholderTestimonials,
} from '@/content/testimonials';

export function Testimonials() {
  return (
    <Section className="bg-surface">
      <SectionHeading
        eyebrow="In their words"
        title="What people say"
        intro="A few words from the people I have built things for and worked alongside."
      />

      {hasPlaceholderTestimonials ? (
        <p className="mt-6 inline-block rounded-md border border-line bg-paper px-3 py-1 text-xs font-semibold text-ink-muted">
          Placeholder copy. Real, permissioned quotes to follow before launch.
        </p>
      ) : null}

      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t, i) => (
          <li
            key={i}
            className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-paper p-6"
          >
            <blockquote className="text-base leading-relaxed text-ink">
              <span aria-hidden="true" className="mr-1 font-display text-2xl font-extrabold leading-none text-flare">
                “
              </span>
              {t.quote}
            </blockquote>
            <p className="mt-auto text-sm font-bold text-volt">
              {t.name}
              <span className="font-normal text-ink-muted"> · {t.title}</span>
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
