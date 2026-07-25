'use client';

import { useEffect, useState } from 'react';
import { site } from '@/content/site';

/**
 * Share controls for an article.
 *
 * The only client-side JavaScript on a post page, and deliberately small: the
 * share targets are plain links that work without JS, and the two interactive
 * affordances (native share sheet, copy link) degrade to nothing rather than
 * breaking if their APIs are unavailable.
 *
 * Native sharing is offered only when the browser actually supports it, which
 * is mostly mobile — otherwise the copy button is the primary action.
 */
export function ShareButtons({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const url = `${site.url}/blog/${slug}/`;

  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Feature-detect after mount so the server and first client render agree.
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- client-only capability check */
    setCanNativeShare(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function nativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // The user dismissed the sheet, or the browser refused. Nothing to do.
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard blocked (insecure context, permissions). Leave the link
      // targets as the fallback rather than showing a false success.
    }
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const targets = [
    {
      label: 'Share on X',
      short: 'X',
      href: `https://x.com/intent/post?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      label: 'Share on LinkedIn',
      short: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      label: 'Share by email',
      short: 'Email',
      // %0A%0A is a blank line between the title and the URL in the body.
      href: `mailto:?subject=${encodedTitle}&body=${encodedTitle}%0A%0A${encodedUrl}`,
    },
  ];

  const buttonClasses =
    'inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:border-volt hover:text-volt';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-bold uppercase tracking-[0.16em] text-ink-muted">
        Share
      </span>

      {canNativeShare ? (
        <button type="button" onClick={nativeShare} className={buttonClasses}>
          <span aria-hidden="true">↗</span>
          Share
        </button>
      ) : null}

      {targets.map((target) => (
        <a
          key={target.short}
          href={target.href}
          // mailto: must not open a blank tab.
          {...(target.href.startsWith('http')
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
          className={buttonClasses}
          aria-label={target.label}
        >
          {target.short}
        </a>
      ))}

      <button
        type="button"
        onClick={copyLink}
        className={buttonClasses}
        aria-label="Copy link to this article"
      >
        <span aria-hidden="true">{copied ? '✓' : '⧉'}</span>
        {copied ? 'Copied' : 'Copy link'}
      </button>

      {/* Announce the copy result to screen readers without moving focus. */}
      <span aria-live="polite" className="sr-only">
        {copied ? 'Link copied to clipboard' : ''}
      </span>
    </div>
  );
}
