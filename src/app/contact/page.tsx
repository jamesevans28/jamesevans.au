import type { Metadata } from 'next';
import { site } from '@/content/site';
import { Container } from '@/components/Container';
import { SparkField } from '@/components/SparkField';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Get in touch with James Evans — email ${site.email} or connect on LinkedIn. Melbourne-based, available remotely across Australia.`,
  alternates: { canonical: '/contact/' },
};

export default function ContactPage() {
  return (
    <section className="relative overflow-hidden">
      <SparkField density={30} seed={23} />
      <Container className="relative py-20 sm:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-volt">
            Contact
          </p>
          <h1 className="mt-3 text-4xl font-extrabold text-ink sm:text-5xl">
            Let us talk about your project.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-muted">
            The best way to reach me is email — tell me a little about what you
            need and I will get back to you. No call centre, no bots; you will
            be talking to me.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <a
              href={`mailto:${site.email}`}
              className="group rounded-[var(--radius-card)] border border-line border-t-[3px] border-t-volt bg-surface p-6 transition-transform hover:-translate-y-1"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">
                Email
              </p>
              <p className="mt-2 font-display text-lg font-bold text-volt group-hover:underline">
                {site.email}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                Best for project enquiries and quotes.
              </p>
            </a>

            <a
              href={site.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-[var(--radius-card)] border border-line border-t-[3px] border-t-volt bg-surface p-6 transition-transform hover:-translate-y-1"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">
                LinkedIn
              </p>
              <p className="mt-2 font-display text-lg font-bold text-volt group-hover:underline">
                Connect with me
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                For professional networking and roles.
              </p>
            </a>
          </div>

          <p className="mt-10 text-sm text-ink-muted">
            Based in {site.location} · available on-site locally and remotely
            across Australia.
          </p>
        </div>
      </Container>
    </section>
  );
}
