/**
 * Google API plumbing for the SEO CLI: auth via a dedicated service account,
 * plus discovery of the GA4 property and Search Console site.
 *
 * Auth is a service-account key, NOT gcloud ADC. gcloud's shared OAuth client
 * is blocked by Google from requesting Analytics and Search Console scopes
 * ("This app is blocked"), so ADC can't work here regardless of consent.
 *
 * The account lives in its own personal GCP project, deliberately isolated
 * from any client or employer project:
 *
 *   project: jamesevans-au-seo
 *   account: seo-agent@jamesevans-au-seo.iam.gserviceaccount.com
 *   key:     ~/.config/jamesevans-au-seo/seo-agent.json  (mode 600, never in git)
 *
 * The account email must be granted access in the GA4 and Search Console UIs —
 * IAM roles don't cover those products. `npm run seo -- auth` reports what's
 * missing. Override the key path with SEO_KEY_FILE.
 *
 * Logs contain aggregate metrics, page paths, and search queries only —
 * never reader personal data.
 */
import { createSign } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const MEASUREMENT_ID =
  process.env.SEO_GA_MEASUREMENT_ID ?? 'G-QG6QKVZNG9';
export const SITE_URL = process.env.SEO_SITE_URL ?? 'https://jamesevans.au/';

/** Personal project that owns the service account and pays for API quota. */
export const QUOTA_PROJECT =
  process.env.SEO_QUOTA_PROJECT ?? 'jamesevans-au-seo';

const CONFIG_DIR = join(homedir(), '.config', 'jamesevans-au-seo');

export const KEY_FILE =
  process.env.SEO_KEY_FILE ?? join(CONFIG_DIR, 'seo-agent.json');

/** PageSpeed Insights takes an API key, not OAuth — it rejects the Analytics
 *  scopes. Key is restricted to pagespeedonline and lives beside the SA key. */
export function psiApiKey(): string | undefined {
  if (process.env.PSI_API_KEY) return process.env.PSI_API_KEY;
  const path = join(CONFIG_DIR, 'psi-api-key.txt');
  return existsSync(path) ? readFileSync(path, 'utf8').trim() : undefined;
}

const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/analytics.edit',
  'https://www.googleapis.com/auth/webmasters',
].join(' ');

const GA_DATA = 'https://analyticsdata.googleapis.com/v1beta';
const GA_ADMIN = 'https://analyticsadmin.googleapis.com/v1beta';
const GSC = 'https://searchconsole.googleapis.com';

interface KeyFile {
  client_email: string;
  private_key: string;
}

export function serviceAccountEmail(): string {
  return readKey().client_email;
}

function readKey(): KeyFile {
  // SEO_SA_KEY carries the whole key JSON in an env var, for environments with
  // no home directory to read from — cloud routine runs, CI. Accepts raw JSON
  // or base64, since secret stores mangle multi-line values differently.
  const inline = process.env.SEO_SA_KEY;
  if (inline) {
    const text = inline.trimStart().startsWith('{')
      ? inline
      : Buffer.from(inline, 'base64').toString('utf8');
    return validateKey(JSON.parse(text) as KeyFile, 'SEO_SA_KEY');
  }
  if (!existsSync(KEY_FILE)) {
    throw new Error(
      `No service-account key at ${KEY_FILE}, and SEO_SA_KEY is unset.\n` +
        'Locally, create one (personal project, nothing to do with client work):\n' +
        `  gcloud iam service-accounts keys create ${KEY_FILE} \\\n` +
        `    --iam-account=seo-agent@${QUOTA_PROJECT}.iam.gserviceaccount.com --project=${QUOTA_PROJECT}\n` +
        'Or point SEO_KEY_FILE at an existing key. In a cloud/CI run, set ' +
        'SEO_SA_KEY to the key JSON (raw or base64).',
    );
  }
  return validateKey(
    JSON.parse(readFileSync(KEY_FILE, 'utf8')) as KeyFile,
    KEY_FILE,
  );
}

function validateKey(key: KeyFile, source: string): KeyFile {
  if (!key.client_email || !key.private_key) {
    throw new Error(`${source} is not a valid service-account key JSON file.`);
  }
  return key;
}

const b64url = (input: string | Buffer) =>
  Buffer.from(input).toString('base64url');

let cached: { token: string; expiresAt: number } | undefined;

/** Mint an access token by signing a JWT bearer assertion (RFC 7523).
 *  Tokens last an hour; reuse within a run. */
export async function accessToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt - 60_000) return cached.token;

  const key = readKey();
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: key.client_email,
    scope: SCOPES,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(
    JSON.stringify(claims),
  )}`;
  const signature = createSign('RSA-SHA256')
    .update(unsigned)
    .sign(key.private_key)
    .toString('base64url');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const body = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
    error?: string;
  };
  if (!res.ok || !body.access_token) {
    throw new Error(
      `Token exchange failed: ${body.error_description ?? body.error ?? res.status}`,
    );
  }
  cached = {
    token: body.access_token,
    expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
  };
  return cached.token;
}

export async function api(
  method: string,
  url: string,
  body?: unknown,
): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      // Bill quota to the personal SEO project, never to whichever project
      // gcloud happens to have selected.
      'x-goog-user-project': QUOTA_PROJECT,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  const json: Record<string, unknown> = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = json.error as { message?: string; status?: string } | undefined;
    const hint =
      res.status === 403 || res.status === 401
        ? `\nHint: the service account (${readKey().client_email}) needs to be granted access in the product's own UI —` +
          ' GA4 Admin → Property access management, and Search Console → Settings → Users and permissions.' +
          ' GCP IAM roles do not grant Analytics or Search Console access.'
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
