import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Button, ButtonLink } from './Button';
import { Card } from './Card';
import { Testimonials } from './Testimonials';
import { ServicesGrid } from './ServicesGrid';
import { PostCard } from './PostCard';
import { renderMarkdown } from '@/lib/markdown';
import type { BlogPost } from '@/lib/blog';

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

  it('PostCard has no violations', async () => {
    const { container } = render(
      <PostCard
        post={
          {
            slug: 'how-to-use-ai-for-email',
            title: 'How to Use AI to Write Better Emails',
            description: 'A practical walkthrough of everyday work emails.',
            status: 'published',
            publishedAt: '2026-07-20T09:00:00.000Z',
            updatedAt: '2026-07-20T09:00:00.000Z',
            tags: ['guides'],
            bodyMarkdown: '## S\n\ntext',
            words: 1200,
            readingMinutes: 6,
          } as BlogPost
        }
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('rendered article prose has no violations', async () => {
    // Exercises the real markdown pipeline output: headings, anchors, lists,
    // tables and code all have to survive an axe pass.
    const html = await renderMarkdown(
      [
        '## First section',
        '',
        'Some text with a [link](/services/).',
        '',
        '- one',
        '- two',
        '',
        '| a | b |',
        '|---|---|',
        '| 1 | 2 |',
        '',
        '```js',
        'const x = 1;',
        '```',
        '',
        '### A sub-section',
        '',
        '![A chart of results](/images/blog/x.png)',
      ].join('\n'),
    );
    const { container } = render(
      <div className="prose-volt" dangerouslySetInnerHTML={{ __html: html }} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
