'use client';

import Link from 'next/link';
import { useState } from 'react';
import { navLinks, site } from '@/content/site';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/cn';

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="font-display text-lg font-extrabold tracking-tight text-ink"
        >
          {site.name}
          <span className="text-flare">.</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-ink-muted transition-colors hover:text-volt"
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-full border border-line text-ink"
          >
            <span aria-hidden="true" className="text-lg">
              {open ? '✕' : '☰'}
            </span>
          </button>
        </div>
      </div>

      <nav
        id="mobile-nav"
        aria-label="Primary"
        className={cn(
          'overflow-hidden border-t border-line md:hidden',
          open ? 'block' : 'hidden',
        )}
      >
        <ul className="flex flex-col px-5 py-2">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className="block py-3 text-base font-semibold text-ink transition-colors hover:text-volt"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
