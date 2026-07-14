'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  return getSystemTheme();
}

export function ThemeToggle() {
  // Start from a stable value so server and first client render match, then
  // reconcile to the real theme after mount (setState in effect is
  // intentional here: the true value depends on DOM/localStorage).
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- reconcile to client-only theme after hydration */
    setTheme(getInitialTheme());
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  }

  // Avoid a hydration mismatch: render a stable placeholder until mounted.
  const label = !mounted
    ? 'Toggle theme'
    : theme === 'dark'
      ? 'Switch to light theme'
      : 'Switch to dark theme';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="grid size-10 place-items-center rounded-full border border-line text-ink transition-colors hover:bg-surface"
    >
      <span aria-hidden="true" className="text-lg">
        {mounted && theme === 'dark' ? '☀' : '☾'}
      </span>
    </button>
  );
}
