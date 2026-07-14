import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Button, ButtonLink } from './Button';
import { Card } from './Card';
import { Testimonials } from './Testimonials';
import { ServicesGrid } from './ServicesGrid';

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

describe('accessibility (axe)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
  });

  it('Button has no violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('ButtonLink has no violations', async () => {
    const { container } = render(
      <ButtonLink href="/services/">Work with me</ButtonLink>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('Card (as link) has no violations', async () => {
    const { container } = render(
      <Card href="/work/">
        <h3>A card</h3>
        <p>Some body text.</p>
      </Card>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('ServicesGrid has no violations', async () => {
    const { container } = render(<ServicesGrid />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('Testimonials section has no violations', async () => {
    const { container } = render(<Testimonials />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
