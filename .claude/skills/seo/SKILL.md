---
name: seo
description: Monitor and improve search performance for jamesevans.au — Google Analytics 4 and Search Console monitoring, page/post engagement trends, technical on-page audits (titles, metas, headings, canonicals, internal links, Core Web Vitals), GEO audits (how citable the content is for AI systems like Claude, ChatGPT, and Perplexity), and growing Australian organic traffic. Use when James asks about SEO, traffic, rankings, analytics, search performance, why a page isn't ranking, AI-search visibility, or wants an audit or weekly review.
---

# SEO for jamesevans.au

The goal is compounding organic growth for a personal site with a blog
("AI, in plain English"), with **Australia as the priority market**. This
skill has three jobs: **watch** (GA4 + Search Console trends), **diagnose**
(technical and GEO audits), and **act** (concrete fixes, applied in the repo).

**Data comes from the CLI, never from memory.** All Google data flows
through `npm run seo -- <command>` (see `scripts/seo/index.ts` header for
the full command list). Never invent or extrapolate a metric — if a number
isn't in CLI output, say so. If the CLI reports scope errors, stop and give
James the remediation commands it prints (they're interactive; only he can
run them).

Reference material in this skill's directory:

- `reference/geo-audit.md` — the GEO rubric (run it per page, in full)
- `reference/api-cheatsheet.md` — GA4 dimensions/metrics, GSC details,
  Admin API paths, quotas, and all numeric thresholds

## Non-negotiables

- **No PII, ever.** Report aggregates, page paths, and search queries only.
  Never log or store anything about individual visitors.
- **GA Admin API writes are gated.** Reading anything is always fine.
  Additive changes (create a custom dimension, register a key event,
  extend retention) may proceed when they serve a stated goal — but say
  what changed and why in the run summary. **Destructive or behavioural
  changes (deleting/archiving anything, changing data filters, editing
  streams, touching Consent settings) require James's explicit go-ahead
  in this conversation, every time.**
- **Fixes land as code, not opinions.** A finding worth reporting is worth
  a diff. Small, safe fixes (a long title, a missing alt) — apply directly.
  Structural changes (URL/canonical changes, robots rules, removing pages)
  — propose first. Never change a published post's URL.
- **Honest severity.** The audit is only useful if a quiet report means
  the site is genuinely healthy. Don't pad reports with non-issues to look
  thorough; "no action needed" is a valid conclusion.

## Modes

Pick the mode from what James asked; run "weekly review" when scheduled or
when the ask is general ("how's the site doing?").

### 1. Weekly review (default / scheduled)

The recurring health check. Runs unattended — never ask questions; state
assumptions and continue.

1. `npm run seo -- snapshot --days 28` — GA + GSC combined view.
2. `npm run seo -- ga trends --days 28` — is traffic growing?
3. `npm run seo -- gsc queries --days 28 --country AUS` — AU search reality.
4. `npm run build && npm run seo -- audit` — regression check on the export.
5. Compare against the previous report in `docs/seo/` (see Reports below).

Deliverable: a report answering five questions — traffic direction, which
pages/posts win and lose on engagement, what Australia searches to find us,
striking-distance opportunities (position 4–15, sorted by impressions),
and any new technical findings. End with ≤3 prioritised actions, each with
its grounding evidence. Apply the safe ones in the same run.

### 2. Technical audit

Deep on-page and crawlability pass:

1. `npm run build && npm run seo -- audit` — deterministic checks: titles,
   metas, H1/hierarchy, canonicals, link graph (orphans/depth/anchors/broken
   links), image alts and dimensions, robots.txt AI-crawler access, sitemap
   consistency, JSON-LD presence and deprecated types, AU spelling.
2. `npm run seo -- psi <url>` and `--mobile` for key pages — Core Web
   Vitals (thresholds in the cheatsheet). Field (CrUX) data beats lab data
   when present.
3. `npm run seo -- gsc inspect <url>` for pages with suspected index
   problems — Google's chosen canonical vs ours, last crawl, index state.
4. `npm run seo -- gsc sitemaps` — submitted, current, error-free.

Interpret with the thresholds in `reference/api-cheatsheet.md`. The audit
script reports evidence; you decide severity in context (e.g. a 62-char
title that reads well beats a truncated 58-char one).

### 3. GEO audit

How likely is our content to be cited by Claude, ChatGPT, Perplexity, and
Google AI Overviews? Work through `reference/geo-audit.md` per page —
it covers source credibility, citation-worthy formatting, E-E-A-T,
entity clarity, AI-snippet readiness, and content authority, with the
evidence base for each. This mode is mostly reading the built pages
(`out/`) and the source in `src/app/` — the judgement is yours, not a
script's. Report per-page scores against the rubric and rewrite the
weakest sections (blog copy changes go through the `blog-post` skill's
voice rules).

### 4. Page performance analysis

"Why does post X outperform post Y?" Use:

- `npm run seo -- ga pages --days 90` — views, engagement rate, average
  engagement seconds per page.
- `npm run seo -- gsc pages --days 90` and `gsc queries --page <url>` —
  what each page ranks for, impressions vs clicks (CTR gaps at good
  positions usually mean a weak title/meta).
- Read the top and bottom pages and name the concrete differences —
  topic, intent match, answer-first structure, freshness — then turn the
  pattern into guidance: feed it back as a note James can give the
  `blog-research` skill (topic selection) or apply to underperformers.

### 5. Australian traffic

The `.au` domain already geotargets Australia; hreflang is unnecessary for
a single-locale site. The levers that remain:

- `npm run seo -- ga geo` — AU share of traffic (track it over time; it's
  the KPI for this goal).
- `npm run seo -- gsc queries --country AUS` — find striking-distance AU
  queries (position 4–15, high impressions) and strengthen those pages:
  answer the query explicitly in an H2, add AU-specific detail.
- AU relevance in content: Australian English (the audit lints US
  spellings), AUD pricing, Australian regulations/examples/institutions,
  and "…in Australia"-modifier questions as H2s where genuine.
- Report — but don't fabricate — off-site gaps: AU media mentions,
  podcasts, and communities are the biggest lever we can't automate.

### 6. GA management

James has given standing approval for **additive** GA4 configuration that
improves insight, e.g.:

- Register key events (`ga admin POST /{property}/keyEvents`) — e.g.
  `contact_click` — so engagement means something business-real.
- Custom dimensions for content analysis (e.g. an event-scoped `pillar`
  dimension if the site starts sending it).
- `ga admin GET` anything, any time, for diagnosis.

Use `npm run seo -- ga admin <METHOD> <path> [--json <body>]` —
`{property}` in the path is substituted automatically. Check the
cheatsheet for paths and limits. Anything destructive: ask first (see
Non-negotiables).

## Reports

Every review/audit run writes `docs/seo/YYYY-MM-DD-<mode>.md` (create the
directory if missing): the numbers pulled, findings, actions taken, and
actions recommended. The next run reads the latest report for trend
comparison — without it, "traffic is up" has no baseline. Keep reports
factual and diff-friendly; they're committed with any fixes.

## Setup

Auth is a service account in the personal `jamesevans-au-seo` GCP project —
kept deliberately separate from Audify, Kairos, and anything work-related.
Full details and the reason gcloud ADC can't be used are in
`reference/api-cheatsheet.md` ("Auth model").

`npm run seo -- auth` is the single source of truth on what works. Built and
verified 25 Jul 2026: the service account authenticates, GA Admin returns
ok, and `psi` runs on our own quota. **Two steps remain that only James can
do**, because GCP IAM does not grant access to these products:

1. **GA4** → Admin → Property access management → add
   `seo-agent@jamesevans-au-seo.iam.gserviceaccount.com` as Editor
   (Viewer works for read-only; Editor enables the GA management mode).
2. **Search Console** → confirm a property for jamesevans.au exists, then
   Settings → Users and permissions → add the same email as **Full** user
   (Full is required for URL Inspection).

Until then, GA data and GSC commands fail with a clear 403 naming the fix;
`audit` and `psi` work regardless, since neither needs those grants.

## Cost control

- `snapshot` is one command — prefer it over four separate pulls.
- GA/GSC quotas are far beyond this site's needs; the real cost is your
  context. Pull only the windows you'll actually compare (28d default,
  90d for content analysis).
- URL Inspection is 2,000/day — inspect suspect pages, not the whole site.
- A full weekly review should need roughly 6–10 CLI calls plus the audit.
