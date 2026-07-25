# GEO audit rubric — will AI systems cite this page?

Generative Engine Optimization: making content likely to be cited, quoted,
or recommended by Claude, ChatGPT, Perplexity, and Google AI Overviews.
Evidence base: the Princeton GEO paper (Aggarwal et al., KDD 2024,
arXiv 2311.09735, benchmarked on 10k queries) plus 2025–26 practitioner
data. Context that raises the stakes: AI Overviews appear in ~39% of
Australian searches — nearly triple the global rate.

Score each page 0–2 per criterion (0 absent, 1 partial, 2 strong), report
/20, and name the two cheapest points to win.

## The rubric

### 1. Answer-first opening

The core question is answered in the first 40–60 words, in a
self-contained paragraph that makes sense with zero surrounding context.
LLMs extract passages, not pages; a ~130–170-word chunk that stands alone
is the citable unit. Burying the answer after a wind-up intro is the most
common failure.

### 2. Citations of named sources (strongest lever)

The Princeton paper's top finding: adding named, linked source citations
was the single strongest tactic (+30–40% position-adjusted visibility).
Every factual claim should carry a named source ("according to the
National AI Centre…" with a link), not a bare number. This aligns exactly
with the blog's existing every-claim-has-a-URL rule.

### 3. Statistics and quotations

Concrete statistics and direct quotes from credible sources each add
roughly +25–40% visibility. Target fact density: a specific number, date,
or named source every 150–200 words. Vague claims ("many businesses use
AI") are uncitable; "43–44% of Australian SMBs (National AI Centre, 2026)"
is citable.

### 4. E-E-A-T signals

- Named author byline with a real bio, linked to /about.
- Visible published **and** updated dates.
- First-hand experience markers: "I tested…", "at Australia Post we…" —
  genuine ones, from James's actual work.
- Outbound links to primary sources (vendor docs, regulators, studies).

### 5. Entity clarity

- Consistent naming: "James Evans" the same way everywhere; the site,
  services, and Audify named consistently.
- `Person` JSON-LD with `sameAs` (LinkedIn, GitHub), `jobTitle`,
  `knowsAbout` — the entity anchor LLMs resolve against. `BlogPosting`
  referencing the Person by `@id`.
- An /about page stating who James is, where (Melbourne, Australia), and
  why credible — in plain declarative sentences an LLM can parse.

### 6. Question-phrased headings

H2s phrased as the questions people actually ask ("Why does AI make
things up?") — they match query intent for both featured snippets and AI
retrieval. Use real search phrasings (the `blog-research` briefs capture
these).

### 7. Scannable, extractable structure

Numbered lists, tables, definition-pattern sentences ("X is …"), short
paragraphs. AI answers are assembled from fragments; content that's
already fragment-shaped wins. This is also just good writing for the
blog's audience.

### 8. Distinctive point of view

A clear opinion, original observation, or first-hand data that exists
nowhere else. Engines prefer citing a distinctive source over the fifth
restatement of common knowledge. The blog's `ourAngle` scoring criterion
is exactly this — check it survived into the published prose.

### 9. Crawlability for AI

robots.txt must not block GPTBot, ClaudeBot, PerplexityBot, or
Google-Extended (the audit script checks this). Content must be present
in static HTML — it is (static export), just don't regress. ChatGPT leans
on Bing's index: verify the site is indexed in Bing occasionally
(site:jamesevans.au on Bing).

### 10. Freshness

Perplexity heavily weights recency; Google AI Overviews mostly cites
pages already ranking top-10. Updated dates on refreshed posts matter;
so does traditional ranking — GEO is additive to SEO, not a substitute.

## What NOT to do

- **Keyword stuffing scored worse than baseline** in the Princeton study —
  it actively hurts AI citation. Never trade prose quality for keywords.
- **llms.txt is not a lever.** Google has confirmed it's ignored
  (compared it to the keywords meta tag); no major provider commits to it.
  Harmless to add, wrong to prioritise or claim value from.
- **Don't add FAQPage/HowTo schema.** HowTo rich results are retired;
  FAQPage is restricted to gov/health sites since 2023.
- Don't fake experience markers or manufacture quotes — E-E-A-T signals
  that are discovered to be false are worse than absent, and the blog's
  no-fabrication rule applies to SEO copy too.
