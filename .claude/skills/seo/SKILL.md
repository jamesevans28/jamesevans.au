---
name: seo
description: Monitor and improve search performance for jamesevans.au — Google Analytics 4, Search Console, and Bing Webmaster monitoring, page/post engagement trends, technical on-page audits (titles, metas, headings, canonicals, internal linking, Core Web Vitals, crawlability), GEO audits (how citable the content is for AI systems like Claude, ChatGPT, and Perplexity), getting new posts indexed, and growing Australian organic traffic. Use when James asks about SEO, traffic, rankings, analytics, search performance, indexing, why a page isn't ranking or being found, AI-search visibility, or wants an audit or weekly review.
---

# SEO for jamesevans.au

The goal is compounding organic growth for a personal site with a blog
("AI, in plain English"), with **Australia as the priority market**. This
skill has four jobs: **watch** (GA4, Search Console, Bing), **diagnose**
(technical and GEO audits), **act** (fixes committed to the repo, indexing
pushes), and **escalate** (GitHub issues for anything functional).

**Data comes from the CLI, never from memory.** Everything flows through
`npm run seo -- <command>` — GA4, Search Console, PageSpeed, Bing, IndexNow,
and the static audit (see `scripts/seo/index.ts` header for the full command
list). Never invent or extrapolate a metric; if a number isn't in CLI output,
say so. When a command fails it prints specific remediation — relay that
rather than guessing at causes or reconstructing setup from scratch.

Reference material in this skill's directory:

- `reference/growth-levers.md` — **read this when deciding what to do.** What
  actually drives visitors, ranked by leverage, plus what to stop wasting
  runs on and how to diagnose which stage the site is at
- `reference/geo-audit.md` — the GEO rubric (run it per page, in full)
- `reference/api-cheatsheet.md` — GA4 dimensions/metrics, GSC details,
  Bing and IndexNow specifics, Admin API paths, quotas, auth model, and all
  numeric thresholds

## The mandate

James's instruction (25 Jul 2026): **act as an SEO expert whose job is to
drive visitors to the site, and grow them day on day.** He expects the agent
to be taking care of traffic and engagement without being asked, and to
speak up when it needs something.

So the weekly run is not a report-writing exercise. It is: find the largest
current constraint on traffic, fix what you're allowed to fix, and escalate
what you aren't. A run that produces a tidy report and changes nothing is a
failed run — unless the honest finding is that the site is healthy and the
constraint is simply time (early on, it often is; say so plainly).

### What you may change on your own authority

**SEO behaviour, non-functional** — commit straight to main:

- Titles, meta descriptions, OG/Twitter metadata, canonical correctness.
- Heading structure and hierarchy fixes.
- Internal links and anchor text; adding links between existing pages.
- Structured data (JSON-LD) additions and corrections.
- Image alt text; `sitemap.xml` and `robots.txt` corrections.
- Copy edits that improve answer-first structure or AU relevance, within
  the `blog-post` voice rules.
- Sitemap and IndexNow submissions; additive GA4 config (see the GA
  management mode).

**Functional changes — do NOT make them. Open a GitHub issue instead**
(see below): anything touching components, routing, build config,
dependencies, layout, or behaviour. If a fix needs new UI, a new page
template, a config change, or a dependency, it is functional — even when
the motivation is purely SEO.

Grey areas resolve toward the issue. A canonical tag correction is
behavioural if it changes which URL resolves; a title change never is.

### Raising GitHub issues

Repo `jamesevans28/jamesevans.au`, via `gh issue create`. One issue per
problem, and include enough that James can decide without re-deriving it:

- **What** the change is, concretely.
- **Why it drives traffic** — the mechanism, not a vague appeal to "SEO".
- **The evidence**: the CLI output, metric, or audit finding behind it,
  with numbers.
- **Expected impact** and how you'd measure it, honestly — including when
  the effect is likely small or unmeasurable at current traffic.
- **What you'd do** if approved, and the risk.

Label `enhancement` (or `bug` for something broken). Check open issues
first — never file a duplicate; comment on the existing one instead.

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
- **Fixes land as code, not opinions.** A finding worth reporting is worth a
  diff or an issue — never a note that quietly recurs every week. Which of
  the two is decided by the authority split in The mandate above.
  **Never change a published post's URL**, whatever the SEO argument: it
  breaks inbound links and loses the ranking history the URL has accrued.
- **Honest severity.** The audit is only useful if a quiet report means
  the site is genuinely healthy. Don't pad reports with non-issues to look
  thorough; "no action needed" is a valid conclusion.
- **Respect small numbers.** The site is new and low-traffic (19 users in
  the 28 days to 25 Jul 2026). Below roughly 100 users per page per window,
  differences between pages are noise: report them as observations to
  revisit, never as conclusions, and never rewrite a page because 3 users
  behaved differently from 4. Distinguish _no data yet_ (expected, say so
  plainly) from _a real problem_ — an empty Search Console report on a new
  property is the former; a page Google has never crawled is the latter.

## Modes

Pick the mode from what James asked; run "weekly review" when scheduled or
when the ask is general ("how's the site doing?").

### 1. Weekly growth run (default / scheduled)

The main event, and the one that runs unattended every week. **Never ask
questions mid-run** — infer, state assumptions, act, and put anything that
genuinely needs James in the report or a GitHub issue.

**Step 1 — Measure, and compare.** Read the latest `docs/seo/` report first
so you have a baseline; without it "traffic is up" is meaningless.

```bash
npm run seo -- snapshot --days 28
npm run seo -- ga trends --days 28
npm run seo -- ga geo --days 28
npm run seo -- gsc queries --days 28 --country AUS
```

**Step 2 — Check discovery.** The failure mode that silently costs the most,
because every other signal can look fine while it's happening.

```bash
npm run seo -- gsc sitemaps
npm run seo -- gsc inspect <each URL published since the last run>
npm run seo -- bing traffic
```

If a page is unknown to Google or uncrawled by Bing more than ~a week after
the sitemap listed it, that is the week's priority — investigate the cause,
don't just resubmit. Push anything new to IndexNow.

**Step 3 — Audit the build.** `npm run build && npm run seo -- audit`.
Regressions here are cheap to fix and compound, so fix them now.

**Step 4 — Diagnose the constraint.** Name the single biggest thing limiting
traffic this week, and say why. Typical progression for a new site:
not indexed → indexed but no impressions (no rankings) → impressions but no
clicks (title/meta/CTR) → clicks but no engagement (content) → growth.
Work the current stage; don't optimise CTR on a page with no impressions.

**Step 5 — Act.** Fix everything in your authority (see The mandate above),
commit, and merge. Open GitHub issues for functional changes. Then verify
what you changed actually deployed.

**Step 6 — Feed the content engine.** The biggest lever on traffic for a site
this small is _more posts on things people actually search_ — which belongs to
`blog-research` and `blog-post`, not here. This skill's contribution is real
query data instead of guessed topics. From `gsc queries`, extract: queries
where we get impressions but rank poorly (nearly relevant — a dedicated post
would likely rank), query themes with no matching page (content gaps), and
exact phrasings for H2s. Put these in the report as a handoff note.

**Step 7 — Report.** Write `docs/seo/YYYY-MM-DD-weekly.md` covering: the
numbers vs last week, the constraint you identified, **what you changed**,
what you filed as issues, the content handoff from step 6, and what you'll
watch next week. Commit it with the fixes.

**Step 8 — Escalate, if needed.** If you are blocked on something only James
can do, or you need a decision, lead the run summary with it. Don't bury it.

Two calibration notes. While traffic is small, weight indexing and technical
findings above analytics — they are what's actually actionable, and per-page
engagement differences are noise (see Respect small numbers). And organic
growth is not linear: a flat week is not a failure, but three flat weeks with
no changes shipped is.

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

### 6. Getting new posts discovered

Publishing doesn't mean being found. Two separate paths, because no single
mechanism covers both:

- **Google** — sitemap.xml plus Search Console. There is no push API for us
  (the Indexing API is scoped to job postings and broadcast events only), so
  discovery is: make sure the sitemap lists the post, then verify with
  `gsc inspect <url>` on the next run.
- **Everyone else** — `npm run seo -- indexnow <url>` pushes to Bing,
  Yandex, Seznam, Naver, Yep, Internet Archive, and Amazon in one call.
  **Google does not support IndexNow**; never claim otherwise in a report.
  This still matters because ChatGPT's search leans on Bing's index, so
  fast Bing coverage is a GEO lever.

Bing has its own reporting, worth checking alongside Search Console:
`bing traffic` (daily series), `bing queries` (**weekly refresh** — never
compute daily deltas from it), `bing pages`, `bing crawl`,
`bing inspect <url>`, `bing quota`. Verified working 25 Jul 2026; reports
were empty because the site had just been verified, and Bing needs up to 48h.
A `null` crawl date means never crawled, not an error.

Run `indexnow` for a URL after `blog-post` publishes it. Submit only what
actually changed — Bing's guidance is not to backfill an archive, and bulk
dumps risk 429s. `--all` exists for the one-off adoption ping, not routine use.

**A 202 response does not mean success.** IndexNow validates the key file
asynchronously, so it returns 202 even when the key is missing (observed
25 Jul 2026 against a 404ing key). The CLI therefore checks the key file is
live before submitting and refuses otherwise — if it refuses, the fix is to
deploy `public/<key>.txt`, not to retry.

### 7. GA management

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

`npm run seo -- auth` is the single source of truth on what works. **Fully
set up and verified end to end on 25 Jul 2026** — all three Google surfaces
return ok, and every credential is in place:

| Surface          | Credential                   | Access                                 |
| ---------------- | ---------------------------- | -------------------------------------- |
| GA4 Data + Admin | service account              | Editor on the property                 |
| Search Console   | same service account         | Full user on `sc-domain:jamesevans.au` |
| PageSpeed        | API key, `psi-api-key.txt`   | restricted to pagespeedonline          |
| Bing Webmaster   | API key, `bing-api-key.txt`  | site verified, quota 100/day           |
| IndexNow         | public key file in `public/` | fans out to 7 engines                  |

All credentials live in `~/.config/jamesevans-au-seo/` at mode 600, outside
the repo. Nothing further is needed from James for routine runs.

If a credential ever breaks, each command prints the specific remediation
rather than failing vaguely — follow that, and don't re-derive setup from
scratch. Note that regenerating the Bing key in its UI invalidates the old
one (there is one key per user, not per site).

## Cost control

- `snapshot` is one command — prefer it over four separate pulls.
- GA/GSC quotas are far beyond this site's needs; the real cost is your
  context. Pull only the windows you'll actually compare (28d default,
  90d for content analysis).
- URL Inspection is 2,000/day — inspect suspect pages, not the whole site.
- A full weekly review should need roughly 6–10 CLI calls plus the audit.
