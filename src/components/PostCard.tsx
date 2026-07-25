import Link from 'next/link';
import type { BlogPost } from '@/lib/blog';
import { formatPostDate } from '@/lib/dates';
import { cn } from '@/lib/cn';

/**
 * One article in a list. Used on /blog and in the homepage "latest writing"
 * row. The whole card is a link; the tag list is decorative here (tags are not
 * separately linked until there are enough posts to justify tag pages).
 */
export function PostCard({
  post,
  className,
}: {
  post: BlogPost;
  className?: string;
}) {
  return (
    <article className={className}>
      <Link
        href={`/blog/${post.slug}/`}
        className={cn(
          'group flex h-full flex-col rounded-[var(--radius-card)] border border-line border-t-[3px] border-t-volt bg-surface p-6',
          'transition-transform hover:-translate-y-1',
        )}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
          {post.status === 'draft' ? (
            <span className="rounded-full bg-citrus px-2 py-0.5 font-bold uppercase tracking-wide text-on-accent">
              Draft
            </span>
          ) : null}
          {post.publishedAt ? (
            <time dateTime={post.publishedAt}>
              {formatPostDate(post.publishedAt)}
            </time>
          ) : null}
          <span aria-hidden="true">·</span>
          <span>{post.readingMinutes} min read</span>
        </div>

        <h3 className="mt-3 font-display text-xl font-extrabold text-ink group-hover:text-volt">
          {post.title}
        </h3>

        <p className="mt-2 flex-1 leading-relaxed text-ink-muted">
          {post.description}
        </p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-ink-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      </Link>
    </article>
  );
}
