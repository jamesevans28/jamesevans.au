import { Card } from './Card';
import type { CaseStudy } from '@/content/work';

export function CaseStudyCard({ study }: { study: CaseStudy }) {
  return (
    <Card className="flex h-full flex-col gap-4">
      <div>
        <h3 className="font-display text-xl font-extrabold text-ink">
          {study.name}
        </h3>
        <p className="mt-1 text-sm font-semibold text-volt">{study.role}</p>
      </div>

      <p className="text-sm leading-relaxed text-ink-muted">{study.outcome}</p>

      {study.metrics ? (
        <dl className="mt-auto flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4">
          {study.metrics.map((m) => (
            <div key={m.label}>
              <dt className="sr-only">{m.label}</dt>
              <dd className="font-display text-xl font-extrabold tabular-nums text-ink">
                {m.value}{' '}
                <span className="text-xs font-normal text-ink-muted">
                  {m.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <ul className="flex flex-wrap gap-2">
        {study.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-ink-muted"
          >
            {tag}
          </li>
        ))}
      </ul>
    </Card>
  );
}
