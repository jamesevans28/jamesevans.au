---
name: blog-research
description: Research what to write about on the jamesevans.au blog — trending AI topics, what people are searching for, what's being discussed on social/media, common problems, and newly launched tools. Produces a scored topic shortlist and a research brief that the blog-post skill turns into an article. Use when James asks what to write about, wants topic ideas, asks what's trending in AI, or wants a post researched before it's drafted.
---

# Finding something worth writing about

The blog is **"AI, in plain English."** — practical AI writing for everyday people
and small businesses (full audience and voice spec in the `blog-post` skill).
This skill decides *what* to write; `blog-post` decides *how* to write it.

**Output:** a scored brief queued in DynamoDB via `npm run blog -- brief add`.
The CLI scores it, dedupes it, and tells you what happens next. `blog-post`
later reads the queue and writes from the highest-scoring brief.

This skill runs **unattended on a schedule (every ~12 hours)** as well as
interactively, so it must never block waiting for input — see "Unattended runs"
below.

## Non-negotiables

- **Every factual claim in the brief carries a source URL.** If it has no URL, it
  does not go in the brief. `blog-post` is forbidden from inventing statistics,
  so anything unsourced here becomes unusable there.
- **Verify contested numbers.** Adoption and usage statistics about AI
  contradict each other constantly (see "Handling conflicting data" below).
- Note the **date and geography** of every statistic. A 2024 US survey is not
  evidence about Australian small business in 2026.
- **Score honestly.** The score decides whether a post gets written and possibly
  published with nobody reviewing it. Inflating `evidence` or `ourAngle` to push
  a topic through is the one failure mode that can put a wrong claim on a live
  page under James's name. When unsure, score lower.
- **This skill never publishes.** It queues briefs and may hand off to
  `blog-post`; the publish decision belongs to the gate in the CLI (and to
  James).

## Unattended runs

When running on a schedule there is nobody to answer questions. So:

- **Never ask questions.** Infer the scope, state your assumptions in the run
  summary, and continue.
- **Always dedupe first** (step 1). A researcher running twice a day will keep
  rediscovering the same trends; queueing near-duplicates is the main way this
  becomes useless.
- **Queue at most 2 briefs per run.** Better one well-verified brief than four
  thin ones, and the queue is meant to stay readable.
- **If nothing clears the bar, queue nothing and say so.** A quiet run is a
  correct outcome — the web does not produce a great AI topic every 12 hours.
- Keep it to roughly 12–18 searches and 3–6 fetches (see "Cost control").

## Step 1 — Scope, and dedupe first

**Always start here.** One command lists every post and brief that already
exists, so you don't spend a whole run rediscovering a covered topic:

```bash
npm run blog -- brief topics
```

Treat a topic as a duplicate if it would answer substantially the same reader
question — not just if the slug matches. "Five ways to use AI in a small
business" and "AI tools every small business should try" are the same post.

Also check what's already waiting, so you don't pile up near-identical briefs:

```bash
npm run blog -- brief list
```

Scope (infer it; only ask if running interactively and it's genuinely unclear):

- **Pillar focus?** Any of `guides`, `tips`, `small-business`, `personal`,
  `trends`, `commentary` — or open.
- **Timeliness?** *Newsy* (a launch or trend from the last two weeks) or
  *evergreen* (a guide that ranks for months). Default to a mix.
  Note: **newsy briefs never auto-publish**, by design — a launch claim can be
  overtaken between research and publication.

## Step 2 — Search across all five angles

Run these in parallel. **Batch the searches in one message** — they're
independent, and serial searching wastes a lot of time.

Substitute the current month/year (check today's date; don't hardcode).

### A. Search demand — what people actually type

The highest-value signal, because it maps directly to traffic.

- `most searched AI questions small business owners <year>`
- `"how do I" AI questions beginners ask most`
- `AI questions people google most <month> <year>`
- `<topic> search volume keyword` — when you have a specific candidate

Look for: literal question phrasings, and any keyword volume figures. Capture
the exact wording people use — that phrasing belongs in the article's H2s.

### B. New tools and launches — what's changed recently

- `new AI tools launched <month> <year>`
- `AI features released <month> <year> everyday users`
- `<major vendor> new release <month> <year>` (OpenAI, Anthropic, Google,
  Microsoft Copilot, Notion, Canva)

Look for: things a non-technical reader could actually use this week, with a
price and availability. Ignore research previews, benchmarks, enterprise-only
launches, and anything requiring an API key.

### C. Problems and frustrations — where the pain is

The richest source of genuinely useful articles.

- `small business owners frustrated AI tools problems complaints`
- `reddit AI not working for me small business`
- `why did AI fail <use case>`
- `AI mistakes people make <use case>`

Look for: specific, concrete failures ("misread acronyms in a supplier
contract"), and barrier statistics (cost, trust, data security, complexity).
A named, specific problem is worth more than a general anxiety.

### D. Trending discussion — what's being talked about

- `AI trending discussion hacker news product hunt <month> <year>`
- `AI news <month> <year> biggest stories`
- `AI debate controversy <month> <year>`

Weak sources, be aware: **Google Trends RSS**
(`https://trends.google.com/trending/rss?geo=AU`) is free and fetchable, but is
dominated by general news — AI rarely appears. Check it at most once and don't
build a run around it. Reddit and X are not directly searchable here; reach them
via `reddit <topic>` web searches or discussion round-up articles instead.

### E. Australian angle — the differentiator

James is Melbourne-based and most AI coverage is US-centric, so this is a real
competitive edge and it barely costs anything.

- `Australian small business AI adoption <year>`
- `AI privacy law Australia <year>` / `AI regulation Australia small business`
- `ATO AI tax deduction software Australia` (and similar local specifics)

## Step 3 — Verify before you trust

For any statistic that will appear in the brief:

1. **Follow it to the source.** `WebFetch` the page and find who ran the study,
   when, sample size, and which country. Round-up blogs routinely misquote.
2. **Prefer primary sources** — the actual survey, vendor changelog, or
   regulator page — over a listicle summarising it.
3. **Discard anything you cannot attribute.** A number with no traceable origin
   is worse than no number.

### Handling conflicting data

Contradictions are common and expected. Observed in a real run: one source
reported *74% of SMBs using or testing AI*, another reported adoption *declining
to 28%* — same period, same market. Different questions, populations, and
definitions.

When sources conflict:

- Record **both**, each with its source, date, and what was actually measured.
- Explain the likely reason in the brief (usually "using" vs "using regularly",
  or SMB vs micro-business).
- Flag it as `CONFLICTING` so `blog-post` either attributes both or avoids the
  claim. **Never silently pick the more dramatic figure.**

## Step 4 — Score the candidates

Build 5–8 candidates, then score each criterion **1–5** (total out of 30). The
score is not decorative — it decides what happens automatically:

| Total | What happens |
|---|---|
| < 22 | Queued for later; `blog-post` may pick it up on its own schedule |
| 22–25 | A post is **written now** as a draft, then stops for review |
| 26–30 | Written now **and published live without review** — but only if the evidence gate passes |

### The criteria

| Criterion | What a 5 looks like | What a 1–2 looks like |
|---|---|---|
| `searchDemand` | People are visibly searching this, with volume figures to show it | No evidence anyone searches it |
| `audienceFit` | Squarely everyday-person / small-business, non-technical | Needs developer knowledge **(vetoes)** |
| `engagement` | A real problem or genuine surprise | A rehash of what everyone published last month |
| `ourAngle` | James can say what others don't — practical detail, Australian context, an honest "this doesn't work" | Nothing to add beyond summarising others **(vetoes)** |
| `durability` | Still useful in six months | Stale in a fortnight (fine for `newsy`, score it honestly) |
| `evidence` | Multiple primary sources, no contradictions, nothing unverified | Thin or unverifiable **(vetoes)** |

**A 1–2 on `audienceFit`, `ourAngle`, or `evidence` discards the topic outright**,
whatever the total. The CLI enforces this — a popular topic we can't source or
say anything distinctive about is not worth writing.

### The evidence gate (why a 30/30 might still not publish)

Scoring 26+ is necessary but not sufficient for auto-publishing. The CLI also
requires:

- **No fact marked `conflicting`** — a human decides how to frame contested data.
- **Every fact traced to a primary source** (`primarySource: true`).
- **`evidence` scored exactly 5.**
- **`timeliness` is `evergreen`**, not `newsy`.

Any one of those failing downgrades the action to "write a draft, then stop for
review". This is deliberate: the real risk of unattended publishing isn't clumsy
prose, it's a misattributed statistic going public. Don't try to work around it
by marking a fact `primarySource: true` when you only saw it in a round-up blog.

### Reporting

Interactively: present a compact shortlist table, recommend one, and let James
choose. Unattended: pick the best 1–2 yourself and queue them.

## Step 5 — Write the brief markdown

A **worked example built from real searches** lives at
`reference/example-brief.md` (in this skill's directory) — read it to see the
expected level of detail, and especially how conflicting evidence and failed
verifications are recorded.

Use this exact structure — `blog-post` expects these headings. (This markdown
becomes the `markdown` field of the JSON in step 6; no frontmatter needed, since
the metadata travels as JSON fields.)

```markdown
## Why this topic

Two or three sentences: the reader problem, and why now.

## Search demand

- Exact phrasings people search, with volume where known — each with a source URL.
- The question the article must answer in its first 100 words.

## Reader pain points

- Specific, concrete problems, each with a source URL.
- What readers have already tried that didn't work.

## What to cover

- Suggested H2 outline, using the reader's own vocabulary.
- The single most useful thing this article can give them.

## Verified facts and figures

| Claim | Number | Source (URL) | Date | Geography |
|---|---|---|---|---|

Mark any contested claim `CONFLICTING` and give both figures with both sources.

## Tools and products to mention

- Name, what it does in one line, price/availability, source URL.
- Only things a non-technical reader can use today.

## Australian angle

- Local statistics, regulation, or context — with sources. Omit the section if
  there genuinely isn't one; don't pad it.

## Existing coverage and our differentiator

- 2–3 strong articles already ranking, and what they miss.
- The specific gap this post fills.

## Internal links

- Which of /services/, /work/, /about/ genuinely fits, and where.

## Do not claim

- Statements the evidence does NOT support, so the draft avoids them.
- Any figure that failed verification, and why.

## Sources

- Every URL used, as a flat list.
```

## Step 6 — Queue the brief

Build the JSON below and pipe it to the CLI. It validates the brief, rejects
duplicates, scores it, saves it, and tells you what to do next.

```bash
cat <<'JSON' | npm run --silent blog -- brief add
{
  "briefId": "ai-emails-that-dont-sound-like-ai",
  "topic": "Getting AI to write emails that don't sound like AI",
  "pillar": "guides",
  "suggestedTitle": "How to Stop Your AI Emails Sounding Like a Robot",
  "suggestedSlug": "ai-emails-that-dont-sound-like-ai",
  "timeliness": "evergreen",
  "scores": {
    "searchDemand": 5, "audienceFit": 5, "engagement": 4,
    "ourAngle": 4, "durability": 5, "evidence": 4
  },
  "markdown": "## Why this topic\n\n...the full brief from step 5...",
  "facts": [
    {
      "claim": "Australian SME AI adoption",
      "value": "43%",
      "sourceUrl": "https://www.ai.gov.au/news-and-insights/blog/...",
      "sourceDate": "Feb 2026",
      "geography": "AU",
      "conflicting": false,
      "primarySource": true
    }
  ],
  "doNotClaim": [
    "Do not present the 74% figure as Australian — it is US-only"
  ],
  "sources": ["https://www.ai.gov.au/...", "https://..."],
  "researchedAt": "2026-07-25T09:00:00.000Z"
}
JSON
```

Field notes:

- `facts` — one entry per statistic. `primarySource` is `true` only when you
  fetched the study/vendor/regulator page itself, not a blog quoting it.
  `conflicting` is `true` when sources disagree.
- `doNotClaim` — every statement that failed verification. `blog-post` treats
  this as binding.
- `markdown` — the full brief from step 5 (escape newlines as `\n` in JSON, or
  write the JSON to a temp file and pipe that file in, which is easier).

### Act on the exit code

| Exit | Meaning | What you do |
|---|---|---|
| `0` | Queued, below the write threshold | Nothing. Report it and finish. |
| `10` | **Write the post now**, then stop | Hand off to `blog-post` for this brief. It drafts and stops for review. |
| `11` | **Write and publish now** (gate passed) | Hand off to `blog-post`, which drafts, verifies, and publishes. |
| `12` | Discarded (vetoed) | Nothing was saved. Report why and move on. |
| `1` | Validation or duplicate error | Fix and retry, or drop the topic. |

On `10` or `11`, invoke the `blog-post` skill with that `briefId` in the same
run — that's the whole point of the immediate path. On `11`, tell `blog-post`
explicitly that the auto-publish gate passed.

### Run summary

Finish every run — including quiet ones — with a short summary: what you
searched, what you queued with scores, what you discarded and why, and any
handoff you triggered. This is the only record James has of an unattended run.

## Cost control

A full five-angle run is roughly 12–18 searches plus 3–6 fetches. Keep it
tighter when the ask is narrow:

- "What should I write about?" → all five angles, full shortlist.
- "Research <specific topic>" → skip scoring; go straight to verification and
  the brief for that topic.
- "What's new in AI this week?" → angles B and D only.

Batch every independent search into one message. Don't re-search something
already answered in this session.
