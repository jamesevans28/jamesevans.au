# API cheatsheet — GA4, Search Console, PageSpeed

The CLI (`npm run seo -- …`) wraps all of this; the raw passthroughs
(`ga report`, `ga admin`, `gsc api`) exist for anything not canned.

## Thresholds (interpretation guide)

| Signal                | Good                                                        | Notes                                                                                                           |
| --------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Title                 | 50–60 chars                                                 | Real limit is ~600px render width. Google rewrites ~61% of titles — mismatched title/H1 and stuffing trigger it |
| Meta description      | 120–158 chars                                               | Rewritten ~70% of the time; it's a CTR pitch, not a ranking lever                                               |
| LCP                   | ≤ 2.5s (poor > 4s)                                          | CrUX 75th percentile is what counts                                                                             |
| INP                   | ≤ 200ms (poor > 500ms)                                      | Most-failed vital in 2026 (~43% of sites)                                                                       |
| CLS                   | ≤ 0.1 (poor > 0.25)                                         | Static export should pass easily                                                                                |
| Internal links        | ~5–10 contextual per 2,000 words                            | Descriptive anchors; priority pages ≤3 clicks from home; zero orphans                                           |
| Engagement rate (GA4) | site-type dependent; compare pages to the site's own median | Engaged session = >10s, or key event, or ≥2 pageviews                                                           |
| GSC striking distance | position 4–15, high impressions                             | The highest-ROI query list, especially filtered `--country AUS`                                                 |
| CTR anomaly           | CTR well below peers at same position                       | Usually a title/meta problem on that page                                                                       |

## GA4 Data API (v1beta)

`POST properties/{id}:runReport` via `ga report --json '<body>'`.

Dimensions worth knowing: `pagePath`, `pageTitle`,
`landingPagePlusQueryString`, `sessionSource`, `sessionMedium`,
`sessionDefaultChannelGroup`, `country`, `region`, `city`, `date`,
`dayOfWeek`, `deviceCategory`, `firstUserSource`.

Metrics: `totalUsers`, `activeUsers`, `newUsers`, `sessions`,
`screenPageViews`, `engagementRate`, `bounceRate`, `engagedSessions`,
`userEngagementDuration`, `averageSessionDuration`, `keyEvents`,
`eventCount`.

Gotchas:

- `engagementRate`/`bounceRate` are **session-scoped** — pair with
  landing-page or source dimensions, not `pagePath`. For per-page
  stickiness use `userEngagementDuration / totalUsers` (the CLI's
  `avgEngagementSeconds` does this).
- Filters: `dimensionFilter: { filter: { fieldName: "country",
stringFilter: { value: "Australia" } } }`.
- Quotas: 200k tokens/day, 40k/hour per property — effectively unlimited
  here. Add `"returnPropertyQuota": true` to check.

## GA4 Admin API (v1beta)

Via `ga admin <METHOD> <path> [--json]`; `{property}` is substituted with
the discovered `properties/<id>`.

| Task                          | Call                                                                                                      |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| List account/property tree    | `GET /accountSummaries`                                                                                   |
| Property details              | `GET /{property}`                                                                                         |
| Data streams (measurement ID) | `GET /{property}/dataStreams`                                                                             |
| List key events               | `GET /{property}/keyEvents`                                                                               |
| Register key event            | `POST /{property}/keyEvents` `--json '{"eventName":"contact_click","countingMethod":"ONCE_PER_SESSION"}'` |
| Custom dimensions             | `GET                                                                                                      | POST /{property}/customDimensions` (`parameterName`, `displayName`, `scope: "EVENT"`) — limit 50 event-scoped |
| Data retention                | `GET /{property}/dataRetentionSettings` (PATCH = behavioural, ask James)                                  |

Deleting/archiving anything = destructive = ask James first.

## Search Console API

Search analytics via the canned commands; raw:
`POST /webmasters/v3/sites/{siteUrl}/searchAnalytics/query`.

- Dimensions: `query`, `page`, `country` (ISO-3166-1-**alpha-3**,
  lowercase — Australia is `aus`), `device`, `date`, `searchAppearance`.
- Data lags ~2 days (the CLI shifts its window accordingly); 16 months of
  history; 25k rows/request.
- Anonymised/rare queries are omitted — totals across queries won't match
  page totals. Normal, not a bug.
- URL Inspection (`gsc inspect <url>`): quota 2,000/day, 600/min. Returns
  Google's chosen canonical vs declared, crawl/index state, rich results.
  Key field: `inspectionResult.indexStatusResult.coverageState`.
- Sitemaps: `gsc sitemaps` lists status/errors; submit via
  `gsc api PUT /webmasters/v3/sites/{siteUrl}/sitemaps/{sitemapUrl}`
  (URL-encode both).

## PageSpeed Insights

`npm run seo -- psi <url> [--mobile]` — no auth, but keyless quota is a
shared pool that's often exhausted; set `PSI_API_KEY` for reliability.
`fieldData` (CrUX, real users, 75th percentile) is authoritative;
`lab` (Lighthouse) is diagnostic. Low-traffic pages have no field data —
expect `no CrUX data` and rely on lab + GSC's Core Web Vitals report.

## Auth model

gcloud **Application Default Credentials** as jjme28@gmail.com (owner of
the GA property and GSC site). Required scopes: `analytics.readonly`,
`analytics.edit`, `webmasters` (+ `cloud-platform`); quota project must
have `analyticsdata`, `analyticsadmin`, `searchconsole` APIs enabled.
`npm run seo -- auth` probes all three and prints the exact interactive
commands when something's missing. A service account is the fallback if
ADC proves flaky (create one, grant it on the GA property + GSC, point
`GOOGLE_APPLICATION_CREDENTIALS` at the key) — not needed while ADC works.

Overrides (env): `SEO_GA_PROPERTY` (skip discovery), `SEO_GSC_SITE`,
`SEO_SITE_URL`, `SEO_GA_MEASUREMENT_ID`, `PSI_API_KEY`.
