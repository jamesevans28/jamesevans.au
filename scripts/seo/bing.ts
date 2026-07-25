/**
 * Bing Webmaster Tools — reporting only. URL submission goes through
 * IndexNow instead (see indexnow.ts): one call, fans out to every
 * participant, no per-site quota negotiation.
 *
 * Why Bing matters for this site: ChatGPT's search leans on Bing's index,
 * so Bing coverage is a GEO lever, not just a second-place search engine.
 *
 * Auth is a simple API key (Bing supports OAuth too, but a key is the right
 * fit for a CLI). Key lives at ~/.config/jamesevans-au-seo/bing-api-key.txt,
 * mode 600, never in the repo. It is ONE key per user, not per site —
 * regenerating it in the Bing UI breaks every consumer.
 *
 * Three API quirks worth knowing, all handled here:
 *   - every response is wrapped in a {"d": …} envelope
 *   - dates are WCF format, /Date(1316156400000-0700)/, not ISO 8601
 *   - ALL errors return HTTP 400, including bad auth and quota; the real
 *     reason is only in the body, so status codes alone tell you nothing
 *
 * Microsoft's docs for this API are effectively unmaintained (2019–2022
 * vintage, several pages now 404), so response shapes are verified against
 * live calls rather than trusted from documentation.
 *
 * Logs contain aggregate metrics, page paths, and search queries only —
 * never reader personal data.
 */
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const BASE = 'https://ssl.bing.com/webmaster/api.svc/json';
const KEY_PATH =
  process.env.BING_KEY_FILE ??
  join(homedir(), '.config', 'jamesevans-au-seo', 'bing-api-key.txt');

export function bingApiKey(): string {
  if (process.env.BING_API_KEY) return process.env.BING_API_KEY;
  if (!existsSync(KEY_PATH)) {
    throw new Error(
      `No Bing API key at ${KEY_PATH}.\n` +
        'Get one at https://www.bing.com/webmasters → Settings → API Access → ' +
        'Generate API Key, then save it to that path (chmod 600).',
    );
  }
  return readFileSync(KEY_PATH, 'utf8').trim();
}

/** Parse WCF `/Date(ms±offset)/` into an ISO date string. Returns the input
 *  unchanged if it isn't that format, so callers can pass values blindly.
 *
 *  Bing sends the .NET zero date (year 0001) to mean "never" — e.g. a URL it
 *  has not crawled. Surfacing that as a real 1st-January timestamp reads as
 *  data when it is the absence of data, so it becomes null. */
export function wcfDate(value: string): string | null {
  const m = /^\/Date\((-?\d+)([+-]\d{4})?\)\/$/.exec(value);
  if (!m) return value;
  const date = new Date(Number(m[1]));
  return date.getUTCFullYear() <= 1 ? null : date.toISOString();
}

/** Recursively convert any WCF date strings and strip __type noise. */
function clean(value: unknown): unknown {
  if (typeof value === 'string') return wcfDate(value);
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([k]) => k !== '__type')
        .map(([k, v]) => [k, clean(v)]),
    );
  }
  return value;
}

async function call(
  method: string,
  params: Record<string, string> = {},
): Promise<unknown> {
  const query = new URLSearchParams({ ...params, apikey: bingApiKey() });
  const res = await fetch(`${BASE}/${method}?${query}`);
  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(
      `${method} → ${res.status}, non-JSON response: ${text.slice(0, 200)}`,
    );
  }
  // Bing returns 400 for everything from a bad key to an exhausted quota,
  // so trust the body over the status code.
  const err = body as { ErrorCode?: number; Message?: string };
  if (err?.ErrorCode !== undefined || !res.ok) {
    const hint =
      err?.Message === 'InvalidApiKey'
        ? `\nHint: the key at ${KEY_PATH} was rejected. Regenerate it at ` +
          'bing.com/webmasters → Settings → API Access.'
        : '';
    throw new Error(
      `${method} → ${res.status} ${err?.Message ?? text.slice(0, 200)}` +
        `${err?.ErrorCode !== undefined ? ` (ErrorCode ${err.ErrorCode})` : ''}${hint}`,
    );
  }
  return clean((body as { d?: unknown }).d);
}

let cachedSite: string | undefined;

/** The verified site string, taken verbatim from GetUserSites.
 *
 * This must match exactly how the site was verified — scheme, host, and
 * trailing slash included. There is no `sc-domain:` equivalent, and a
 * near-miss (http vs https, with/without www) fails silently rather than
 * erroring, which is the single most common way this API wastes your time.
 * Verified 25 Jul 2026: Bing expects `https://jamesevans.au/`. */
export async function bingSite(): Promise<string> {
  if (cachedSite) return cachedSite;
  if (process.env.BING_SITE_URL)
    return (cachedSite = process.env.BING_SITE_URL);
  const sites = (await call('GetUserSites')) as Array<{
    Url: string;
    IsVerified: boolean;
  }>;
  const verified = sites.filter((s) => s.IsVerified);
  if (verified.length === 0) {
    throw new Error(
      'No verified sites in Bing Webmaster Tools. Add and verify jamesevans.au ' +
        'at https://www.bing.com/webmasters (importing from Google Search Console ' +
        'auto-verifies), or set BING_SITE_URL.',
    );
  }
  const host = 'jamesevans.au';
  cachedSite =
    verified.find((s) => s.Url.includes(host))?.Url ?? verified[0]!.Url;
  return cachedSite;
}

export const listSites = () => call('GetUserSites');

/** Daily impressions/clicks series. Use this rather than GetQueryStats for
 *  trend work — query stats only refresh weekly. */
export const rankAndTraffic = async () =>
  call('GetRankAndTrafficStats', { siteUrl: await bingSite() });

/** Per-query impressions, clicks, and average positions. Refreshes WEEKLY —
 *  don't compute day-over-day deltas from it. */
export const queryStats = async () =>
  call('GetQueryStats', { siteUrl: await bingSite() });

export const pageStats = async () =>
  call('GetPageStats', { siteUrl: await bingSite() });

/** Crawl problems Bing hit. `Issues` is a BITMASK int, not an enum value —
 *  decode flags rather than comparing equality. Microsoft's numeric→name
 *  table is missing from current docs, so treat unknown bits as unknown
 *  rather than guessing a label. */
export const crawlIssues = async () =>
  call('GetCrawlIssues', { siteUrl: await bingSite() });

export const crawlStats = async () =>
  call('GetCrawlStats', { siteUrl: await bingSite() });

/** Index status for one URL: crawl date, discovery date, HTTP status. */
export const urlInfo = async (url: string) =>
  call('GetUrlInfo', { siteUrl: await bingSite(), url });

/** Remaining submission quota. Earned from site age and impressions, so new
 *  sites start low (often ~100/day) against a 10,000/day ceiling. */
export const submissionQuota = async () =>
  call('GetUrlSubmissionQuota', { siteUrl: await bingSite() });
