---
name: blog-post
description: Write, review, and publish a blog post for jamesevans.au. Use when James asks for a new article, a draft on a topic, an edit to an existing post, or wants something published to the blog.
---

# Writing a blog post for jamesevans.au

The blog is **"AI, in plain English."** Practical writing about AI in everyday
life, for everyday people and small businesses. Posts are stored in DynamoDB and
prerendered as static HTML at deploy time.

## When you may publish

Publishing puts content on a public site under James's name. The default is
always: **draft, show him, wait.**

1. Write and push as a **draft**.
2. Show James the draft (summarise it, and offer the preview URL).
3. Publish **only** after he says to.

Never run `publish` on your own initiative when a human is in the loop, even if
the request sounded like "write and publish something about X" — draft it, then
confirm.

### The one exception: an auto-publish brief

James has approved unattended publishing for briefs that clear a high bar. You
may publish without asking **only** when all of these hold:

- The work came from a queued brief, and
- `npm run blog -- brief next` (or `brief add`) reported the action
  **`write-and-publish`** — equivalently `brief add` exited `11`, and
- `npm run blog -- lint` passes with **no** problems, and
- Every statistic you used came from the brief's `facts`, with its attribution,
  and none is marked `conflicting`, and
- You made no claim listed in the brief's `doNotClaim`.

If **any** of those fails — including "the draft ended up needing a figure the
brief didn't have" — push the draft and stop for review. Downgrading to a draft
is always the safe choice and never the wrong one. Say clearly in your summary
which path you took and why.

Do not re-score a brief or re-derive the gate yourself. The CLI owns that
decision; you only act on what it reported.

## Audience and voice

The reader is a smart, non-technical adult: a small-business owner, a
professional curious about AI, someone who has tried a chatbot and wants to get
more out of it. They are **not** engineers.

- **Plain English.** No jargon. If a technical term is unavoidable, define it in
  the sentence where it first appears.
- **Concrete over abstract.** Real examples with real wording — an actual prompt,
  an actual scenario — not "one could leverage AI for correspondence".
- **Honest.** Say what AI is bad at as readily as what it's good at. No hype, no
  breathless futurism, no "game-changer".
- **Opinionated where it's commentary.** For trend and commentary pieces, take a
  position and defend it. Hedging everything is boring and ranks badly.
- **Australian English.** "organise", "recognise", "centre". Dates as
  "20 July 2026".
- **Second person.** Address the reader as "you". James writes as "I".

### Do not write like an AI

This is a blog about AI, published under a real person's name. Prose that reads
as machine-written undermines it more than a dull sentence would. James has
called this out on a live post, so treat it as a hard requirement.

**Never use:**

- **Em dashes or en dashes** (— –). Use a comma, a full stop, brackets, or a
  colon. A rewrite that cut 12 em dashes from a 1,100-word post is what
  prompted this rule.
- **The "not X, it's Y" flip** as a rhetorical device: *"The problem isn't the
  cost. It's the culture."* Once in a piece is a coincidence; three times is a
  signature. Just say the thing.
- **Rule-of-three everywhere.** Triads in lists, in sentence rhythm, in section
  counts. Real writing has twos and fives and sevens in it.
- **Parallel bolded run-ins** — four sections that each open with a bolded
  two-word phrase and run the same length. That symmetry is the loudest tell.
- These words and phrases: delve, moreover, furthermore, landscape, realm,
  leverage (as a verb), robust, seamless, game-changer, unlock, harness,
  tapestry, testament, "navigate the", "it's worth noting", "in today's
  fast-paced", "dive into", "let's explore".
- A "## The short version" / "## Key takeaways" section that restates the
  article. Land the ending in the last real section instead.

**Do instead:**

- **Let the structure be uneven.** Sections of genuinely different lengths. One
  section can be three sentences; another can run six paragraphs. Not every
  section needs the same internal shape.
- **Vary paragraph length hard.** A ten-word paragraph next to a sixty-word one.
  Check the spread before you ship: if every paragraph is 35–45 words, rewrite.
- **Start some sentences with And, But, So.** Use contractions everywhere.
- **Allow a sentence fragment** where it lands better than a full clause.
- **Prefer the specific over the balanced.** "One example that stuck with me"
  beats "a notable instance". First-person observation beats a survey of views.
- **Let an aside sit in brackets** rather than reaching for a dash.

Before pushing, read the draft back and ask: does any of this sound like it came
out of a chatbot? Grep your own draft for `—` and for the banned words above.
- Never invent credentials, clients, case studies, statistics, or quotes. If a
  claim needs a source and you don't have one, cut the claim.

## Content pillars

Every post should fit one of these (they map to the tag taxonomy):

| Pillar | Tag | Shape |
|---|---|---|
| How everyday people can use AI | `personal` | Practical, domestic, low-stakes |
| AI for small business | `small-business` | Time/money saved, risks named |
| Tips and tricks | `tips` | Short, punchy, several ideas |
| Step-by-step how-to guides | `guides` | Numbered, follow-along, one outcome |
| Non-standard / creative uses | `personal` or `small-business` | Surprising but genuinely useful |
| Latest AI trends | `trends` | What changed, why it matters, what to do |
| Commentary on new innovations | `commentary` | A clear take, argued |

## Structure

- **Title** — max 65 characters. Lead with the reader's outcome or question.
  Match how people actually search ("How to…", "Five ways to…", "Is AI any good
  at…"). No colons-and-subtitles.
- **Description** — 140–160 characters, hard requirement. This is the SERP
  snippet: say what the reader will be able to do after reading.
- **Opening** — name the reader's problem in their words within the first two
  sentences. No "In today's fast-paced world" and no summary of what the article
  will cover.
- **Body** — start sections at `##` (the page renders the title as the only H1).
  Use `###` sparingly. 1,200–2,000 words for guides; 700–1,200 for commentary.
- **Close** — the single next action worth taking.
- **Internal links** — link to `/services/` or `/work/` once or twice where it is
  genuinely relevant, never forced. Always with a trailing slash.
- Short paragraphs (2–4 sentences). Lists where a list is genuinely clearer, not
  as a substitute for prose.

## SEO rules (enforced by `blog lint`)

- One H1 only — never write `# ` in the body.
- Every image needs alt text.
- Internal links need trailing slashes (`/services/`, not `/services`).
- Title ≤ 65 chars; description 140–160 chars.
- 1–4 tags from the fixed list: `guides`, `tips`, `small-business`, `personal`,
  `trends`, `commentary`.
- Slugs are lowercase kebab-case, short, keyword-bearing, and **immutable once
  published** (the slug is the URL).
- No keyword stuffing. Write for the reader; the structure does the SEO work.

## Starting from a research brief

Briefs are queued in DynamoDB by the `blog-research` skill. To write the next
one:

```bash
# Highest-scoring queued brief, with its action and full markdown
npm run blog -- brief next

# Or a specific one
npm run blog -- brief show <briefId>

# JSON, when you want the facts array verbatim
npm run blog -- brief next --json
```

`brief next` exits `3` when the queue is empty — report that and stop; don't
invent a topic to fill the slot.

**Claim the brief as soon as you've chosen the post slug**, before writing:

```bash
npm run blog -- brief claim <briefId> <postSlug>
```

This is conditional: if another scheduled run already claimed it, the command
fails and you should move to the next brief. Claiming first is what stops two
runs writing the same article.

Rules when working from a brief:

- **Use only the figures in the "Verified facts and figures" table**, and only
  with the attribution given. Do not add statistics from memory — if the brief
  doesn't have it, leave it out.
- Anything marked `CONFLICTING` must either cite both figures with both sources,
  or be avoided. Never pick the more dramatic number.
- **Honour the "Do not claim" section.** Those statements failed verification.
- Frame headings in the reader's own vocabulary from "Search demand".
- The brief suggests a title and slug; improve them if you can, but keep the
  title ≤ 65 characters and the slug kebab-case.

If James asks for a post on a topic with **no brief**, say a brief would make it
stronger and offer to run `blog-research` first. If he'd rather go straight to
drafting, do it — but then write only from what you can state without inventing
evidence, and keep statistics out unless you verify them as you go. A post
written without a brief is **never** eligible for auto-publishing.

## Running unattended

When invoked by a schedule rather than by James:

- Never ask questions. If something is ambiguous, take the safe path (draft, not
  publish) and note it in the summary.
- Write **one** post per run.
- Claim the brief before writing, and if the claim fails, take the next brief
  rather than pressing on.
- Always finish with a summary: which brief, which slug, draft or published, and
  anything that made you downgrade from publish to draft.

## Workflow

```bash
# 0. Take the next brief (note its action: write / write-and-publish)
npm run blog -- brief next

# 1. Claim it, then scaffold
npm run blog -- brief claim <briefId> how-to-use-ai-to-write-better-emails
npm run blog -- draft how-to-use-ai-to-write-better-emails

# 2. Write the post in content-drafts/<slug>.md, then check it
npm run blog -- lint how-to-use-ai-to-write-better-emails

# 3. Save to DynamoDB as a draft
npm run blog -- push how-to-use-ai-to-write-better-emails

# 4. Review the rendered page yourself
npm run dev     # then open http://localhost:3000/blog/<slug>/

# 5a. Normal path: stop here and show James the draft.
# 5b. Auto-publish path ONLY (brief action was write-and-publish, lint clean,
#     every figure sourced from the brief):
npm run blog -- publish how-to-use-ai-to-write-better-emails
```

Before showing James a draft, read the rendered page and check: the title and
description read well as a search result, headings scan sensibly, no section is a
wall of text, links work, and the reading time looks right for the depth.

Then run the AI-prose check from "Do not write like an AI" over your own draft:

```bash
# Should return nothing
grep -nE "—|–|delve|moreover|furthermore|leverage|seamless|robust|tapestry|it's worth noting|dive into" content-drafts/<slug>.md
```

Also eyeball the paragraph-length spread and the section shapes. Uniformity is
the giveaway, and it does not show up in a grep.

Publishing triggers a GitHub Actions deploy; the post is live at
`https://jamesevans.au/blog/<slug>/` a couple of minutes later.

## Editing an existing post

```bash
npm run blog -- pull <slug>     # fetch current version into content-drafts/
# edit, then:
npm run blog -- push <slug>     # a published post stays published, and redeploys
```

Never change the `slug` of a published post — it would orphan the indexed URL.
Rewrite the content under the same slug instead.

## Reference

- Topic research and briefs: the `blog-research` skill
- Plan and decisions: `docs/BLOG_PLAN.md`
- Validation rules: `src/lib/blog-schema.ts`
- Static copy (blog intro, tag labels): `src/content/blog.ts`
