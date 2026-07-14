import Link from 'next/link';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'ghost';

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-volt min-h-11';

const variants: Record<Variant, string> = {
  // Flare (coral) carries fixed near-black text in both themes — white on
  // coral fails AA (see contrast.test.ts).
  primary: 'bg-flare text-on-accent hover:bg-flare/90',
  ghost: 'border-2 border-volt text-volt hover:bg-volt hover:text-paper',
};

type CommonProps = {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
};

export function ButtonLink({
  href,
  variant = 'primary',
  className,
  children,
  ...rest
}: CommonProps & { href: string } & React.ComponentProps<typeof Link>) {
  const external = href.startsWith('http') || href.startsWith('mailto:');
  if (external) {
    return (
      <a
        href={href}
        className={cn(base, variants[variant], className)}
        {...(href.startsWith('http')
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cn(base, variants[variant], className)} {...rest}>
      {children}
    </Link>
  );
}

export function Button({
  variant = 'primary',
  className,
  children,
  ...rest
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], className)} {...rest}>
      {children}
    </button>
  );
}
