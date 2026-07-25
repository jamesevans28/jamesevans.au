# jamesevans.au — Blog Section Plan

**Author:** Claude (planning session, 25 July 2026)
**Status:** Phases B1–B4 built (25 July 2026). Not yet deployed — see "Before first deploy" below.
**Depends on:** the existing site (see `docs/PLAN.md`, Phases 0–4 built)

---

## Build status (B1–B4 complete)

Verified locally: **lint + typecheck + 156 tests + static export all green**, all four CDK stacks synthesize.

- **B1** — `infra/lib/blog-stack.ts`: DynamoDB `jamesevans.au-blog` (on-demand, `by-status` GSI, PITR, deletion protection, RETAIN) in ap-southeast-2; deploy role granted read-only (`Query`/`GetItem`/`BatchGetItem`) on the table + indexes. Validation in `src/lib/blog-schema.ts` (zod), build-time data layer in `src/lib/blog.ts`. ✅
- **B2** — `/blog` index + `/blog/[slug]` articles, markdown pipeline (`src/lib/markdown.ts`: remark/rehype + Shiki, sanitised), `.prose-volt` theme in `globals.css`, `PostCard`, on-page table of contents, related posts, Blog nav link. ✅
- **B3** — Per-post `generateMetadata` (canonical, OpenGraph `article`, Twitter card), `BlogPosting` + `Blog` + `BreadcrumbList` JSON-LD, per-post OG images (`scripts/generate-blog-og.mjs`, wired to `prebuild`), sitemap entries with real `lastModified`, RSS at `/feed.xml`. ✅
- **B4** — `scripts/blog/index.ts` CLI (`draft`/`pull`/`push`/`publish`/`unpublish`/`list`/`lint`/`preview`), `repository_dispatch: blog-publish` on the deploy workflow, authoring skill at `.claude/skills/blog-post/SKILL.md`. ✅

### Decisions made during the build

- **Draft isolation** is gated on `BLOG_INCLUDE_DRAFTS=1`, not `NODE_ENV`. `next build` always sets `NODE_ENV=production`, including the local preview build whose whole purpose is rendering a draft. The deploy workflow never sets the variable, so a draft cannot reach production.
- **`generateStaticParams` emits a `__no-posts__` placeholder** when there are no posts: `output: export` fails a dynamic route that yields zero paths. The page calls `notFound()` for it, so the export contains only a `noindex` 404 at that URL, and it appears in no sitemap, feed, or index.
- **AWS credentials are configured before the build step** in `deploy.yml`. They were previously configured after it; leaving that would have exported a blog with zero posts on every deploy instead of failing.
- **An invalid *published* post fails the build**, rather than being skipped — silently dropping a live article is worse than a red deploy. Invalid *local drafts* only warn.
- **Prose link hover thickens the underline instead of recolouring to flare.** Flare on paper is 3.31:1 in the light theme, below AA for normal text; `contrast.test.ts` now asserts this so it can't be reintroduced.
- **`slugifyHeading` mirrors `github-slugger` exactly** — it replaces whitespace per character rather than collapsing runs, so `"AI & You"` → `ai--you`. Collapsing produced table-of-contents links pointing at ids the page didn't have; verified against the real library across 14 cases and locked in by a regression test.
- **Build-time tooling lives in `devDependencies`.** The AWS SDK, unified/rehype stack and Shiki all run at build time only; nothing new ships to the browser (runtime deps are unchanged) and a rendered post adds zero client JS.

### Before first deploy

1. `cdk deploy JamesEvansBlog` (and re-deploy `JamesEvansDeployRole` for the new read grant).
2. Set the `BLOG_TABLE` GitHub repo variable to `jamesevans.au-blog`.
3. Grant James's local AWS profile read/write on the table (the CLI writes; CI never does).
4. Write the first post: `npm run blog -- draft <slug>`, then follow the skill.

---

## 1. Goals

1. A **Blog** item in the top navigation.
2. `/blog` — an index page listing all published articles.
3. `/blog/<slug>` — one page per article.
4. **Only James can publish.** No public write path of any kind.
5. Posts stored in a **new DynamoDB table** (canonical content store).
6. **Claude-first authoring** — the primary way content gets written and published is a Claude Code session, so the publish flow must be a scriptable pipeline, not a web form.
7. **Maximum SEO** — pages must be fully-rendered static HTML with complete metadata, structured data, feeds, and sitemap coverage.

## 2. Architecture decision — static regeneration, not SSR

The site is `output: 'export'` → plain files on S3 behind CloudFront. Two ways to add a database-backed blog:

| Option | How | Verdict |
|---|---|---|
| **A. Build-time fetch + redeploy on publish** | Build reads DynamoDB, prerenders every post to static HTML; publishing a post triggers a rebuild/deploy | ✅ **Chosen** |
| B. Move to SSR/ISR (OpenNext → Lambda + CloudFront) | Pages render server-side per request | ❌ Rejected |

**Why A:** a blog changes only when James publishes (a few times a week at most). Static HTML is the SEO gold standard — zero TTFB penalty, no cold starts, perfect Core Web Vitals, trivially cacheable. It keeps the entire existing infra, deploy pipeline, and security posture (private bucket, no compute, no attack surface). Option B would rewrite the deployment architecture, add Lambda cost/complexity, and buy nothing: sub-minute publish latency is worthless for a blog, and SSR is strictly worse for SEO than prerendered static pages. A full rebuild+deploy takes ~2–3 minutes — that *is* the publish latency, and it's fine.

DynamoDB remains genuinely useful in this model: it is the canonical store and authoring API surface (posts are data, not files in git — no repo commits per article, drafts live server-side, and future consumers like a newsletter or search index read the same table).

## 3. DynamoDB design

New table in the existing CDK app (`infra/`), ap-southeast-2.

- **Table:** `jamesevans.au-blog`
- **Billing:** on-demand (traffic is a handful of reads per build — cost ≈ $0)
- **Keys:** `pk = "POST"`, `sk = <slug>` (single collection; slug-keyed, so `GetItem` by slug and one `Query` for all posts)
- **PITR:** enabled; `RemovalPolicy.RETAIN`
- **GSI `by-status`:** `gsi1pk = status` (`draft` | `published`), `gsi1sk = publishedAt` (ISO 8601) — lets the build query only published posts, newest first, and the CLI list drafts

**Item shape** (validated by a zod schema shared between CLI and build):

```
slug            string   (kebab-case, immutable once published — it's the URL)
title           string   (≤ 65 chars — SERP title budget)
description     string   (140–160 chars — meta description)
status          'draft' | 'published'
publishedAt     ISO date (set on first publish)
updatedAt       ISO date
tags            string[] (lowercase kebab-case)
heroImageKey?   string   (S3 key under images/blog/, optional)
heroImageAlt?   string
bodyMarkdown    string   (GitHub-flavoured markdown; images referenced by site-relative path)
canonicalUrl?   string   (only if syndicated from elsewhere)
```

Post bodies are markdown *in the item* (400 KB item limit is ~80,000 words — never a constraint). Images do **not** go in DynamoDB: the publish CLI uploads them to the existing site bucket under `images/blog/<slug>/` (they deploy with the site anyway — see §5).

## 4. Authoring & publish pipeline ("only me", Claude-first)

**Access control = AWS IAM.** There is no admin web UI, no login page, no public write endpoint. The only write path is the AWS API, and only James's local credentials (SSO profile) and the CI role can touch the table. That satisfies "only me" with zero new attack surface. (An admin UI can be a later phase if ever wanted — see §9.)

### 4.1 `scripts/blog/` CLI (tsx, like the existing `scripts/`)

```
npm run blog -- draft <slug>        # scaffold: prompts/args → writes draft item to DynamoDB
npm run blog -- pull <slug>         # fetch item → local .md file with frontmatter, for editing
npm run blog -- push <file.md>      # validate + upsert item (stays in current status)
npm run blog -- publish <slug>      # validate hard, set status=published + publishedAt, upload images, trigger deploy
npm run blog -- unpublish <slug>    # revert to draft + trigger deploy
npm run blog -- list [--drafts]     # table of posts
npm run blog -- preview <slug>      # pull → local file → next dev renders it (see §5.4)
```

- Uses `@aws-sdk/client-dynamodb` + `lib-dynamodb` with the local AWS profile.
- `publish` triggers the deploy by firing a `repository_dispatch` event (`gh api repos/:owner/:repo/dispatches -f event_type=blog-publish`) — reuses the existing GitHub Actions deploy workflow.
- **Local round-trip format is markdown + YAML frontmatter** — exactly what Claude is best at producing. DynamoDB is canonical; the local `.md` file is a scratch working copy (git-ignored under `content-drafts/`).

### 4.2 Claude authoring skill

Add a repo skill at `.claude/skills/blog-post/SKILL.md` so a session like *"write a post about X and publish it"* follows a fixed pipeline:

1. Research/draft the article as markdown with frontmatter (house style + SEO checklist embedded in the skill: search-intent-led H1, descriptive H2s, 1,200–2,000 words, internal links to /services + /work where natural, alt text on every image, no keyword stuffing).
2. `npm run blog -- push` as a **draft**, then `preview` and self-review the rendered page (screenshot via the dev server).
3. Show James the draft; **publish only on his explicit go-ahead** (publishing is public + externally visible — always confirm).

### 4.3 Validation (shared zod schema + `blog lint`)

Hard-fails on: missing/oversized title, description outside 140–160 chars, non-kebab slug, slug collision, duplicate H1, images without alt text, dead internal links, frontmatter/table drift. This runs in the CLI *and* as a build-time check so a bad item can never break or degrade a deploy.

## 5. Site changes (Next.js)

### 5.1 Routes

- `src/app/blog/page.tsx` — index: post cards (title, description, date, tags, reading time), newest first. Voltage-styled; reuses `Card`/`Section`/`Container`.
- `src/app/blog/[slug]/page.tsx` — article page with `generateStaticParams()` reading DynamoDB. Typography via Tailwind `@tailwindcss/typography` prose styles themed to Voltage tokens (must pass the existing contrast tests in both themes).
- `src/app/blog/tag/[tag]/page.tsx` — thin tag index pages (phase 2 — only once there are ≥ ~8 posts; thin pages hurt SEO before that).

### 5.2 Data access at build time

`src/lib/blog.ts` — `getPublishedPosts()` / `getPost(slug)` querying the GSI. Runs **only at build time** (static export — there is no runtime server). Local `next dev` without AWS creds falls back to an empty list plus any files in `content-drafts/` so the site still builds for non-blog work.

### 5.3 Markdown rendering

Unified pipeline at build time: `remark-parse` → `remark-gfm` → `rehype` → sanitize → `rehype-pretty-code` (Shiki) for code blocks, `rehype-slug` + autolinked headings, external links get `rel="noopener"`. Rendered to static HTML in the RSC — **zero client-side JS added per post**.

### 5.4 Preview

`blog preview` writes the draft to `content-drafts/` and the dev-mode data layer merges it in, so a draft renders at `localhost:3000/blog/<slug>` without touching production.

### 5.5 Navigation

Add `{ label: 'Blog', href: '/blog' }` to `navLinks` in `src/content/site.ts` (desktop + mobile menus pick it up automatically). Add a "Latest writing" teaser row (3 most recent posts) to the homepage — internal links from the highest-authority page are an SEO win and drive readers into services.

## 6. SEO (the point of the exercise)

- **Fully static HTML** per post — crawlers get complete content with no JS execution needed. This is the single biggest lever and Option A gives it for free.
- **Metadata:** per-post `generateMetadata` — title (`<post title> — James Evans`), meta description, canonical URL, OpenGraph `type: article` with `publishedTime`/`modifiedTime`/`tags`, Twitter card.
- **Structured data:** `BlogPosting` JSON-LD per post (headline, dates, author → existing `Person` entity, image, wordCount) and `Blog` on the index — extend the tested helpers in `src/lib/jsonld.tsx`.
- **OG images:** extend `scripts/generate-og.mjs` to render a per-post Voltage-branded OG image (title + date + spark field) at build time → `public/og/blog/<slug>.png`.
- **Sitemap:** `src/app/sitemap.ts` gains all post URLs with real `lastModified` from `updatedAt` — this is how Google discovers new posts within hours of a deploy.
- **RSS feed** at `/feed.xml` (built at export time) — feed readers, syndication, and another discovery signal. Linked via `<link rel="alternate">`.
- **Content architecture:** posts interlink with `/services` and `/work` (topical authority flows to the pages that convert); tag pages deferred until post volume justifies them; slugs are short, keyword-bearing, and immutable (renames require a 301, which static hosting makes painful — the CLI blocks slug changes on published posts).
- **Performance:** hero images pre-sized to display dimensions via `sharp` at publish time (AVIF/WebP + fallback), lazy-loaded below the fold; no new client JS. Core Web Vitals stay green, which is a ranking input.
- Existing `robots.ts` already allows everything; no change needed.

## 7. Infra & CI changes

1. **`infra/lib/blog-stack.ts`** (or extend `SiteStack`): the DynamoDB table + GSI as in §3.
2. **Deploy role:** grant the existing GitHub OIDC deploy role `dynamodb:Query`/`GetItem` **read-only** on the table + GSI. CI never writes content.
3. **Author permissions:** James's local profile gets read/write on the table and `s3:PutObject` on `images/blog/*`.
4. **Workflow:** add `repository_dispatch: types: [blog-publish]` as a trigger on the existing deploy workflow. Build step queries DynamoDB via the OIDC role.
5. **Logging rule:** CLI and build logs may reference slugs/titles only — never author email or other personal data (org policy: no PII in logs).

## 8. Testing

- Schema/validation unit tests (zod) incl. the SERP-length rules.
- Markdown pipeline snapshot test (GFM features, code blocks, sanitization — script injection in markdown must be stripped).
- `BlogPosting`/`Blog` JSON-LD tests alongside the existing `jsonld.test.tsx`.
- a11y (`vitest-axe`) and Voltage contrast tests over the prose theme in both light/dark.
- Build-time guard: a published item that fails validation fails the build loudly (never silently drops a post).
- Data layer mocked in tests; no AWS calls in CI test step.

## 9. Phasing

| Phase | Scope | Exit criteria |
|---|---|---|
| **B1 — Foundation** | Table + GSI in CDK; zod schema; `src/lib/blog.ts`; deploy-role read grant | `cdk synth` green; schema tests pass |
| **B2 — Site** | `/blog` + `/blog/[slug]`; markdown pipeline; prose theme; nav link; homepage teaser | Static build renders seeded posts; a11y + contrast green |
| **B3 — SEO layer** | Metadata, JSON-LD, per-post OG images, sitemap entries, RSS | Rich Results test passes on a sample post; feed validates |
| **B4 — Publish pipeline** | `scripts/blog/` CLI (draft/pull/push/publish/preview/list); `repository_dispatch` wiring; Claude skill | End-to-end: Claude drafts → preview → publish → live on jamesevans.au in one session |
| **B5 — Later (optional)** | Tag pages (≥8 posts), related-posts block, newsletter capture, X/Twitter link-post on publish (see §10.3) | — |

Rough effort: B1–B4 is one focused build session each, same shape as the original site phases.

## 10. Decisions (confirmed by James, 25 July 2026)

1. **Blog voice/scope — "AI in everyday life."** The blog is for everyday people and small businesses, not engineers. Content pillars (these go verbatim into the authoring skill's house-style section):
   - How everyday people can actually use AI — practical, jargon-free
   - AI for small business and personal use
   - Tips & tricks
   - Step-by-step how-to guides
   - Non-standard / creative ways of implementing AI
   - Thoughts on the latest AI trends
   - Commentary and takes on new AI innovations and ideas

   **Tone:** plain-English, practical, opinionated where it's commentary — written for a smart non-technical reader. This is also great SEO territory: how-to and "can AI do X" queries have high search volume, and guide-style posts map cleanly to search intent. Tag taxonomy starts as: `guides`, `tips`, `small-business`, `personal`, `trends`, `commentary`.
2. **Comments: no.** Readers reply via /contact.
3. **Syndication: no LinkedIn. Twitter/X — maybe.** Plan for it as an optional B5 item: on publish, the CLI can post a link tweet (title + hook + URL) via the X API. Content always lives canonically on jamesevans.au — X only ever gets a link, never the full text. Not built until James says go; the schema's `canonicalUrl` field remains for any future syndication.
4. **Tooling: confirmed** — `gh` CLI and AWS SSO profiles are set up on the authoring machine.
