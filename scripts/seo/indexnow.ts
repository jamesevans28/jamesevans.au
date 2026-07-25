/**
 * IndexNow — push new and updated URLs to participating search engines
 * instead of waiting to be crawled.
 *
 * Submitting to api.indexnow.org fans out to every participant, so one call
 * is enough. Participants (indexnow.org/searchengines.json): Bing, Yandex,
 * Seznam, Naver, Yep, Internet Archive, Amazon.
 *
 * Google does NOT support IndexNow and never adopted it — this has zero
 * effect on Google. Google discovery comes from sitemap.xml plus Search
 * Console. The reason this is still worth doing: ChatGPT's search leans on
 * Bing's index, so being in Bing quickly is a GEO lever.
 *
 * The key is public by design — it's proof we control the domain, served at
 * https://jamesevans.au/<key>.txt. It is NOT a secret and lives in public/.
 *
 * Bing's guidance: submit URLs changed *after* adopting IndexNow. Don't
 * backfill the archive — bulk historical dumps risk 429s and look spammy.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ENDPOINT = 'https://api.indexnow.org/indexnow';
const PUBLIC_DIR = join(process.cwd(), 'public');

/** The key is whichever long hex-ish `<key>.txt` sits in public/. Derived
 *  rather than hardcoded so rotating the key is just replacing the file.
 *  Deliberately narrower than the IndexNow spec allows (32+ chars, hex only)
 *  so an unrelated public/*.txt can never be mistaken for the key. */
export function indexNowKey(): string {
  if (process.env.INDEXNOW_KEY) return process.env.INDEXNOW_KEY;
  if (!existsSync(PUBLIC_DIR)) throw new Error('no public/ directory');
  const match = readdirSync(PUBLIC_DIR).find((f) =>
    /^[a-f0-9]{32,128}\.txt$/.test(f),
  );
  if (!match) {
    throw new Error(
      'No IndexNow key file in public/. Create one: a file named <key>.txt ' +
        'whose entire content is the key (8–128 chars of a-z A-Z 0-9 and dashes).',
    );
  }
  return match.replace(/\.txt$/, '');
}

export interface SubmitResult {
  status: number;
  meaning: string;
  submitted: number;
  urls: string[];
  keyFileLive: boolean;
}

/** Is the key file actually served from the live site?
 *
 * This matters more than it looks: IndexNow returns 202 "validation pending"
 * and validates the key asynchronously, so a 202 is NOT proof the submission
 * will be honoured. Observed 25 Jul 2026 — 202 returned while the key file
 * was still 404ing. Check up front so a doomed submission isn't reported as
 * a success. */
export async function keyFileLive(siteUrl: string): Promise<boolean> {
  const host = new URL(siteUrl).hostname;
  try {
    const res = await fetch(`https://${host}/${indexNowKey()}.txt`);
    if (!res.ok) return false;
    return (await res.text()).trim() === indexNowKey();
  } catch {
    return false;
  }
}

const MEANINGS: Record<number, string> = {
  200: 'accepted',
  202: 'accepted, key validation pending',
  400: 'invalid request format',
  403: 'key not found or not matching — check the key file is deployed',
  422: 'URLs do not match the declared host, or key schema mismatch',
  429: 'rate limited (treated as spam) — slow down',
};

/** Submit URLs. Batch limit is 10,000; all must share the declared host. */
export async function submitUrls(
  urls: string[],
  siteUrl: string,
): Promise<SubmitResult> {
  if (urls.length === 0) throw new Error('no URLs to submit');
  if (urls.length > 10_000)
    throw new Error(
      `IndexNow accepts at most 10,000 URLs (got ${urls.length})`,
    );

  const host = new URL(siteUrl).hostname;
  const offHost = urls.filter((u) => new URL(u).hostname !== host);
  if (offHost.length) {
    throw new Error(
      `these URLs are not on ${host} and would 422: ${offHost.join(', ')}`,
    );
  }

  const key = indexNowKey();
  const live = await keyFileLive(siteUrl);
  if (!live) {
    throw new Error(
      `The IndexNow key file is not served at https://${host}/${key}.txt — ` +
        'submissions would be silently discarded (the API still returns 202 and ' +
        'validates the key later). Deploy public/' +
        `${key}.txt first, then retry.`,
    );
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host,
      key,
      keyLocation: `https://${host}/${key}.txt`,
      urlList: urls,
    }),
  });

  return {
    status: res.status,
    meaning: MEANINGS[res.status] ?? `unexpected status ${res.status}`,
    submitted: res.ok ? urls.length : 0,
    urls,
    keyFileLive: live,
  };
}

/** Read the built sitemap to find every indexable URL. Used by `--all` for
 *  the initial adoption ping; routine use should pass specific URLs. */
export function sitemapUrls(): string[] {
  const path = join(process.cwd(), 'out', 'sitemap.xml');
  if (!existsSync(path)) {
    throw new Error('no out/sitemap.xml — run `npm run build` first');
  }
  return [...readFileSync(path, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (m) => m[1]!,
  );
}
