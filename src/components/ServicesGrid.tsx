import { Card } from './Card';
import { services } from '@/content/services';

export function ServicesGrid({ teaser = false }: { teaser?: boolean }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {services.map((service) => (
        <li key={service.slug}>
          <Card href={teaser ? '/services/' : undefined} className="h-full">
            <h3 className="font-display text-lg font-bold text-ink">
              {service.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {teaser ? service.tagline : service.description}
            </p>
          </Card>
        </li>
      ))}
    </ul>
  );
}
