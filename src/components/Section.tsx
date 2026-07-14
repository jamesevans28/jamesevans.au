import { Container } from './Container';
import { cn } from '@/lib/cn';

export function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn('py-16 sm:py-24', className)}>
      <Container>{children}</Container>
    </section>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.16em] text-volt">
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
        {title}
      </h2>
      {intro ? (
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">{intro}</p>
      ) : null}
    </div>
  );
}
