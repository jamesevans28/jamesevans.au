import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostCard } from './PostCard';
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

function post(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    slug: 'how-to-use-ai-for-email',
    title: 'How to Use AI to Write Better Emails',
    description: 'A practical walkthrough of drafting everyday work emails.',
    status: 'published',
    publishedAt: '2026-07-20T09:00:00.000Z',
    updatedAt: '2026-07-20T09:00:00.000Z',
    tags: ['guides'],
    bodyMarkdown: '## S\n\ntext',
    words: 1200,
    readingMinutes: 6,
    ...overrides,
  } as BlogPost;
}

describe('PostCard', () => {
  it('links to the post with a trailing slash', () => {
    render(<PostCard post={post()} />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/blog/how-to-use-ai-for-email/',
    );
  });

  it('shows the title, description, reading time and tags', () => {
    render(<PostCard post={post()} />);
    expect(
      screen.getByText('How to Use AI to Write Better Emails'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/practical walkthrough of drafting/i),
    ).toBeInTheDocument();
    expect(screen.getByText('6 min read')).toBeInTheDocument();
    expect(screen.getByText('guides')).toBeInTheDocument();
  });

  it('renders a machine-readable published date', () => {
    render(<PostCard post={post()} />);
    const time = screen.getByText('20 July 2026');
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveAttribute('dateTime', '2026-07-20T09:00:00.000Z');
  });

  it('marks drafts visibly, so a preview is never mistaken for a live post', () => {
    render(
      <PostCard post={post({ status: 'draft', publishedAt: undefined })} />,
    );
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('omits the date element entirely when there is no published date', () => {
    render(
      <PostCard post={post({ status: 'draft', publishedAt: undefined })} />,
    );
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument();
  });

  it('does not label a published post as a draft', () => {
    render(<PostCard post={post()} />);
    expect(screen.queryByText('Draft')).not.toBeInTheDocument();
  });
});
