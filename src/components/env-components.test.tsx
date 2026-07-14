import { describe, it, expect, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeScript } from './ThemeScript';

describe('ThemeScript', () => {
  it('renders an inline script that reads the stored theme', () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector('script');
    expect(script).toBeInTheDocument();
    expect(script?.innerHTML).toContain('localStorage');
    expect(script?.innerHTML).toContain('data-theme');
  });
});

describe('Analytics', () => {
  afterEach(() => {
    // vi.stubEnv snapshots and restores env safely (NODE_ENV is read-only
    // in the types, so direct assignment would not typecheck).
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('renders nothing outside production', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('NEXT_PUBLIC_GA_ID', 'G-TEST');
    const { Analytics } = await import('./Analytics');
    const { container } = render(<Analytics />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing in production without a GA id', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_GA_ID', '');
    const { Analytics } = await import('./Analytics');
    const { container } = render(<Analytics />);
    expect(container).toBeEmptyDOMElement();
  });
});
