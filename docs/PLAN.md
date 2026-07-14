# jamesevans.au — Website Plan

**Author:** Claude (planning session, 14 July 2026)
**Status:** Phases 0–4 built (14 July 2026). Phase 5 (deploy) + Phase 6 (post-launch) pending.
**Repo:** github.com/… → deployed to AWS via GitHub Actions
**Domain:** jamesevans.au (registered at GoDaddy, DNS to be delegated to Route 53)

---

## Build status (Phases 0–4 complete)

Implemented and verified locally — **lint + typecheck + 49 tests + static build all green**, both CDK stacks synthesize.

- **Phase 0** — Next 16 App Router + React 19 + Tailwind 4 + Vitest, `output:'export'`, all configs. ✅
- **Phase 1** — Voltage design system (tokens in `@theme`, self-hosted Bricolage/Archivo, dark-mode toggle with no-flash script, core components: Button, Card, Section, Container, SiteHeader w/ mobile menu, SiteFooter, ThemeToggle, SparkField, Duotone). Contrast test enforces AA. ✅
- **Phase 2** — Typed content modules (`site`, `experience`, `services`, `work`, `about`, `testimonials`); 6 routes + 404; portrait wired; content-integrity tests. ✅
- **Phase 3** — Per-page metadata, JSON-LD (Person/WebSite/ProfessionalService), sitemap.xml + robots.txt, build-time OG image (`scripts/generate-og.mjs`), GA4 via `@next/third-parties` (prod-only, `NEXT_PUBLIC_GA_ID`), axe a11y tests. ✅
- **Phase 4** — AWS CDK in `infra/`: S3 (private, OAC) + CloudFront + ACM + Route 53 + CloudFront Function (URL rewrite + www→apex 301) + security-headers policy; OIDC deploy role locked to repo+main. `infra/README.md` documents GoDaddy delegation + bootstrap. ✅

### ⚠️ Version decisions (deviations from "absolute latest", with reasons)

The brief asked for the absolute latest of everything. Two pins were stepped back **one major** because the latest majors are not yet supported by the surrounding tooling — shipping a forced/broken resolution would violate the "best practice" half of the brief. Both are current, supported majors. Follow-ups tracked below.

- **TypeScript 6.0.3, not 7.0** — `typescript-eslint@8.64` (latest) caps its peer range at TS `<6.1.0`; TS 7 (released 8 July) has no linter support yet. Bump to TS 7 once `typescript-eslint` ships a compatible release.
- **ESLint 9.39, not 10** — `eslint-config-next@16.2.10` bundles `eslint-plugin-react@7.37`, which calls the `context.getFilename` API that ESLint 10 removed (hard crash on lint). Bump to ESLint 10 once `eslint-config-next` updates its bundled plugins.
- **Known audit note:** `next` pulls a transitive `postcss` with a moderate CSS-stringify XSS advisory and "no fix available". It does not apply to a static prerendered site with no user-supplied CSS; clears when Next bumps its own dependency.
- Everything else is on the researched latest: Next 16.2.10, React 19.2.7, Tailwind 4.3.2, Vitest 4.1.10, `@next/third-parties` 16.2.10, aws-cdk-lib 2.261.0.

---

## 1. Purpose & positioning

One site, two jobs:

1. **Online resume** — a living, always-current professional profile for recruiters, peers, and professional network. Replaces the Word doc as the canonical record.
2. **Services storefront** — a place where businesses and individuals can discover and engage James for software development, tech consulting, troubleshooting, hardware, and installations.

**Positioning statement:** *Enterprise-grade engineering, personal-scale service.* James runs the engineering behind Australia Post's Point of Sale across ~4,000 retail stores by day — and brings that same rigour to apps, advice, and tech problems for businesses and people who need technology done properly.

The two audiences must never confuse each other: the homepage speaks to both and routes each to their own path within one screen (dual CTAs: **Work with me** → Services, **My experience** → Resume).

### Voice

Warm, plain-spoken, confident, zero jargon-for-jargon's-sake. First person ("I build…", "I've spent 25 years…"). The LinkedIn headline is the authentic register: *"hands-on software engineering leader… driven by empowering teams and coaching junior engineers."*

---

## 2. Design system — "Voltage"

Bold, bright, all-sans. *(v2 — revised per James's feedback 14 Jul 2026: the original muted cream/green/copper direction was too washed out.)* Electric ultramarine as the brand colour, hot coral for action, a strike of citrus yellow for highlights — saturated colour on crisp white (light) and deep ink (dark), so the brights hit at full intensity.

### Colour tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `paper` | `#FFFFFF` crisp white | `#0C0C18` deep ink-blue black | Page background |
| `surface` | `#F4F5FB` | `#16162B` | Cards, panels |
| `ink` | `#0E0E1A` | `#F2F2FA` | Body text |
| `ink-muted` | `#4E4E66` | `#9C9CB8` | Secondary text |
| `volt` | `#2337FF` electric ultramarine | `#7C89FF` | Brand: links, headings accents, stat numerals |
| `volt-deep` | `#1723B8` | — | Hover, footer ground |
| `flare` | `#FF4D2E` hot coral | `#FF7A5C` | Primary CTA + one highlight per screen |
| `citrus` | `#FFC400` | `#FFD23F` | Marker highlights, badges — always with ink text |
| `line` | `#E3E5F0` | `#2A2A45` | Borders, dividers |

Rules: white/ink grounds stay clean so the saturated trio lands hard — colour is spent on *meaning* (brand, action, highlight), never decoration. `flare` and `citrus` fills always carry `ink` text (white-on-coral fails AA). Every text/background pair must pass WCAG 2.2 AA (4.5:1); verified programmatically in a unit test over the token file (see §7).

Dark mode: class-strategy synced to `prefers-color-scheme` with a manual toggle, persisted in `localStorage`. Tailwind v4 `@theme` tokens defined once in CSS.

### Typography — all sans-serif

| Role | Face | Notes |
|---|---|---|
| Display / headings | **Bricolage Grotesque** (variable, 700–800) | Loud, characterful grotesque — carries the "bold and bright" brief; tight tracking at display sizes |
| Body / UI | **Archivo** (variable, 400/600) | Sturdy, highly legible workhorse |
| Code / figures | **JetBrains Mono** | Sparingly — stat callouts, code accents |

Self-hosted via `next/font` (zero external requests, no layout shift, no Google tracking). Type scale: fluid `clamp()` scale, ~1.25 ratio; hero display ~`clamp(2.75rem, 7vw, 5rem)`, weight 800.

### Texture & motion

- Generous whitespace; max content width ~72rem; long-form text ~65ch.
- A single signature graphic motif: a sharp diagonal "spark" mark (SVG) used in the header logo, section dividers, and OG image; citrus marker-highlights on key phrases.
- Subtle motion only: fade/slide-up on scroll-into-view, 150–250 ms, fully disabled under `prefers-reduced-motion`.

### Imagery & art direction

The site should feel image-rich and creative, not a wall of words. The trick for a one-person brand with no photo library: **treat every image through the palette so anything becomes a brand asset.**

1. **Duotone treatment** — all photography is run through an ink → volt duotone (build-time via `sharp`, or CSS `filter: grayscale(1)` + a volt `mix-blend-mode: multiply` overlay). Any casual photo instantly looks designed and on-brand. Hover can restore full colour as a micro-delight.
2. **Portrait** — placeholder in place at `public/images/portrait.jpg` (pulled from LinkedIn, 421×421 — fine for cards, too small for hero). James will supply a proper shot (≥1200px) → used as a duotone cutout on a citrus/volt shape in the Home close and About page, and in the OG image.
3. **Audify device mockups** — real screenshots of the Audify web + mobile apps in device frames (phone tilted over a laptop), sitting on flat volt panels. This is the single most persuasive image on the site: proof of real product. (Screenshots need Kairos Strategies' OK for any real data visible — use demo-tenant data.)
4. **Spark field backgrounds** — generative SVG: a sparse grid of diagonal spark strokes in volt at 4–6% opacity behind heroes and section breaks; a denser burst behind stat tiles. Code-generated, so it costs nothing and scales infinitely.
5. **Bold duotone icons** — services and process steps get custom line icons: volt stroke, one citrus fill accent each. Consistent 24px grid.
6. **Personal photo strip (About)** — 3–4 candid shots (workspace, Melbourne, hardware bench), duotone-treated, in a broken horizontal strip. Authentic beats stock — **no stock photography anywhere**; it instantly reads generic.
7. **OG/social image** — Bricolage type + duotone portrait cutout on volt, generated at build time so it always matches the live design.

---

## 3. Information architecture

```
/              Home — hero, credibility strip, services teaser, featured work, contact CTA
/services      What I do, who it's for, how engagement works
/experience    The online resume — timeline, skills, education, PDF download
/work          Case studies (Kairos PWA, CRM migration robots, project tracker, POS at scale)
/about         Story, values, photo, the person behind the work
/contact       Ways to reach me (+ form in Phase 2)
/404           On-brand not-found
```

### Page-by-page

**Home**
1. Hero — eyebrow `James Evans · Melbourne`; H1 draft: **"Twenty-five years of making technology work."** Sub: *"By day I lead the engineering behind Australia Post's Point of Sale in ~4,000 stores. Beyond it, I build apps, untangle problems and give straight answers — for businesses and people who need tech done right."* CTAs: `Work with me` (flare) / `My experience` (ghost).
2. Credibility strip — 4 stat tiles: **25 yrs** in software · **~4,000** stores running my team's POS · **150** engineers launched via Telstra's grad program · **250k+** assets captured by Audify, built end-to-end.
3. Services teaser — 4 cards (from /services) with one-line value props.
4. Featured work — 2 case-study cards (Audify with device mockup, POS at scale).
5. Testimonial strip — 2–3 short quotes. **Placeholder copy for now (below) — clearly marked `[PLACEHOLDER]` in the content modules and MUST be replaced with real, permissioned quotes (or the section removed) before launch. Fabricated testimonials cannot go live.**
   - *"James built Audify from a whiteboard sketch into the platform our national contracts run on. Years later, he's still the first call we make."* — Director, Kairos Strategies `[PLACEHOLDER]`
   - *"He sorted out our systems in a weekend — then explained everything in plain English."* — Small-business owner, Melbourne `[PLACEHOLDER]`
   - *"The rare engineering leader who still ships code, and makes everyone around him better."* — Former colleague, Telstra `[PLACEHOLDER]`
6. Warm close — short personal note + duotone portrait cutout + contact CTA.

**Services** — four offerings, each with "what you get / typical engagements / who it's for":
1. **Software development** — web & mobile apps end-to-end: design, build, host (AWS or Google Cloud), maintain. Proof: Audify, the field-auditing platform built for Kairos Strategies.
2. **Technology advice & consulting** — fractional/on-call engineering leadership for small business: architecture reviews, vendor selection, "should we build or buy", hiring help.
3. **Tech problems, solved** — the "common tech problems" offer: slow machines, backups, email, networks, migrations. Fixed properly, explained plainly.
4. **Hardware & installations** — setups, upgrades, networks, devices, point-of-sale gear (his literal day-job domain).
Plus: how engagement works (chat → scope → fixed quote or hourly → deliver), service area (Melbourne on-site / remote anywhere).

**Experience** — the online resume. Vertical timeline rendered from a typed data module (single source of truth, also feeds JSON-LD and the PDF):
- **Australia Post** — Engineering Manager, Nov 2023 – present. POS across ~4,000 retail stores; team leadership, delivery, vendor transition to in-house, fortnightly release cadence.
- **Telstra** — Chapter Lead Principal (GM) Aug 2022 – Nov 2023 *(resume said "Present" — corrected)*; Chapter Lead Aug 2019 – Aug 2022; Senior Software Engineer Dec 2013 – Aug 2019; Application Development Manager Jun 2012 – Dec 2013. Highlights: 150-engineer grad program, $200k pa offshore savings, CRM migration robots ($500k saved), 300-user project tracker, hotdesk display system.
- **NICE Systems** Apr 2011 – Jun 2012 · **Australian Air Express** 2009–11 · **Merced Systems (London)** 2008–09 · **SEGA Europe (London)** 2007–08 · **Fonterra (NZ)** 2002–07.
- Skills grid (C#/.NET, JS — React/Vue/Angular, PHP/Laravel, APIs & microservices, SQL, CI/CD, Azure, AWS, Docker) + education (BSc Information Services, Waikato, 1999–2002).
- `Download resume (PDF)` button — generated from the same data (Phase 2; Phase 1 ships a curated static PDF).

**Work** — case studies in problem → approach → outcome shape:
1. *Audify — field auditing platform for Kairos Strategies* ([kairosstrategies.com.au](https://kairosstrategies.com.au)) — built end-to-end and still run by James: offline-first web app (React 19) + native iOS/Android app (React Native/Expo), multi-tenant Firestore backend on Google Cloud (Australian data residency), custom audit form builder, photo capture with an AI defect-detection pipeline, QR asset lookup, Excel reporting, multi-environment deploys. 250k+ assets captured; used on national government contracts. Client naming approved by James (Jul 2026). *(Note: the resume says "hosted on AWS" — the current platform is Google Cloud/Firebase; use the current facts. Keep customer names and internal audit details out of the public copy.)*
2. *Point of Sale at national scale (Australia Post)* — written as an employment story, resume-level detail only, no internal specifics.
3. *Migrating 200,000 customers by robot (Telstra)* — 50-machine OpenSpan fleet, 24/7, ~$500k saved.
4. *Project tracker, 300 daily users (Telstra)* — PHP/Angular/MySQL on AWS.

**About** — the human page: NZ→London→Melbourne arc, why he still codes, coaching ethos, life outside tech. Photo.

**Contact** — Phase 1: `hello@jamesevans.au` (domain email via SES forwarding — do **not** publish the personal Gmail), LinkedIn. **No phone number published** (James's decision, Jul 2026 — may revisit later). Phase 2: form → API Gateway + Lambda + SES (see §8).

**Footer / business identity** — trading as **James Evans** (personal name, no separate trading name). ABN pending: add `ABN xx xxx xxx xxx` to the footer and the `LocalBusiness` JSON-LD once issued (tracked in §11).

---

## 4. Tech stack (versions verified against npm/GitHub, 14 July 2026)

| Layer | Choice | Version |
|---|---|---|
| Framework | **Next.js (App Router, static export `output: 'export'`)** | 16.2.x |
| UI | **React** + React Compiler (stable 1.0) | 19.2.x |
| Language | **TypeScript** (Go-native compiler) | 7.0.x |
| Styling | **Tailwind CSS** (CSS-first `@theme` config) | 4.3.x |
| Fonts | `next/font` self-hosted Fraunces / Inter / JetBrains Mono | — |
| Unit tests | **Vitest** + **@testing-library/react** + `vitest-axe` | 4.1.x / 16.3.x |
| E2E (later phase) | Playwright | latest |
| Lint/format | **ESLint 10** (flat config only) + **Prettier 3.9** | 10.x / 3.9.x |
| Runtime/CI | **Node 24 LTS**, npm | 24.x |
| IaC | **AWS CDK** (TypeScript) in `infra/` | v2 latest |

### Decision log

- **Next.js static export over Astro** — 2026 research says Astro+islands is the top generic recommendation for content sites, but the brief is explicit: *built in React*, *common in the industry*. Next.js is the industry-standard React framework; `output: 'export'` gives fully prerendered static HTML (the SEO win Astro offers) while staying 100 % React and deploying as plain files to S3. Revisit only if we later need heavy interactivity budgets.
- **…over Vite SPA** — client-rendered SPA is the weakest SEO option for a site whose whole point is being found.
- **…over React Router v8 framework mode** — capable, but v8 shipped four weeks ago; less battle-tested and less industry-common than Next for this shape.
- **Tailwind v4** — tokens live in CSS (`@theme`), no config file; pairs perfectly with a small design system.
- **npm over pnpm** — solo maintainer, simplest CI; pnpm is a drop-in swap later if wanted.
- **CDK over Terraform/click-ops** — IaC in the same language as the app; whole stack reviewable in one PR.

### Repository layout

```
/
├── app/                    # Next.js App Router routes
├── components/             # Design-system + page components
├── content/                # Typed data: experience.ts, services.ts, work.ts, site.ts
├── lib/                    # Utilities (JSON-LD builders, etc.)
├── public/                 # resume.pdf, images, favicons, robots.txt
├── test/                   # Vitest setup + specs colocated or here
├── infra/                  # AWS CDK app (own package.json)
├── .github/workflows/      # ci.yml, deploy.yml  ← created now
└── docs/PLAN.md            # this document
```

Content lives in **typed TS modules**, not hardcoded JSX — the Experience page, homepage stats, JSON-LD, and (later) the generated PDF all render from `content/experience.ts`. Updating the resume = editing one file.

---

## 5. SEO & discoverability

The "people can find me" requirement is half the project:

- Static prerendered HTML for every route (from `output: 'export'`).
- Per-page `metadata` (title, description, canonical), Open Graph + Twitter cards with a branded OG image.
- **JSON-LD**: `Person` (sameAs → LinkedIn), `ProfessionalService` + `LocalBusiness` (Melbourne, service area) on /services, `WebSite`.
- `sitemap.xml` + `robots.txt` generated at build.
- Post-launch: **Google Search Console** + Bing Webmaster verification; **Google Business Profile** for local "tech help Melbourne" queries — likely the single highest-leverage discoverability action for the services side.
- Target keywords woven naturally: *software consultant Melbourne, web app developer Melbourne, mobile app developer, tech support Melbourne, engineering manager, fractional CTO*.
- Performance as ranking signal: Lighthouse ≥ 95 across the board; LCP < 1.5 s (static + self-hosted fonts makes this easy; duotone images pre-processed and AVIF/WebP-encoded at build time so imagery doesn't cost the budget).
- **Analytics: Google Analytics 4** (James's choice, Jul 2026). Wire via `@next/third-parties` `<GoogleAnalytics gaId={...}>` with the measurement ID in `NEXT_PUBLIC_GA_ID`, rendered only in production builds. GA4 does not log IPs and serves AU traffic fine without a GDPR-style banner; add a short privacy note in the footer. Link the property to Search Console.

---

## 6. Accessibility

WCAG 2.2 AA throughout: semantic landmarks, single h1 per page, visible focus rings (copper), 44 px touch targets, contrast enforced by unit test on the token pairs, `prefers-reduced-motion` respected, alt text on all imagery, keyboard-complete nav (including the mobile menu and theme toggle). `vitest-axe` assertions on every page component.

---

## 7. Testing strategy

**Unit/component (Vitest + RTL, jsdom):**
- Design-system components: Button, Card, Nav (mobile menu open/close/escape), ThemeToggle (persists + respects system), Footer.
- Content integrity: every role in `experience.ts` has valid dates/no overlaps flagged wrongly; stats used on Home exist in content; all internal links resolve to known routes.
- JSON-LD builders produce schema-valid output.
- **Palette contrast test**: iterate token pairs, assert ≥ 4.5:1 — the design system can't regress below AA.
- a11y: `vitest-axe` per page.
- Coverage gate: 80 % lines/branches on `components/` and `lib/` (content modules excluded).

**E2E (Phase 6, Playwright):** smoke-crawl all routes, nav works, dark mode toggles, 404 renders, PDF downloads.

**CI order:** lint → typecheck → test → build; deploy only from green main.

---

## 8. AWS architecture

```
GoDaddy (registrar only, NS delegated)
        │
Route 53 hosted zone  jamesevans.au
        │  A/AAAA ALIAS (apex + www)
CloudFront distribution ── ACM cert (us-east-1, apex + www, DNS-validated)
        │  • CloudFront Function: /path → /path/index.html rewrite; www→apex 301
        │  • Response Headers Policy: HSTS, X-Content-Type-Options,
        │    Referrer-Policy, CSP, Permissions-Policy
        │  • OAC (origin access control)
S3 bucket (private, ap-southeast-2)  ← `out/` from next build
```

- **DNS**: create the hosted zone, then set Route 53's four NS at GoDaddy (domain stays registered there). Nothing .au-specific blocks this; James already meets the auDA Australian-presence requirement.
- **Cache strategy**: `_next/static/*` → `public,max-age=31536000,immutable`; HTML → `max-age=0,must-revalidate`; invalidation `/*` on deploy (free tier: 1,000 paths/mo — fine).
- **Cost**: ≈ US$1–3/month (hosted zone $0.50 + cents of S3/CloudFront at personal-site traffic) + domain renewal at GoDaddy.
- **Email**: SES receiving (or ImprovMX free tier) to forward `hello@jamesevans.au` → personal inbox, so the personal Gmail is never published.
- **Contact form (Phase 2)**: API Gateway + Lambda + SES send. Honeypot field + basic rate-limit. **The Lambda must not log form contents or sender details — names, emails, phone numbers and message bodies are PII and stay out of CloudWatch.** Log only a request ID and outcome.
- All infra in `infra/` as a CDK TypeScript app; the only manual steps are the GoDaddy NS change and the one-off GitHub OIDC role bootstrap.

## 9. CI/CD (files created in this session)

- **`.github/workflows/ci.yml`** — every PR and push to main: install → lint → typecheck → vitest (coverage) → build. Guarded to no-op until `package.json` exists, so CI is green from the first commit of this plan.
- **`.github/workflows/deploy.yml`** — push to main (after checks pass in-workflow): build static export → **OIDC** assume `AWS_DEPLOY_ROLE_ARN` (no long-lived keys) → `aws s3 sync` with per-path cache headers → CloudFront invalidation. Gated on repo variables so it stays dormant until infra exists. Uses `actions/checkout@v7`, `actions/setup-node@v7`, `aws-actions/configure-aws-credentials@v6` (current majors, verified).
- Repo **variables** to set when infra lands: `AWS_DEPLOY_ROLE_ARN`, `AWS_REGION` (`ap-southeast-2`), `SITE_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`. No secrets needed — that's the point of OIDC.
- IAM role trust policy locked to this repo + `main` ref; permissions limited to the bucket + `cloudfront:CreateInvalidation` on the one distribution.

---

## 10. Delivery roadmap

| Phase | Scope | Est. |
|---|---|---|
| **0 — Scaffold** | Next 16 + TS 7 + Tailwind 4 + ESLint 10 flat + Prettier + Vitest wired; `output:'export'`; CI green end-to-end | ½–1 day |
| **1 — Design system** | Tokens, fonts, dark mode, core components (Button, Card, Section, Nav, Footer, ThemeToggle) + their tests; spark motif v1 | 1–2 days |
| **2 — Content & pages** | All copy drafted, `content/` modules, six routes built, static resume PDF, portrait shot | 2–3 days |
| **3 — SEO & a11y hardening** | Metadata, JSON-LD, sitemap/robots, OG image, axe pass, Lighthouse ≥ 95 | 1 day |
| **4 — Infra** | CDK stack deployed; ACM validated; GoDaddy NS delegated; `hello@` forwarding | 1 day (+ DNS propagation) |
| **5 — Launch** | OIDC role, repo vars, first pipeline deploy, www redirect + HTTPS verified, GA4 property + Search Console + Business Profile | ½ day |
| **6 — Post-launch** | Contact form (Lambda/SES), Playwright e2e, real testimonials + final portrait swapped in, PDF-from-data | ongoing |

---

## 11. Open questions for James

*Answered 14 Jul 2026: no phone number published; Kairos Strategies (kairosstrategies.com.au) may be named, the app is **Audify**; trading as "James Evans", ABN pending; analytics = **GA4**; portrait = LinkedIn placeholder in `public/images/portrait.jpg` until James supplies a proper shot; testimonials = placeholders drafted (must be replaced before launch).*

1. **Final portrait** — professional shot ≥1200px to replace the LinkedIn placeholder (hero/OG can't use 421px).
2. **Real testimonials** — collect 2–3 permissioned quotes to replace the `[PLACEHOLDER]` copy before launch.
3. **Australia Post** — comfortable with resume-level description of the POS role? (Plan assumes yes; no internal detail is used.)
4. **ABN** — supply once issued so it can be added to the footer + `LocalBusiness` schema.
5. **GA4 measurement ID** — create the GA4 property (or say the word and it gets created at launch) and drop the `G-XXXX` ID into repo variables.
6. **Audify screenshots** — a couple of demo-tenant screenshots (web + mobile) for the device mockups; confirm Kairos Strategies is happy with what's visible.

---

## 12. Risks

- **Dual-audience muddle** — enterprise resume vs local services can dilute each other. Mitigation: dual-CTA hero, separate routes, distinct JSON-LD.
- **Bleeding-edge stack** (TS 7 is a week old; Vite 8/Rolldown is new under Next's hood) — pin exact versions, Renovate/Dependabot with CI as the safety net.
- **DNS cutover** — delegation moves *all* DNS for the domain to Route 53; recreate any existing GoDaddy records (email?) in the hosted zone *before* switching NS.
- **Employer sensitivity** — keep Australia Post content strictly at public-resume level.
