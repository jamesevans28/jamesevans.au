import Link from 'next/link';
import { cn } from '@/lib/cn';

/**
 * Surface card with a volt top-rule. If `href` is provided the whole card is
 * a link with a hover lift.
 */
export function Card({
  children,
  className,
  href,
  accent = true,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  accent?: boolean;
}) {
  const classes = cn(
    'block rounded-[var(--radius-card)] border border-line bg-surface p-6',
    accent && 'border-t-[3px] border-t-volt',
    href && 'transition-transform hover:-translate-y-1',
    className,
  );

  if (href) {
    const external = href.startsWith('http');
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return <div className={classes}>{children}</div>;
}
