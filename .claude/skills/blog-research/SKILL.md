---
name: blog-research
description: Research what to write about on the jamesevans.au blog — trending AI topics, what people are searching for, what's being discussed on social/media, common problems, and newly launched tools. Produces a scored topic shortlist and a research brief that the blog-post skill turns into an article. Use when James asks what to write about, wants topic ideas, asks what's trending in AI, or wants a post researched before it's drafted.
---

# Finding something worth writing about

The blog is **"AI, in plain English."** — practical AI writing for everyday people
and small businesses (full audience and voice spec in the `blog-post` skill).
This skill decides *what* to write; `blog-post` decides *how* to write it.

**Output:** a research brief at `content-drafts/research/<date>-<slug>.md`, plus a
shortlist shown to James. The brief is the handoff — `blog-post` reads it and
writes from it. Never draft the article in this skill.

## Non-negotiables

- **Every factual claim in the brief carries a source URL.** If it has no URL, it
  does not go in the brief. `blog-post` is forbidden from inventing statistics,
  so anything unsourced here becomes unusable there.
- **Never publish anything.** This skill only reads the web and writes local
  files. Topic selection and drafting both need James's input.
- **Verify contested numbers.** Adoption and usage statistics about AI
  contradict each other constantly (see "Handling conflicting data" below).
- Note the **date and geography** of every statistic. A 2024 US survey is not
  evidence about Australian small business in 2026.

## Step 1 — Scope the run

Ask James only if it's ambiguous; otherwise infer and say what you assumed:

- **Pillar focus?** Any of `guides`, `tips`, `small-business`, `personal`,
  `trends`, `commentary` — or open.
- **Timeliness?** *Newsy* (a launch or trend from the last two weeks, publish
  this week) or *evergreen* (a guide that ranks for months). Default: mix both in
  the shortlist and let him choose.

Then check what already exists so you don't propose a duplicate:

```bash
npm run blog -- list
```

Also skim `content-drafts/research/` for briefs from previous runs — a topic
already researched and rejected shouldn't come back without a reason.

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

Build 5–8 candidates, then score each 1–5 on:

| Criterion | What a 5 looks like |
|---|---|
| **Search demand** | People are visibly searching this, in volume |
| **Audience fit** | Squarely everyday-person / small-business, non-technical |
| **Engagement** | A real problem or a genuine surprise, not a rehash |
| **Our angle** | James can say something most coverage doesn't — practical detail, Australian context, or an honest "this doesn't work" |
| **Durability** | Still useful in six months (down-weight if newsy is wanted) |
| **Evidence** | Enough verified, sourced material to write it without inventing anything |

Drop anything scoring 1–2 on **Audience fit**, **Our angle**, or **Evidence** —
regardless of total. A high-traffic topic we have nothing distinctive to say
about is a bad post, and one we can't source is unwritable.

Present the shortlist as a compact table (topic, pillar, total score, one-line
angle, newsy/evergreen), recommend one, and say why. Then **stop and let James
choose** — don't write the brief for all of them.

## Step 5 — Write the brief for the chosen topic

Write to `content-drafts/research/<YYYY-MM-DD>-<slug>.md`. This directory is
gitignored (it sits under `content-drafts/`), so briefs stay local.

A **worked example built from real searches** lives at
`reference/example-brief.md` (in this skill's directory) — read it to see the
expected level of detail, and especially how conflicting evidence and failed
verifications are recorded.

Use this exact structure — `blog-post` expects these headings:

```markdown
---
researched: 2026-07-25
topic: Getting AI to write emails that don't sound like AI
pillar: guides
suggested_slug: ai-emails-that-dont-sound-like-ai
suggested_title: How to Stop Your AI Emails Sounding Like a Robot
timeliness: evergreen
confidence: high
---

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

## Step 6 — Hand off

Tell James the brief is ready and give him the exact next step:

```
Brief: content-drafts/research/2026-07-25-ai-emails-that-dont-sound-like-ai.md

To draft it:  use the blog-post skill with that brief
```

`blog-post` then does the writing, and still requires James's explicit approval
before anything is published.

## Cost control

A full five-angle run is roughly 12–18 searches plus 3–6 fetches. Keep it
tighter when the ask is narrow:

- "What should I write about?" → all five angles, full shortlist.
- "Research <specific topic>" → skip scoring; go straight to verification and
  the brief for that topic.
- "What's new in AI this week?" → angles B and D only.

Batch every independent search into one message. Don't re-search something
already answered in this session.
