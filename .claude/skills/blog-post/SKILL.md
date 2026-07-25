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
the request sounded like "write and publish something about X". Draft it, then
confirm.

### The one exception: an auto-publish brief

James has approved unattended publishing for briefs that clear a high bar. You
may publish without asking **only** when all of these hold:

- The work came from a queued brief, and
- `npm run blog -- brief next` (or `brief add`) reported the action
  **`write-and-publish`** (equivalently, `brief add` exited `11`), and
- `npm run blog -- lint` passes with **no** problems, and
- Every statistic you used came from the brief's `facts`, with its attribution,
  and none is marked `conflicting`, and
- You made no claim listed in the brief's `doNotClaim`.

If **any** of those fails, including "the draft ended up needing a figure the
brief didn't have", push the draft and stop for review. Downgrading to a draft
is always the safe choice and never the wrong one. Say clearly in your summary
which path you took and why.

Do not re-score a brief or re-derive the gate yourself. The CLI owns that
decision; you only act on what it reported.

## Audience and voice

The reader is a smart, non-technical adult: a small-business owner, a
professional curious about AI, someone who has tried a chatbot and wants to get
more out of it. They are **not** engineers.

Assume they are busy and mildly sceptical. They are not reading to understand
AI. They are reading because something in their week is annoying and they want
to know whether this helps.

### Tell them what to do

Most readers do not want to learn the subject. They want to be told the best way
to do the thing, by someone who has already worked it out.

- **Lead with the answer, not the background.** If the best approach is "paste
  the document in and ask for the contradictions", say that early. Explanation
  earns its place only where it changes what the reader does.
- **One clear outcome per post.** Name it in the opening: what will they be able
  to do by the end? If you cannot state it in a sentence, the post is unfocused.
- **Prescribe.** "Do this" beats "you might consider". Give the actual prompt,
  the actual setting, the actual sequence.
- **Cut the theory that does not change behaviour.** How a model works is worth
  a paragraph only if it tells the reader when to distrust the output.
- If there are five valid approaches, pick the one you would recommend and say
  why. A survey of options leaves them where they started.

### Be opinionated

This is new ground for most readers and they are drowning in vendor hype and
vague both-sides coverage. A clear opinion from someone who does this for a
living is the value.

- **Take a position and own it.** "Most AI note-takers are not worth the
  subscription" is useful. "There are pros and cons to AI note-takers" is not.
- **Say what is bad.** Naming what does not work builds more trust than any
  amount of enthusiasm, and it is what a vendor blog cannot do.
- **First person, plainly.** "I would not use it for that." "This is the one I
  actually use." James has 25 years of engineering judgement; write like it.
- Strong opinions still need honest evidence. Never invent credentials, clients,
  case studies, statistics or quotes to support a position. If a claim needs a
  source and you do not have one, cut the claim or soften it to what you can
  stand behind.
- Being opinionated is not being contrarian. Do not manufacture a hot take.

### Open with a hook

The first two sentences decide whether anyone reads the rest. No preamble, no
"in this article we will".

Things that work:

- The reader's own frustration, stated so precisely they feel caught out:
  *"Ask an AI something it doesn't know and it won't tell you that."*
- A blunt claim that makes them want to argue: *"Most people are using AI as a
  worse Google."*
- A specific moment: *"A client sent me a three-page quote last month that an AI
  had written. You could tell."*
- A cost they are already paying without noticing.

Never open with a definition, a statistic they did not ask for, or a description
of what the post covers.

### Make it relatable

The reader needs to see themselves in it. Reach for where they actually live:
their business, their job, or their personal life.

- **Anchor every abstract point to a concrete situation.** Not "AI can help with
  documentation" but "the induction checklist you have been meaning to write
  since March".
- **Use recognisable specifics:** the overdue invoice, the supplier contract
  nobody read properly, the Sunday night quote, the staff roster, the school
  form, the insurance renewal.
- **Rotate the setting.** Not every example should be a small business. Some
  readers are employees inside a bigger organisation; some are just trying to
  sort out their own admin.
- **Name the feeling, briefly.** The suspicion that you are behind. The
  irritation of retyping the same email. One clause is enough.
- Australian context where it fits naturally: the ATO, a BAS, Australia Post,
  local council. Never force it.

### Mechanics

- **Plain English.** No jargon. If a technical term is unavoidable, define it in
  the sentence where it first appears.
- **Concrete over abstract.** Real examples with real wording, an actual prompt,
  an actual scenario, not "one could leverage AI for correspondence".
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
- **Parallel bolded run-ins.** Four sections that each open with a bolded
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

**Before writing, write down the outcome in one sentence:** *"After this, the
reader will be able to ___."* If it will not fit in a sentence, the post is not
ready. Everything below serves that outcome.

- **Title.** Max 65 characters. Lead with the reader's outcome or question.
  Match how people actually search ("How to…", "Five ways to…", "Is AI any good
  at…"). No colons-and-subtitles.
- **Description.** 140 to 160 characters, hard requirement. This is the SERP
  snippet: say what the reader will be able to do after reading.
- **Opening.** A hook in the first two sentences (see "Open with a hook"), then
  the outcome. The reader should know within about fifty words both why they
  care and what they are going to get. No "In today's fast-paced world" and no
  summary of what the article covers.
- **Body.** Start sections at `##` (the page renders the title as the only H1).
  Use `###` sparingly. 1,200–2,000 words for guides; 700–1,200 for commentary.
  Put the recommendation first and the reasoning after it, not the other way
  round. Every section should either tell the reader to do something or change
  whether they trust something.
- **Close.** The single next action worth taking. Not a recap.
- **Internal links.** Link to `/services/` or `/work/` once or twice where it is
  genuinely relevant, never forced. Always with a trailing slash.
- Short paragraphs (2–4 sentences). Lists where a list is genuinely clearer, not
  as a substitute for prose.

### Self-check before pushing

Read the draft and answer these. If any answer is weak, revise.

1. Can you state the outcome in one sentence, and does the opening say it?
2. Does the first sentence make someone want the second one?
3. Where is the opinion? Point to the sentence where you actually recommend
   something. If there isn't one, the post is a survey and needs a rewrite.
4. Would a reader recognise their own week in at least two examples?
5. Is there theory in here that does not change what they do? Cut it.
6. Does it read like a chatbot wrote it? (See the checks above.)

## SEO rules (enforced by `blog lint`)

- One H1 only. Never write `# ` in the body.
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

`brief next` exits `3` when the queue is empty. Report that and stop; don't
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
  with the attribution given. Do not add statistics from memory. If the brief
  doesn't have it, leave it out.
- Anything marked `CONFLICTING` must either cite both figures with both sources,
  or be avoided. Never pick the more dramatic number.
- **Honour the "Do not claim" section.** Those statements failed verification.
- Frame headings in the reader's own vocabulary from "Search demand".
- The brief suggests a title and slug; improve them if you can, but keep the
  title ≤ 65 characters and the slug kebab-case.

If James asks for a post on a topic with **no brief**, say a brief would make it
stronger and offer to run `blog-research` first. If he'd rather go straight to
drafting, do it, but then write only from what you can state without inventing
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

Note that page furniture is guarded automatically: `src/content/prose-style.test.ts`
fails the build on an em or en dash anywhere in reader-facing copy under
`src/app`, `src/components` or `src/content`. That test exists because a dash
survived to production in the article CTA, which no post-body grep would ever
have caught. Post bodies still need the manual check below.

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

Never change the `slug` of a published post; it would orphan the indexed URL.
Rewrite the content under the same slug instead.

## Reference

- Topic research and briefs: the `blog-research` skill
- Plan and decisions: `docs/BLOG_PLAN.md`
- Validation rules: `src/lib/blog-schema.ts`
- Static copy (blog intro, tag labels): `src/content/blog.ts`
