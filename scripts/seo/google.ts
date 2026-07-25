/**
 * Google API plumbing for the SEO CLI: auth via gcloud Application Default
 * Credentials, plus discovery of the GA4 property and Search Console site.
 *
 * Requires ADC with Analytics + Search Console scopes:
 *
 *   gcloud auth application-default login \
 *     --scopes=https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/analytics.edit,https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/webmasters
 *
 * The quota project (gcloud config: billing/quota_project) must have the
 * analyticsdata, analyticsadmin, and searchconsole APIs enabled.
 *
 * Logs contain aggregate metrics, page paths, and search queries only —
 * never reader personal data.
 */
import { execFileSync } from 'node:child_process';

export const MEASUREMENT_ID =
  process.env.SEO_GA_MEASUREMENT_ID ?? 'G-QG6QKVZNG9';
export const SITE_URL = process.env.SEO_SITE_URL ?? 'https://jamesevans.au/';

const GA_DATA = 'https://analyticsdata.googleapis.com/v1beta';
const GA_ADMIN = 'https://analyticsadmin.googleapis.com/v1beta';
const GSC = 'https://searchconsole.googleapis.com';

let cachedToken: string | undefined;

export function accessToken(): string {
  if (cachedToken) return cachedToken;
  try {
    cachedToken = execFileSync(
      'gcloud',
      ['auth', 'application-default', 'print-access-token'],
      { encoding: 'utf8' },
    ).trim();
  } catch {
    throw new Error(
      'Could not get a Google access token. Run:\n' +
        '  gcloud auth application-default login \\\n' +
        '    --scopes=https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/analytics.edit,https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/webmasters',
    );
  }
  return cachedToken;
}

export async function api(
  method: string,
  url: string,
  body?: unknown,
): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  const json: Record<string, unknown> = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = json.error as { message?: string; status?: string } | undefined;
    const hint =
      err?.status === 'PERMISSION_DENIED'
        ? '\nHint: the ADC token is missing scopes. Re-run the gcloud login command in scripts/seo/google.ts, and ensure the analyticsdata/analyticsadmin/searchconsole APIs are enabled on the quota project.'
        : '';
    throw new Error(
      `${method} ${url} → ${res.status} ${err?.message ?? text}${hint}`,
    );
  }
  return json;
}

/** GA Admin API call, path relative to v1beta (e.g. `/accountSummaries`). */
export const gaAdmin = (method: string, path: string, body?: unknown) =>
  api(method, `${GA_ADMIN}${path}`, body);

/** GA Data API report against the discovered property. */
export async function gaReport(request: Record<string, unknown>) {
  const property = await propertyName();
  return api('POST', `${GA_DATA}/${property}:runReport`, request);
}

export async function gaRealtime(request: Record<string, unknown>) {
  const property = await propertyName();
  return api('POST', `${GA_DATA}/${property}:runRealtimeReport`, request);
}

/** Search Console API call, path relative to the API root. */
export const gsc = (method: string, path: string, body?: unknown) =>
  api(method, `${GSC}${path}`, body);

// ---- discovery ----------------------------------------------------------

let cachedProperty: string | undefined;

/** Find the GA4 property (`properties/123`) whose web stream carries our
 *  measurement ID, so nothing numeric is hardcoded. */
export async function propertyName(): Promise<string> {
  if (cachedProperty) return cachedProperty;
  if (process.env.SEO_GA_PROPERTY) {
    cachedProperty = `properties/${process.env.SEO_GA_PROPERTY.replace(/^properties\//, '')}`;
    return cachedProperty;
  }
  const summaries = await gaAdmin('GET', '/accountSummaries');
  const accounts = (summaries.accountSummaries ?? []) as Array<{
    propertySummaries?: Array<{ property: string; displayName: string }>;
  }>;
  const properties = accounts.flatMap((a) => a.propertySummaries ?? []);
  for (const p of properties) {
    const streams = await gaAdmin('GET', `/${p.property}/dataStreams`);
    const match = (
      (streams.dataStreams ?? []) as Array<Record<string, unknown>>
    ).find(
      (s) =>
        (s.webStreamData as { measurementId?: string } | undefined)
          ?.measurementId === MEASUREMENT_ID,
    );
    if (match) {
      cachedProperty = p.property;
      return cachedProperty;
    }
  }
  throw new Error(
    `No GA4 property found with a web stream for ${MEASUREMENT_ID}. ` +
      'Set SEO_GA_PROPERTY=<numeric id> to override discovery.',
  );
}

/** The Search Console property for the site (domain property preferred). */
export async function gscSite(): Promise<string> {
  if (process.env.SEO_GSC_SITE) return process.env.SEO_GSC_SITE;
  const res = await gsc('GET', '/webmasters/v3/sites');
  const sites = (
    (res.siteEntry ?? []) as Array<{ siteUrl: string; permissionLevel: string }>
  )
    .filter((s) => s.permissionLevel !== 'siteUnverifiedUser')
    .map((s) => s.siteUrl);
  const host = new URL(SITE_URL).hostname.replace(/^www\./, '');
  const match =
    sites.find((s) => s === `sc-domain:${host}`) ??
    sites.find((s) => s.includes(host));
  if (!match) {
    throw new Error(
      `No verified Search Console property for ${host}. Available: ${sites.join(', ') || '(none)'}. ` +
        'Add the property at https://search.google.com/search-console, or set SEO_GSC_SITE.',
    );
  }
  return match;
}

export function daysAgoIso(days: number): string {
  const d = new Date(Date.now() - days * 86_400_000);
  return d.toISOString().slice(0, 10);
}
