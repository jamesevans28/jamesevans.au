import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareButtons } from './ShareButtons';

const SLUG = 'why-ai-gives-you-confident-wrong-answers';
const TITLE = "Why AI Sounds So Sure When It's Completely Wrong";
const URL = `https://jamesevans.au/blog/${SLUG}/`;

function renderShare() {
  return render(<ShareButtons slug={SLUG} title={TITLE} />);
}

/**
 * navigator.clipboard is getter-only in jsdom, so define it explicitly.
 * Must be called AFTER userEvent.setup(), which installs its own clipboard
 * stub and would otherwise overwrite this one.
 */
function stubClipboard(writeText: () => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true,
  });
}

describe('ShareButtons', () => {
  beforeEach(() => {
    // Default: no native share support (desktop-like).
    if ('share' in navigator) {
      // @ts-expect-error -- deleting an optional navigator member for the test
      delete navigator.share;
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('links to X with the title and canonical URL', () => {
    renderShare();
    const link = screen.getByRole('link', { name: 'Share on X' });
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining(encodeURIComponent(URL)),
    );
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining(encodeURIComponent(TITLE)),
    );
  });

  it('links to LinkedIn with the canonical URL', () => {
    renderShare();
    expect(screen.getByRole('link', { name: 'Share on LinkedIn' })).toHaveAttribute(
      'href',
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(URL)}`,
    );
  });

  it('opens social links in a new tab, safely', () => {
    renderShare();
    for (const name of ['Share on X', 'Share on LinkedIn']) {
      const link = screen.getByRole('link', { name });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('uses a mailto link that does not open a blank tab', () => {
    renderShare();
    const link = screen.getByRole('link', { name: 'Share by email' });
    expect(link.getAttribute('href')).toMatch(/^mailto:\?/);
    expect(link).not.toHaveAttribute('target');
  });

  it('copies the canonical URL and confirms it', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    renderShare();
    await user.click(screen.getByRole('button', { name: /copy link/i }));

    expect(writeText).toHaveBeenCalledWith(URL);
    await waitFor(() =>
      expect(screen.getByText('Copied')).toBeInTheDocument(),
    );
    // Announced to screen readers without stealing focus.
    expect(screen.getByText('Link copied to clipboard')).toBeInTheDocument();
  });

  it('does not claim success when the clipboard is blocked', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    stubClipboard(writeText);
    renderShare();
    await user.click(screen.getByRole('button', { name: /copy link/i }));

    expect(writeText).toHaveBeenCalled();
    expect(screen.queryByText('Copied')).not.toBeInTheDocument();
  });

  it('hides the native share button when the browser lacks the API', () => {
    renderShare();
    // "Copy link" is a button too, so match the bare "Share" label exactly.
    expect(
      screen.queryByRole('button', { name: /^share$/i }),
    ).not.toBeInTheDocument();
  });

  it('offers native sharing when the browser supports it', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { share });

    const user = userEvent.setup();
    renderShare();

    const button = await screen.findByRole('button', { name: /^share$/i });
    await user.click(button);
    expect(share).toHaveBeenCalledWith({ title: TITLE, url: URL });
  });

  it('survives the user dismissing the native share sheet', async () => {
    const share = vi.fn().mockRejectedValue(new Error('AbortError'));
    Object.assign(navigator, { share });

    const user = userEvent.setup();
    renderShare();
    const button = await screen.findByRole('button', { name: /^share$/i });

    // A dismissed sheet must not surface an error to the reader.
    await expect(user.click(button)).resolves.not.toThrow();
  });
});
