# Growth levers — how visitors actually arrive

The mandate is more visitors, growing day on day. This file is the honest
menu of what moves that number, roughly in order of leverage for a new,
low-traffic personal site, plus what to stop wasting runs on.

The single most important framing: **for a site with almost no traffic, the
constraint is almost never on-page optimisation.** Perfecting a title tag on
a page with zero impressions changes nothing. Diagnose which stage you're at
before choosing a lever:

| Stage                   | Symptom                               | The lever that matters                       |
| ----------------------- | ------------------------------------- | -------------------------------------------- |
| Not indexed             | GSC "URL is unknown to Google"        | Discovery: sitemap, IndexNow, internal links |
| Indexed, no impressions | Indexed but 0 impressions             | Content that targets real queries            |
| Impressions, no clicks  | Impressions, ~0 clicks, position >20  | Ranking depth: relevance, authority          |
| Ranking 4–15, low CTR   | Good position, poor CTR               | Title and meta rewrite                       |
| Clicks, no engagement   | Clicks, high bounce, low engaged time | Content quality, intent match                |

## 1. Publishing more, on things people search

For a five-page site plus one post, **content volume is the binding
constraint** and no amount of technical work substitutes. Each well-targeted
post is a new set of queries you can rank for. This is the highest-leverage
lever by a wide margin, and it belongs to `blog-research` and `blog-post`.

What this skill contributes: **feed the search data back**. Real GSC queries
beat guessed topics. Each run, extract from `gsc queries`:

- Queries where we get impressions but rank poorly — we're _nearly_ relevant;
  a dedicated post would likely rank.
- Query themes with no matching page at all — direct content gaps.
- The exact phrasings people use, which belong in H2s verbatim.

Hand these to `blog-research` as a note in the weekly report. Don't invent
topics from intuition when query data exists.

## 2. Getting found at all (discovery)

Cheap, fast, and a hard prerequisite — a page Google has never crawled earns
nothing regardless of quality:

- `sitemap.xml` submitted and current in both Search Console and Bing.
- IndexNow on every publish (`seo -- indexnow <url>`).
- Internal links from existing pages to new posts — this is how crawlers find
  things, and orphan pages may never be crawled.
- No accidental `noindex`; AI crawlers unblocked in `robots.txt`.

## 3. Striking-distance queries

Once impressions exist, the fastest wins are queries already ranking 4–15:
they need a nudge, not a new page. `gsc queries --country AUS`, filter to
position 4–15 sorted by impressions, then for each: answer that exact query
explicitly in an H2, add specific detail, and link to it internally.
Moving position 8 → 4 typically multiplies clicks several times over.

## 4. CTR rewrites

For pages ranking well but under-clicked relative to peers at the same
position, the title and meta are the problem. Cheap to fix, fast to show
up, entirely within this skill's authority. Remember Google rewrites ~61% of
titles and ~70% of descriptions, so treat this as influencing a pitch rather
than setting it.

## 5. The Australian angle

The genuine differentiator: most AI coverage is US-centric, James is
Melbourne-based, and the `.au` domain already geotargets Australia. AU-modified
queries are far less competitive than global head terms. Track AU share via
`ga geo` as the KPI. Levers: AUD pricing, Australian regulation and
institutions, "…in Australia" questions as H2s where genuine, Australian
English throughout (the audit lints US spellings).

## 6. GEO / AI citation

Increasingly how people find things, and it's this blog's own subject matter.
Full rubric in `geo-audit.md`. The headline: cite named sources, include
statistics, answer-first structure, clear entity markup. Bing coverage is a
prerequisite for ChatGPT citation.

## 7. Off-site — the honest gap

A large share of what drives both rankings and AI citations is other sites
mentioning yours, and **this skill cannot do that.** Don't pretend otherwise
and don't fabricate progress. What it _can_ do is report the gap and suggest
specific, plausible opportunities for James: Australian tech newsletters,
podcasts, communities, relevant Reddit/HN threads where the blog genuinely
answers the question, and a LinkedIn post per published article (James has an
audience there). Put these in the report as suggestions with reasoning; they
are his to action.

## What NOT to spend runs on

- **Keyword stuffing** — measurably worse than baseline for AI citation, and
  useless for Google.
- **llms.txt** — Google has confirmed it's ignored. Zero ranking effect.
- **FAQPage / HowTo schema** — HowTo is retired; FAQPage rich results are
  gov/health only since 2023.
- **Paid rank trackers** — GSC gives real first-party query data free.
- **Google Business Profile** — marginal for a personal blog with no local
  service offering. Reconsider only if James starts selling locally.
- **Micro-optimising a page with no impressions.** The commonest waste: it
  feels productive and changes nothing. Fix the stage you're actually at.
- **Chasing US head terms** — competing with well-resourced US publishers on
  their own terms is not a winnable fight at this size.
