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

`npm run seo -- psi <url> [--mobile]` — uses an API key restricted to
`pagespeedonline.googleapis.com` at
`~/.config/jamesevans-au-seo/psi-api-key.txt` (or `PSI_API_KEY`). PSI
rejects the Analytics OAuth scopes, so a key is the only option; using our
own key also avoids the anonymous shared quota pool, which is routinely
exhausted. `fieldData` (CrUX, real users, 75th percentile) is
authoritative; `lab` (Lighthouse) is diagnostic. Low-traffic pages have no
field data — expect `no CrUX data` and rely on lab + GSC's Core Web Vitals
report. Baseline recorded 25 Jul 2026 for `/`: performance 99, SEO 100,
LCP 0.3s, CLS 0.001.

## Auth model

A **dedicated service account in a personal GCP project**, deliberately
isolated from any client or employer project:

- project `jamesevans-au-seo` (no org/folder parent; jjme28@gmail.com sole owner)
- account `seo-agent@jamesevans-au-seo.iam.gserviceaccount.com`
- key `~/.config/jamesevans-au-seo/seo-agent.json` (mode 600, never committed)
- APIs enabled: analyticsdata, analyticsadmin, searchconsole, pagespeedonline
- the account holds `roles/serviceusage.serviceUsageConsumer` on its own
  project, which it needs to spend that project's quota
- every request sends `x-goog-user-project: jamesevans-au-seo`, so quota
  never bills to whichever project gcloud happens to have selected

**gcloud ADC cannot be used here.** gcloud's shared OAuth client is blocked
by Google from requesting Analytics and Search Console scopes — the consent
screen returns "This app is blocked" no matter what the user approves. The
CLI signs its own JWT assertion (RFC 7523) instead, so there is no consent
screen and no browser step.

**GCP IAM does not grant Analytics or Search Console access** — those are
granted inside each product's own UI, per property:

1. GA4 → Admin → Property access management → add the service account email
   (Viewer to read; Editor to let the skill manage custom dimensions and key events).
2. Search Console → Settings → Users and permissions → add the same email as
   Full user (Full is required for the URL Inspection API).

`npm run seo -- auth` probes all three surfaces and prints these steps with
the exact email when anything is missing.

Overrides (env): `SEO_KEY_FILE`, `SEO_QUOTA_PROJECT`, `SEO_GA_PROPERTY`
(skip discovery), `SEO_GSC_SITE`, `SEO_SITE_URL`, `SEO_GA_MEASUREMENT_ID`,
`PSI_API_KEY`.
