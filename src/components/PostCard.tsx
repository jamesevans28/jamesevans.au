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
          'group border-line border-t-volt bg-surface flex h-full flex-col rounded-[var(--radius-card)] border border-t-[3px] p-6',
          'transition-transform hover:-translate-y-1',
        )}
      >
        <div className="text-ink-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {post.status === 'draft' ? (
            <span className="bg-citrus text-on-accent rounded-full px-2 py-0.5 font-bold tracking-wide uppercase">
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

        <h2 className="font-display text-ink group-hover:text-volt mt-3 text-xl font-extrabold">
          {post.title}
        </h2>

        <p className="text-ink-muted mt-2 flex-1 leading-relaxed">
          {post.description}
        </p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li
              key={tag}
              className="border-line text-ink-muted rounded-full border px-2.5 py-0.5 text-xs font-medium"
            >
              {tag}
            </li>
          ))}
        </ul>
      </Link>
    </article>
  );
}
