import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteHeader } from './SiteHeader';

// next/link renders a plain anchor in tests.
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('SiteHeader', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
  });

  it('exposes the primary nav links', () => {
    render(<SiteHeader />);
    // Links appear in both desktop and mobile nav; at least one each.
    expect(screen.getAllByRole('link', { name: 'Services' }).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByRole('link', { name: 'Contact' }).length).toBeGreaterThan(
      0,
    );
  });

  it('mobile menu is collapsed by default and expands on click', async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    const menuBtn = screen.getByRole('button', { name: /open menu/i });
    expect(menuBtn).toHaveAttribute('aria-expanded', 'false');

    await user.click(menuBtn);
    expect(
      screen.getByRole('button', { name: /close menu/i }),
    ).toHaveAttribute('aria-expanded', 'true');
  });
});
