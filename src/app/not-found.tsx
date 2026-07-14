import { Container } from '@/components/Container';
import { ButtonLink } from '@/components/Button';
import { SparkField } from '@/components/SparkField';

export default function NotFound() {
  return (
    <section className="relative overflow-hidden">
      <SparkField density={36} seed={42} />
      <Container className="relative flex min-h-[60vh] flex-col items-start justify-center py-20">
        <p className="font-display text-7xl font-extrabold text-volt sm:text-8xl">
          404
        </p>
        <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
          This page took a wrong turn.
        </h1>
        <p className="mt-3 max-w-md text-ink-muted">
          The page you are after does not exist — it may have moved, or the link
          might be off. Let us get you back on track.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/" variant="primary">
            Back home
          </ButtonLink>
          <ButtonLink href="/services/" variant="ghost">
            See services
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
