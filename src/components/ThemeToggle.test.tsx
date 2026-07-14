import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    // jsdom has no matchMedia; default to light.
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
  });

  it('renders an accessible toggle button', async () => {
    render(<ThemeToggle />);
    expect(
      await screen.findByRole('button', { name: /switch to dark theme/i }),
    ).toBeInTheDocument();
  });

  it('toggles to dark and persists the choice', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const btn = await screen.findByRole('button', {
      name: /switch to dark theme/i,
    });
    await user.click(btn);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(
      screen.getByRole('button', { name: /switch to light theme/i }),
    ).toBeInTheDocument();
  });

  it('reads an existing data-theme on mount', async () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    render(<ThemeToggle />);
    expect(
      await screen.findByRole('button', { name: /switch to light theme/i }),
    ).toBeInTheDocument();
  });
});
