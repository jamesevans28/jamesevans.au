---
name: blog-post
description: Write, review, and publish a blog post for jamesevans.au. Use when James asks for a new article, a draft on a topic, an edit to an existing post, or wants something published to the blog.
---

# Writing a blog post for jamesevans.au

The blog is **"AI, in plain English."** Practical writing about AI in everyday
life, for everyday people and small businesses. Posts are stored in DynamoDB and
prerendered as static HTML at deploy time.

## Never publish without explicit approval

Publishing puts content on a public site under James's name. Always:

1. Write and push as a **draft**.
2. Show James the draft (summarise it, and offer the preview URL).
3. Publish **only** after he says to.

Never run `publish` on your own initiative, even if the request sounded like
"write and publish something about X" — draft it, then confirm.

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

## Workflow

```bash
# 1. Scaffold
npm run blog -- draft how-to-use-ai-to-write-better-emails

# 2. Write the post in content-drafts/<slug>.md, then check it
npm run blog -- lint how-to-use-ai-to-write-better-emails

# 3. Save to DynamoDB as a draft
npm run blog -- push how-to-use-ai-to-write-better-emails

# 4. Preview locally and review the rendered page yourself
npm run dev     # then open http://localhost:3000/blog/<slug>/

# 5. ONLY after James approves
npm run blog -- publish how-to-use-ai-to-write-better-emails
```

Before showing James a draft, read the rendered page and check: the title and
description read well as a search result, headings scan sensibly, no section is a
wall of text, links work, and the reading time looks right for the depth.

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

- Plan and decisions: `docs/BLOG_PLAN.md`
- Validation rules: `src/lib/blog-schema.ts`
- Static copy (blog intro, tag labels): `src/content/blog.ts`
