import Link from 'next/link';
import { navLinks, site } from '@/content/site';

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-3">
        <div>
          <p className="font-display text-lg font-extrabold tracking-tight text-ink">
            {site.name}
            <span className="text-flare">.</span>
          </p>
          <p className="mt-2 max-w-xs text-sm text-ink-muted">{site.intro}</p>
        </div>

        <nav aria-label="Footer">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">
            Explore
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-semibold text-ink transition-colors hover:text-volt"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">
            Get in touch
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            <li>
              <a
                href={`mailto:${site.email}`}
                className="font-semibold text-volt hover:underline"
              >
                {site.email}
              </a>
            </li>
            <li>
              <a
                href={site.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-ink transition-colors hover:text-volt"
              >
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-5 py-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            © {new Date().getFullYear()} {site.tradingName}
            {site.abn ? ` · ABN ${site.abn}` : ''} · {site.location}
          </p>
          <p>
            This site uses Google Analytics to understand traffic. No personal
            data is sold.
          </p>
        </div>
      </div>
    </footer>
  );
}
