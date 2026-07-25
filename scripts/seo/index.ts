/**
 * SEO data CLI. Run via `npm run seo -- <command>`.
 *
 *   auth                       check API access and print remediation steps
 *   audit                      static on-page audit of the built out/ export
 *   psi <url> [--mobile]       PageSpeed Insights: Core Web Vitals lab + field
 *   snapshot [--days N]        combined GA + GSC overview (default 28 days)
 *   ga pages [--days N]        per-page views, engagement, avg time
 *   ga geo [--days N]          traffic by country (and AU share)
 *   ga sources [--days N]      session source / medium
 *   ga trends [--days N]       daily users and views time series
 *   ga report --json <body>    raw GA4 Data API runReport passthrough
 *   ga admin <METHOD> <path> [--json <body>]
 *                              raw GA4 Admin API passthrough (full control:
 *                              custom dimensions, key events, streams…)
 *   gsc queries [--days N] [--country AUS] [--page <url>]
 *   gsc pages [--days N] [--country AUS]
 *   gsc countries [--days N]
 *   gsc devices [--days N]
 *   gsc inspect <url>          URL Inspection API (index status, canonical)
 *   gsc sitemaps               list submitted sitemaps and their status
 *   gsc api <METHOD> <path> [--json <body>]
 *                              raw Search Console API passthrough
 *
 * Everything prints JSON to stdout so the caller (the seo skill) can reason
 * over it. Access is via gcloud ADC — see scripts/seo/google.ts for setup.
 *
 * Logs contain aggregate metrics, page paths, and search queries only —
 * never reader personal data.
 */
import {
  accessToken,
  api,
  daysAgoIso,
  gaAdmin,
  gaReport,
  gsc,
  gscSite,
  propertyName,
  psiApiKey,
  serviceAccountEmail,
  KEY_FILE,
  MEASUREMENT_ID,
  QUOTA_PROJECT,
  SITE_URL,
} from './google';
import { runAudit } from './audit';

const argv = process.argv.slice(2);

function fail(message: string): never {
  console.error(`\n  ✗ ${message}\n`);
  process.exit(1);
}

function flag(name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
}

const days = () => {
  const n = Number(flag('days') ?? 28);
  if (!Number.isFinite(n) || n < 1) fail('--days must be a positive number');
  return n;
};

const out = (data: unknown) => console.log(JSON.stringify(data, null, 2));

function jsonFlag(): Record<string, unknown> | undefined {
  const raw = flag('json');
  if (raw === undefined) return undefined;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    fail('--json must be valid JSON');
  }
}

/** Flatten a GA4 Data API response into an array of plain objects. */
function gaRows(
  res: Record<string, unknown>,
): Array<Record<string, string | number>> {
  const dims = ((res.dimensionHeaders ?? []) as Array<{ name: string }>).map(
    (h) => h.name,
  );
  const mets = ((res.metricHeaders ?? []) as Array<{ name: string }>).map(
    (h) => h.name,
  );
  return (
    (res.rows ?? []) as Array<Record<string, Array<{ value: string }>>>
  ).map((row) => {
    const o: Record<string, string | number> = {};
    dims.forEach((d, i) => (o[d] = row.dimensionValues?.[i]?.value ?? ''));
    mets.forEach((m, i) => {
      const v = row.metricValues?.[i]?.value ?? '';
      o[m] = /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v;
    });
    return o;
  });
}

const dateRange = (n: number) => [
  { startDate: daysAgoIso(n), endDate: 'today' },
];

async function gaPages(n: number) {
  const res = await gaReport({
    dateRanges: dateRange(n),
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'totalUsers' },
      { name: 'engagementRate' },
      { name: 'userEngagementDuration' },
      { name: 'sessions' },
    ],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 100,
  });
  return gaRows(res).map((r) => ({
    ...r,
    // seconds of engaged time per user — comparable across pages
    avgEngagementSeconds:
      Number(r.totalUsers) > 0
        ? Math.round(
            (Number(r.userEngagementDuration) / Number(r.totalUsers)) * 10,
          ) / 10
        : 0,
  }));
}

async function gaGeo(n: number) {
  const res = await gaReport({
    dateRanges: dateRange(n),
    dimensions: [{ name: 'country' }],
    metrics: [
      { name: 'totalUsers' },
      { name: 'sessions' },
      { name: 'engagementRate' },
    ],
    orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
    limit: 50,
  });
  const rows = gaRows(res);
  const total = rows.reduce((s, r) => s + Number(r.totalUsers), 0);
  const au = rows.find((r) => r.country === 'Australia');
  return {
    totalUsers: total,
    australiaShare:
      total > 0
        ? Math.round(((Number(au?.totalUsers) || 0) / total) * 1000) / 10
        : 0,
    countries: rows,
  };
}

async function gaSources(n: number) {
  return gaRows(
    await gaReport({
      dateRanges: dateRange(n),
      dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'engagementRate' },
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 50,
    }),
  );
}

async function gaTrends(n: number) {
  return gaRows(
    await gaReport({
      dateRanges: dateRange(n),
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'sessions' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),
  );
}

async function gscQuery(n: number, dimensions: string[], filters?: unknown[]) {
  const site = await gscSite();
  const res = await gsc(
    'POST',
    `/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    {
      // GSC data lags ~2 days; shift the window so the tail isn't empty
      startDate: daysAgoIso(n + 2),
      endDate: daysAgoIso(2),
      dimensions,
      rowLimit: 100,
      ...(filters?.length ? { dimensionFilterGroups: [{ filters }] } : {}),
    },
  );
  return (
    (res.rows ?? []) as Array<{
      keys: string[];
      clicks?: number;
      impressions?: number;
      ctr?: number;
      position?: number;
    }>
  ).map((r) => {
    const o: Record<string, string | number> = {};
    dimensions.forEach((d, i) => (o[d] = r.keys[i] ?? ''));
    return {
      ...o,
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: Math.round((r.ctr ?? 0) * 1000) / 10,
      position: Math.round((r.position ?? 0) * 10) / 10,
    };
  });
}

function gscFilters(): unknown[] {
  const filters: unknown[] = [];
  const country = flag('country');
  const page = flag('page');
  if (country)
    filters.push({ dimension: 'country', expression: country.toLowerCase() });
  if (page) filters.push({ dimension: 'page', expression: page });
  return filters;
}

async function main() {
  const [cmd, sub, ...rest] = argv;

  switch (cmd) {
    case 'auth': {
      const email = serviceAccountEmail();
      await accessToken(); // fails loudly if the key is bad
      const checks: Record<string, string> = {};
      const probe = async (name: string, fn: () => Promise<unknown>) => {
        try {
          await fn();
          checks[name] = 'ok';
        } catch (e) {
          checks[name] = (e as Error).message.split('\n')[0] ?? 'failed';
        }
      };
      await probe('ga-admin (analytics.edit)', () =>
        gaAdmin('GET', '/accountSummaries'),
      );
      await probe('ga-data (analytics.readonly)', () =>
        gaReport({
          dateRanges: dateRange(7),
          metrics: [{ name: 'totalUsers' }],
        }),
      );
      await probe('search-console (webmasters)', () => gscSite());
      out({
        serviceAccount: email,
        quotaProject: QUOTA_PROJECT,
        keyFile: KEY_FILE,
        measurementId: MEASUREMENT_ID,
        siteUrl: SITE_URL,
        checks,
      });
      if (Object.values(checks).some((v) => v !== 'ok')) {
        console.error(
          '\nThe service account exists but still needs access granted in each product’s own UI\n' +
            '(GCP IAM roles do not cover Analytics or Search Console). James must:\n\n' +
            `  1. GA4 → Admin → Property access management → add ${email}\n` +
            '     as Viewer (or Editor, to let the skill manage custom dimensions and key events).\n' +
            `  2. Search Console → Settings → Users and permissions → add ${email}\n` +
            '     as Full user (needed for the URL Inspection API).\n\n' +
            'Then re-run: npm run seo -- auth\n',
        );
        process.exit(2);
      }
      return;
    }

    case 'audit': {
      const { pages, findings } = runAudit();
      out({
        pages,
        errors: findings.filter((f) => f.severity === 'error').length,
        warnings: findings.filter((f) => f.severity === 'warn').length,
        findings,
      });
      return;
    }

    case 'psi': {
      const url = sub ?? SITE_URL;
      const strategy = argv.includes('--mobile') ? 'mobile' : 'desktop';
      // PSI wants an API key (it rejects the Analytics OAuth scopes). With the
      // key, quota bills to the personal SEO project instead of the anonymous
      // shared pool, which is routinely exhausted.
      const key = psiApiKey();
      if (!key)
        fail(
          'PageSpeed needs an API key. Expected ~/.config/jamesevans-au-seo/psi-api-key.txt ' +
            'or PSI_API_KEY. Create one restricted to pagespeedonline.googleapis.com ' +
            `on the ${QUOTA_PROJECT} project.`,
        );
      const endpoint =
        'https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed' +
        `?url=${encodeURIComponent(url)}&strategy=${strategy}` +
        `&category=performance&category=seo&key=${key}`;
      const res = await fetch(endpoint);
      const data = (await res.json()) as {
        error?: { message?: string };
        loadingExperience?: {
          metrics?: Record<string, { percentile: number; category: string }>;
        };
        lighthouseResult?: {
          categories?: Record<string, { score: number }>;
          audits?: Record<
            string,
            { numericValue?: number; displayValue?: string }
          >;
        };
      };
      if (!res.ok) fail(`PageSpeed API: ${data.error?.message ?? res.status}`);
      const lab = data.lighthouseResult?.audits ?? {};
      out({
        url,
        strategy,
        // CrUX field data (real users, 75th percentile) — may be absent on low-traffic sites
        fieldData:
          data.loadingExperience?.metrics ?? 'no CrUX data (traffic too low)',
        scores: Object.fromEntries(
          Object.entries(data.lighthouseResult?.categories ?? {}).map(
            ([k, v]) => [k, Math.round(v.score * 100)],
          ),
        ),
        lab: {
          lcp: lab['largest-contentful-paint']?.displayValue,
          cls: lab['cumulative-layout-shift']?.displayValue,
          tbt: lab['total-blocking-time']?.displayValue,
          fcp: lab['first-contentful-paint']?.displayValue,
        },
      });
      return;
    }

    case 'snapshot': {
      const n = days();
      const [pages, geo, sources, queries, gscPages] = await Promise.all([
        gaPages(n),
        gaGeo(n),
        gaSources(n),
        gscQuery(n, ['query']),
        gscQuery(n, ['page']),
      ]);
      out({
        windowDays: n,
        analytics: {
          topPages: pages.slice(0, 25),
          geo,
          sources: sources.slice(0, 15),
        },
        search: {
          topQueries: queries.slice(0, 25),
          topPages: gscPages.slice(0, 25),
        },
      });
      return;
    }

    case 'ga': {
      const n = days();
      if (sub === 'pages') return out(await gaPages(n));
      if (sub === 'geo') return out(await gaGeo(n));
      if (sub === 'sources') return out(await gaSources(n));
      if (sub === 'trends') return out(await gaTrends(n));
      if (sub === 'report') {
        const body = jsonFlag();
        if (!body) fail('ga report requires --json <runReport body>');
        return out(await gaReport(body));
      }
      if (sub === 'admin') {
        const [method, path] = rest;
        if (!method || !path?.startsWith('/'))
          fail(
            'usage: ga admin <GET|POST|PATCH|DELETE> </path> [--json <body>]',
          );
        const property = await propertyName();
        return out(
          await gaAdmin(
            method.toUpperCase(),
            path.replace('{property}', property),
            jsonFlag(),
          ),
        );
      }
      fail(`unknown ga subcommand: ${sub ?? '(none)'}`);
      return;
    }

    case 'gsc': {
      const n = days();
      if (sub === 'queries')
        return out(await gscQuery(n, ['query'], gscFilters()));
      if (sub === 'pages')
        return out(await gscQuery(n, ['page'], gscFilters()));
      if (sub === 'countries') return out(await gscQuery(n, ['country']));
      if (sub === 'devices') return out(await gscQuery(n, ['device']));
      if (sub === 'inspect') {
        const url = rest[0] ?? flag('page');
        if (!url) fail('usage: gsc inspect <url>');
        const site = await gscSite();
        return out(
          await api(
            'POST',
            'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
            {
              inspectionUrl: url,
              siteUrl: site,
            },
          ),
        );
      }
      if (sub === 'sitemaps') {
        const site = await gscSite();
        return out(
          await gsc(
            'GET',
            `/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps`,
          ),
        );
      }
      if (sub === 'api') {
        const [method, path] = rest;
        if (!method || !path?.startsWith('/'))
          fail('usage: gsc api <GET|POST|PUT|DELETE> </path> [--json <body>]');
        return out(await gsc(method.toUpperCase(), path, jsonFlag()));
      }
      fail(`unknown gsc subcommand: ${sub ?? '(none)'}`);
      return;
    }

    default:
      fail(
        `unknown command: ${cmd ?? '(none)'} — see scripts/seo/index.ts header for usage`,
      );
  }
}

main().catch((e) => fail((e as Error).message));
