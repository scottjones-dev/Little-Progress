# LittleProgress — Family Care Diary: Implementation Plan

Structured with the System Design Primer's 4 steps: (1) use cases/constraints, (2) high-level design, (3) core components, (4) scale/bottlenecks.

## Context

Private care diary for a 12-month-old behind on solids. Captures detailed feeding trials plus sleep, nappies, milk, milestones; surfaces patterns (AI) and produces printable reports for clinicians. Two roles: Parents (full accounts) and Carers (shared PIN, add-only). Every entry records who logged it. Long-term: birth → school age. Stack (decided): Turborepo/pnpm monorepo (existing: `apps/web` Next 16, `apps/docs`, `packages/ui|eslint-config|typescript-config`), Next.js web, **Expo mobile app**, **Hono Node API**, Drizzle + Postgres, Better Auth, Cloudflare R2, **Vercel AI Gateway** for LLM, **Ultracite** (lint/format, Biome-based) and **Infisical** (secrets management).

### Tooling: Ultracite + Infisical

- **Ultracite**: run `pnpm dlx ultracite init` at repo root (Biome provider, editor + AI-agent rules). Replaces root Prettier and per-app ESLint (`packages/eslint-config`, `apps/*/eslint.config.js`, `eslint`/`prettier` deps). Root scripts: `lint` → `ultracite check`, `format` → `ultracite fix`; keep turbo `check-types`. Add `biome.jsonc` extending `ultracite/biome/core` + `ultracite/biome/next` (web) / `react` (mobile); pre-commit hook (lefthook/husky) runs `ultracite fix` on staged files; CI runs `ultracite check`. Verify against the installed Ultracite version's docs before configuring.
- **Infisical**: single source of truth for secrets (DATABASE_URL, BETTER_AUTH_SECRET, CARER_TOKEN_SECRET, R2_* keys, AI_GATEWAY_API_KEY). Project `littleprogress` with `dev`/`staging`/`prod` envs and folders `/api`, `/web`, `/mobile`. Local dev: `infisical login` + `.infisical.json` committed; dev scripts wrapped as `infisical run --env=dev --path=/api -- tsx watch src/index.ts` (same for Next). Prod: Infisical machine identity (Universal Auth) injected in API host + Vercel integration/sync for web; Expo gets only public `EXPO_PUBLIC_*` values at build via EAS secrets synced from Infisical. `.env*` stays git-ignored; commit only a `.env.example` listing key names. Turbo: declare vars in `globalEnv`/task `env` (strict env mode) so cache keys stay correct. Add Infisical secret-scanning pre-commit (`infisical scan`).

## Step 1 — Use cases, constraints, assumptions

- Users: ~2 parents, ~5-10 carers, 1-3 children. Writes ≈ 30-60 entries/day/child → ~20k rows/yr. Trivial scale; **optimize for correctness, privacy and speed-of-entry, not throughput**.
- Constraints: meal log <30 s one-handed; works at night (dark UI); offline-tolerant (nursery wifi); children's health data → private, encrypted, audited, no public endpoints.
- Non-goals v1: multi-family SaaS billing, push notifications, wearable integrations.

## Step 2 — High-level design

```
Expo app ─┐                       ┌─ Postgres (Drizzle)
          ├─ HTTPS ─▶ Hono API ───┼─ Cloudflare R2 (photos, PDF reports) via presigned URLs
Next web ─┘  (Better Auth)        └─ Vercel AI Gateway (pattern analysis)
```

Monorepo additions:

- `apps/api` — Hono (Node, `@hono/node-server`), Better Auth handler mounted at `/api/auth/*`, REST routes + Zod validation, exports `AppType` for typed RPC client (`hono/client`).
- `apps/mobile` — Expo (expo-router), same typed client; carer quick-log + parent logging.
- `apps/web` — Next.js: parent dashboard (3-column Midnight Sanctuary), carer quick-log route, print report route.
- `packages/db` — Drizzle schema, migrations, query helpers.
- `packages/shared` — Zod schemas/enums (texture, temperature, reaction, setting…), pattern types, constants.
- `packages/ui` — existing; add tokens (obsidian #0F1012, gold #D97706, slate #E2E8F0), chips, timeline.
- `packages/analysis` — deterministic feature extraction + AI prompt/schema.

## Step 3 — Core components

### Data model (Drizzle, Postgres)

- Better Auth tables (user, session, account, verification) + `user.role` (`parent`).
- `family`, `family_member(user_id, family_id, role)`, `child(id, family_id, name, dob)`.
- `carer(id, family_id, display_name, active)` — named carer identities (no password) so entries attribute to a person, not "PIN".
- `carer_pin(family_id, hash (argon2/scrypt), rotated_at)`; **rotating invalidates carer sessions**.
- `entry` base: `id, child_id, kind enum(meal|sleep|nappy|milk|milestone), occurred_at, logged_by_user_id | logged_by_carer_id (CHECK exactly one), created_at, updated_at, deleted_at, client_id (idempotency, unique per child)`.
- Detail tables 1:1 on `entry`: `meal_trial` (food_id, preparation, temperature, attempt_no, reaction, amount, setting, distractions[] , fed_by, note), `sleep` (start,end), `nappy` (wet|dirty|both), `milk` (ml/duration, type), `milestone` (category movement|sound|word|first_try, text).
- `food` (per family, reusable names/categories) so attempt number & history per food is queryable.
- `entry_audit` (edit/delete history; parents only) — satisfies "editing history".
- `attachment` (R2 key, entry_id), `report` (R2 key, params, created_by), `insight` (child_id, window, json, model, created_at).
- Indexes: `(child_id, occurred_at desc)`, `(child_id, kind, occurred_at)`, `meal_trial(food_id)`.

### Auth & roles (two separate gates)

- **Parents**: Better Auth email+password (+ optional passkey/TOTP plugin), cookie sessions on web (same-site domain), `@better-auth/expo` bearer storage in SecureStore for mobile. Hono middleware `requireParent`.
- **Carers**: `POST /carer/login {familyCode, pin, carerName}` → short-lived signed token scoped `role=carer`, family-bound, ~12 h, stored in separate cookie / SecureStore key. Middleware `requireCarer` only allows `POST /entries` and read of a minimal "today" summary. Rate-limit + lockout on PIN attempts (per IP + per family). Carer routes never reachable by parent-only endpoints (analytics, settings, edit/delete, reports).
- Server derives `logged_by` from the token — never from client body.

### API (Hono, Zod-validated)

`POST /entries` (parent+carer, idempotent via `client_id`), `PATCH/DELETE /entries/:id` (parent), `GET /entries?from&to&kind`, `GET /timeline`, `GET /stats/*` (charts), `POST /insights/run`, `GET /insights`, `POST /reports` → generates + stores to R2, `GET /reports/:id` (presigned), `POST /uploads/presign`, `POST /settings/carer-pin`, carer CRUD.

### UI (design brief)

- Tokens + fonts: wide grotesque display (e.g. Unbounded/Sora) + tabular mono (JetBrains Mono / IBM Plex Mono) for all times; radial gold glow background.
- Parent web: 3 columns — care-team sidebar (members, carers, who's active), central meal-trial breakdown with chip matrices (texture × temperature × distraction), right glowing vertical timeline that pulses on new-entry events (SSE/poll).
- Fast meal form: sticky chip rows (big tap targets), defaults = last used + "now", food autocomplete, attempt-no auto-computed from history, single submit; target ≤6 taps.
- Quick-log (carer) screen: 5 big buttons (meal-lite, sleep, nappy, milk, moment), no nav to anything else; also usable by parents.
- Charts: Recharts/visx — intake by texture, acceptance by temperature/time-of-day, sleep bars, nappy counts, milestone timeline; day/week/month/all ranges. Follow `dataviz` skill palette rules in dark theme.
- Print: `/report/[id]` print-CSS page (light, high-contrast) + server-generated PDF stored in R2.

### AI pattern spotting

1. **Deterministic first** (`packages/analysis`): SQL aggregates — acceptance rate (swallowed/reached for more vs refused/gagged) by texture, temperature, hour bucket, setting, distraction, attempt number, prior-sleep gap, with n and confidence (min-sample thresholds, Wilson interval).
2. **LLM narration** via Vercel AI Gateway (`ai` SDK, `model: "provider/model"` string, `AI_GATEWAY_API_KEY` in API env) with `generateObject` + Zod schema → `{ findings[{claim, evidence_stats, n, confidence}], caveats, questions_for_clinician }`. Prompt receives only aggregates + de-identified rows (no names/DOB; age in months). Persist in `insight`. Always show evidence and "not medical advice" caveat; LLM cannot invent numbers (stats passed in, validated against them).
3. Run on demand + nightly cron job (Node `node-cron` / platform scheduler); cache by data-hash.

### Reports

Sections: child summary, eating history table, reaction/texture/temperature breakdown charts, sleep/nappy summary, milestones, identified patterns (with n), date range selector. Render web print view; PDF via headless Chromium (Playwright) on the API or `@react-pdf` — start with browser print CSS + optional PDF.

### Storage (R2)

S3-compatible client (`@aws-sdk/client-s3`) with presigned PUT/GET (short TTL), private bucket, keys `family/{id}/child/{id}/...`. Used for meal photos (optional) and report PDFs.

### Mobile specifics

Expo: offline queue (MMKV/SQLite) of pending entries with `client_id` → replay when online; haptics on log; large thumb-zone controls; dark theme matching tokens.

## Step 4 — Scale, bottlenecks, risks (primer lens)

- Scale is tiny: single Postgres, connection pool (`pg` Pool / pgBouncer if hosted), no sharding/replication needed; managed Postgres with PITR backups is the real availability story (CAP: favour consistency; offline queue gives eventual consistency for writes).
- Caching: none initially; HTTP caching for static; memoize insights by data hash. Add read-model/materialized views only if charts get slow after years of data.
- Async: report generation and AI run as background jobs (in-process queue → pg-boss on the same Postgres if needed), never in the request path.
- Security: TLS at proxy, HSTS, CORS locked to web origin, secure cookies, rate limiting on auth/PIN, Argon2 hashing, Zod on every input, row-level family scoping in every query (single `scopeToFamily` helper), audit log, no PII to LLM, secrets via env, R2 private.
- Privacy/compliance: UK child health data → data minimisation, export + delete-all, retention policy.
- Risks: PIN shared by many people (mitigate with carer names, rotation, rate limit, audit); LLM over-claiming causality from small n (mitigate with thresholds + disclosure); Turborepo/Next 16/TS 7 are new versions — read installed docs (`node_modules/turbo/docs`) before editing `turbo.json`.

## CI/CD

- **GitHub Actions**, Turbo remote cache; jobs on PR: install (pnpm, frozen lockfile) → `ultracite check` → `check-types` → unit/integration tests (Postgres service container) → `build` → Playwright E2E (web+api) → `infisical scan` + gitleaks.
- **Security jobs**: `pnpm audit --prod` (fail on high/critical), Dependabot/Renovate (grouped weekly, auto-merge patch/dev), CodeQL (JS/TS), `actions/dependency-review-action`, OSV-Scanner on lockfile; pinned action SHAs; least-privilege `GITHUB_TOKEN`; npm provenance not needed (private).
- **Deploy** (on `main`): web → Vercel (preview per PR); API → container image (Dockerfile, multi-stage, non-root) to Fly.io/Railway with `db:migrate` as a release step (forward-only, expand/contract migrations); mobile → EAS Build/Update (preview channel per PR, prod on tag). Secrets come from Infisical (GitHub Action `Infisical/secrets-action` w/ OIDC, no long-lived tokens in GitHub). Environments: preview/staging/prod, prod requires approval; rollback = redeploy previous image + EAS rollback; DB backups (PITR) verified by a restore drill.
- Observability: Sentry (web, api, mobile; PII scrubbing on, no entry contents), structured JSON logs (pino) with request id, `/healthz` + `/readyz`, uptime check.

## Analytics (privacy-first — children's health data)

- **Product analytics**: PostHog (EU cloud or self-host), cookieless/memory persistence, **no entry content, names, notes, or child data ever sent** — only event names + coarse props (e.g. `entry_logged{kind}`, `report_generated`, duration-to-log). Autocapture off; respects Do-Not-Track; no analytics at all on the carer quick-log screen. Opt-out toggle in parent settings.
- **Care analytics** (the app's own insights) stay in Postgres/Analysis package — never routed through third-party analytics.
- Metrics that matter: time-to-log (<30 s target), logging completeness per day, carer adoption, API p95, error rate.

## Security (application, dependencies, headers, geo, rate limiting)

- **Application**: Zod validation on every route/body/query; family-scoped queries via one `scopeToFamily` helper + authz table-tests; parameterized SQL only (Drizzle); output encoding (React) + no `dangerouslySetInnerHTML`; CSRF: SameSite=Lax cookies + Better Auth origin checks, bearer tokens for mobile; secure/HttpOnly cookies; session rotation on login, revoke-all on password/PIN change; passkey/TOTP for parents; account-enumeration-safe auth errors; upload validation (type/size/magic bytes, presigned with content-length limits, private bucket); LLM-input sanitisation (notes treated as data, prompt-injection-safe schema output); audit log; field-level encryption for free-text notes (app-level key from Infisical) as optional hardening; data export + delete-all.
- **Dependencies**: lockfile committed, `pnpm audit` + OSV in CI, Renovate/Dependabot, minimal deps, `pnpm` `minimumReleaseAge`/ignore-scripts allowlist (supply-chain), SBOM (CycloneDX) per release, container image scan (Trivy).
- **Headers**: Next `next.config` + Hono `secureHeaders()`: strict CSP (nonce-based, no inline/eval, `connect-src` limited to API, `frame-ancestors 'none'`), HSTS (preload), `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (deny camera/mic/geo), COOP/CORP, `Cache-Control: no-store` on authenticated pages/API; CORS allow-list = web origin only. Verify with securityheaders.com / Mozilla Observatory in CI.
- **Rate limiting**: layered — edge/proxy (Cloudflare in front of API & web: WAF managed rules, bot fight) + app-level limiter in Hono (`hono-rate-limiter` with Postgres/Redis store; Upstash Redis if multi-instance). Buckets: login 5/min/IP+email, **carer PIN 5 attempts → exponential lockout per IP and per family**, signup/password-reset 3/hr, `POST /entries` 120/min/user, AI `insights/run` 5/hr/family, report generation 10/hr. Return 429 + `Retry-After`; `trust proxy` configured correctly for real client IP.
- **IP geolocation**: used for **security signals only** — resolve country/ASN from Cloudflare `CF-IPCountry` header (no third-party lookup, no storage of raw IP beyond 30 days; hash+truncate for logs). Features: flag/alert parents on carer-PIN login or parent login from a new country (email notice + session list showing coarse location), optional country allow-list (default UK ± travel mode), block high-risk ASNs/Tor on auth endpoints via WAF rules. Never used for analytics/profiling; documented in privacy notice (GDPR/UK GDPR legitimate interest).

## Internationalisation (multiple languages)

- Why: grandparents/carers/family may use other languages. Languages v1: **English (en-GB) default**, structure ready for more (e.g. Polish, Urdu/RTL, Spanish, Welsh) — final list to confirm.
- Web: `next-intl` with `[locale]` routing, ICU messages, per-user `locale` stored on profile, carer quick-log has a visible language switcher (stored on device). Mobile: `expo-localization` + `i18next`/`react-i18next` sharing the **same message catalogs** from `packages/i18n` (JSON per locale, typed keys, missing-key CI check).
- Domain vocabulary (textures, reactions, settings) are stored as **language-neutral enum codes** in the DB and `packages/shared`; labels come only from catalogs — so reports/analytics are language-independent. Free-text notes stay as written (store `lang` hint; optionally AI-translate on read in reports).
- Formatting via `Intl` (dates, 24h tabular times, ml/oz unit preference, kg/lb), RTL via logical CSS properties (Tailwind logical utilities) and `dir` attribute. Reports render in the viewer's chosen language (clinician copy can be forced to English). AI insights prompted with target locale. Ultracite/CI check for hard-coded strings (lint rule or `i18n-check`).

## Starting point: what exists now → what it becomes

Fresh `create-turbo` commit (only commit, clean tree): pnpm 11 workspace (`apps/*`, `packages/*`), Turbo 2.11 (`build/lint/check-types/dev` tasks), TypeScript 7, Node ≥24, React 19.2 / Next 16.3. Everything is boilerplate; nothing worth preserving but the wiring.

| Existing | Action |
| --- | --- |
| `apps/web` (Next 16, port 3000, default template page, Geist fonts, `@repo/ui` Button) | **Keep & evolve** as the parent dashboard + carer quick-log + print report. Replace template `page.tsx`/`page.module.css`/`layout.tsx` metadata, delete `public/*.svg` template assets, swap Geist for display grotesque + tabular mono (via `next/font`), add Midnight Sanctuary tokens in `globals.css`. |
| `apps/docs` (Next, port 3001, same template) | **Delete** (YAGNI); revisit if a public/help site is wanted. Remove from lockfile. |
| `packages/ui` (`button`, `card`, `code`; exports `./*` → `src/*.tsx`) | **Keep** the export pattern; delete `code`/template `card`, rebuild primitives (Chip, ChipMatrix, TimelineRail, StatTile, Button) here. Becomes web-only; Expo gets its own RN components but shares tokens from a new `packages/tokens` (plain TS/JSON colours, spacing, type scale). |
| `packages/typescript-config` (`base`, `nextjs`, `react-library`) | **Keep**; add `node.json` (for `apps/api`, `packages/db`, `packages/shared`) and `expo.json`. Note `base.json` uses `NodeNext` — fine for Hono/Node, libs need `.js` import suffixes or switch to `Bundler`. |
| `packages/eslint-config` + per-app `eslint.config.js`, `eslint`, `prettier` | **Replace by Ultracite/Biome** in M0 (delete the package, per-app configs, eslint deps; root `lint`/`format` scripts + `biome.jsonc`). Do this as the _first commit_ so all new code is born formatted. |
| `turbo.json` | **Extend**: add `test`, `db:generate`/`db:migrate` (cache:false), `dev` for api/web/mobile, `env`/`globalEnv` keys (strict env mode), outputs for `apps/api/dist`. Read installed docs first: `node -p "require.resolve('turbo/package.json')"` → `docs/` (AGENTS.md rule). |
| root `package.json` (`prettier`, `format` script) | Update scripts for Ultracite; add `vitest`, `tsx`. |
| `.gitignore` (already ignores `.env*`, `.next`, `.turbo`, `dist`) | **Keep**; add `.expo`, `.infisical` caches (commit `.infisical.json`), `*.tsbuildinfo`. |

Net new workspaces: `apps/api`, `apps/mobile`, `packages/db`, `packages/shared`, `packages/tokens`, (`packages/analysis` folded into `packages/shared` or `apps/api` until needed, per review). Because `pnpm-workspace.yaml` globs already cover `apps/*`/`packages/*`, no workspace config change is needed.

**Migration sequence (M0, each step = one commit, build stays green):**

1. Remove `apps/docs`; `pnpm install`.
2. Add Ultracite; delete `packages/eslint-config` + ESLint config/deps; run `ultracite fix`; `pnpm lint/check-types/build` green.
3. Strip web template (page, css module, public svgs, metadata); add tokens + fonts + empty 3-column shell; app still builds.
4. Add `packages/tokens`, `packages/shared`, `packages/db` (+ docker-compose Postgres, Drizzle config), `apps/api` (Hono hello + `/healthz`) wired into turbo; web calls API via `hono/client`.
5. Add Infisical (`.infisical.json`, wrapped `dev` scripts, `.env.example`), GitHub Actions CI, deploy skeleton.
6. Only then start M1 (schema/auth). `apps/mobile` (Expo) is created at M9 via `create-expo-app` into `apps/mobile` — pnpm+Expo needs `node-linker=hoisted` or Metro config for monorepos; check `.npmrc` (currently empty/default) at that time.

## Amendments from Plan-agent review against the System Design Primer

Your stack/tooling choices (Expo, Hono, Infisical, Ultracite, geo, i18n) are kept; the review's real gaps are adopted. Items it flagged as over-scoped are **phased later** rather than dropped.

- **Offline sync contract (define in M3, before any client)**: client generates UUIDv7 `client_id` at tap time; `POST /entries` replay returns the existing row (200, never 409). `occurred_at` is client time, `created_at` server time; reject far-future. `entry.version` + `PATCH` with `If-Match` (412 returns server copy). Carers are add-only ⇒ their queue is conflict-free append. Queue: persisted FIFO, backoff, visible "N pending" badge, dead-letter on 4xx, keep queue on 401 and re-auth. Consistency stated plainly: CP at the server (single Postgres), eventually consistent at clients (AP write path). Test: replay N times and kill-mid-request ⇒ 1 row.
- **Carer gate hardening**: shared family PIN unlocks a _device_; carer picks a parent-created named profile; server-side `carer_session(id, carer_id, family_id, pin_version, expires_at, revoked_at)` with opaque tokens, 30-day sliding expiry per registered device (survives offline queues); PIN rotation bumps `pin_version`. Join/family code ≥10 random chars; lockout is per-device+IP with backoff (not per-family, avoids DoS lockout of real carers); parents notified and can unlock. State explicitly: carer attribution is by selected profile (honour-system), carers can read "today" summary. Option to upgrade to per-carer PINs later.
- **Data model**: add `family_id` to every tenant table with composite FK `(child_id, family_id)` (+ optionally Postgres RLS); CHECK/trigger that each `kind` has its matching detail row; `entry.tz` (IANA) + UTC times, day buckets computed in child's tz; `sleep` as interval with nullable `end` (running timer) + overlap check; versioned vocabularies for `reaction`/`amount`/units; `entry_audit(entry_id, actor_type, actor_id, action, before jsonb, after jsonb, at)` written in same transaction; `job/ai_run(status, input_hash, model, prompt_version, cost, error)`.
- **Auth**: parent account recovery (email reset via Resend) + parent session/device list with revoke; carer login errors enumeration-safe. Cookie/origin decision: web and API on one apex (`app.` / `api.`) or Next proxies `/api` — pick one in M0. Only the API touches Postgres (Next never connects to DB).
- **Geo/rate-limit trust**: `CF-IPCountry` only trusted if API origin is locked to Cloudflare (authenticated origin pulls / IP allow-list); geo is a _signal_ (coarse country in session list, new-country alert), not a gate. In-memory/Postgres limiter first (single instance); Redis only if scaling out. Scheduled jobs must not rely on `node-cron` on scale-to-zero hosts → use the host scheduler or a `job` row.
- **Insights validity**: deterministic stats are the product; LLM is optional narration, shipped last. Multiple-comparison guard (min n per cell, show top effects + raw counts, effect sizes). LLM output cites `stat_id` keys and cannot emit numbers; validator rejects any finding whose figures aren't in the supplied aggregates. Never send free-text notes. Static (non-model) medical caveat. Token/cost cap; model + prompt version recorded.
- **Reports**: print-CSS first (shared stats functions with dashboard); PDF in R2 later with 7-day TTL and 5-min presigned GETs.
- **Ops**: state RPO ≤24 h / RTO ≤1 day; do one **restore drill before real child data goes in**; polling (not SSE) for the timeline pulse; staging-like walking skeleton deployed early; threat model (curious carer, lost carer device, stolen parent session, outsider with family code) + 1-page UK-GDPR DPIA-lite + incident note.
- **Phasing to control scope**: i18n = externalised strings, typed catalogs, enum codes, `Intl`, logical CSS from the very first UI, English shipped first, extra languages/RTL when real. PostHog consent/no-content rules apply (carer screen has none). WAF/ASN blocking, SBOM/Trivy, field-level note encryption, PDF-in-R2, Playwright matrix = later hardening, not v1.

## Delivery order (milestones) — REVISED ORDER (supersedes list below where they differ)

M0 repo builds, minimal CI (Ultracite check, types, tests, Postgres service), Infisical + `.env.example`, docker Postgres, deployed walking skeleton (web+API), cookie/origin decision → M1 schema (amended), parent auth + recovery, family/child bootstrap, authz-matrix test → M2 entries CRUD, audit, idempotency + versioning, seed generator → M3 carer profiles/PIN/sessions, quick-log, sync contract + web offline queue → M4 parent dashboard (3-column), meal form, timeline (polling), i18n-ready strings → M5 shared stats layer + charts → M6 print report, headers/CSP (report-only→enforce), rate limits, backup + restore drill, privacy notice → **go live with real data** → M7 deterministic pattern findings → M8 AI Gateway narration + validator → M9 Expo app (reusing M3 sync contract), extra languages, geo alerts, PDF reports, analytics.

## Original milestone notes (detail)

0. **Tooling**: swap ESLint/Prettier for Ultracite; set up Infisical project, envs, `.env.example`, wrapped dev scripts, `infisical scan` hook.
1. **Foundations**: `packages/db`, `packages/shared`, `apps/api` skeleton (Hono + Better Auth + health), docker-compose Postgres, env handling, turbo tasks (`dev`, `db:migrate`).
2. **Auth & roles**: parent signup/login, family/child bootstrap, carer PIN + names + middleware + rate limit; tests.
3. **Entries**: schema + CRUD + idempotency + audit; shared Zod; seed data generator (realistic 3 months).
4. **Web parent UI**: theme/tokens, 3-column dashboard, meal form, quick-log, timeline w/ pulse.
5. **Charts & timelines**.
6. **Analysis**: stats engine → AI Gateway insights.
7. **Reports**: print view + R2 PDF.
8. **Expo app**: auth, quick-log, offline queue, parity of logging flows. 8b. **i18n pass** (`packages/i18n`, next-intl, mobile i18next) — ideally wired from milestone 4 onward so no hard-coded strings accumulate. 8c. **CI/CD + observability + analytics** (GitHub Actions, Sentry, PostHog) — start CI basics in milestone 0, finish here.
9. **Hardening** (headers/CSP, rate-limit tuning, geo alerts, dependency/image scans, pen-test checklist): security review, backups, deploy (API on Fly/Railway Node; web on Vercel; R2), docs.

## Critical files (new unless noted)

`apps/api/src/{index,app,routes/*,middleware/{auth,carer,family}.ts,lib/{r2,ai}.ts}`, `packages/db/src/{schema/*,client}.ts`, `packages/shared/src/*`, `packages/analysis/src/*`, `apps/web/app/(parent)/**`, `apps/web/app/quick-log/**`, `apps/web/app/report/**`, `apps/mobile/app/**`, `packages/ui/src/*` (extend), `turbo.json` & root `package.json` (modify), `pnpm-workspace.yaml` (existing globs already cover new apps/packages).

## Verification

- `pnpm check-types && pnpm lint (ultracite check) && pnpm build` via turbo green; `pnpm dev` boots api+web with secrets injected by `infisical run` and no local `.env` files; `infisical scan` finds no leaks.
- Unit tests (Vitest): analysis stats, PIN gate (carer cannot hit parent routes — table-driven authz test), idempotent POST, family scoping.
- Integration: API against a real Postgres (docker) — signup → create child → carer login → add entry attributed to carer → parent sees it, carer cannot read analytics/edit.
- E2E (Playwright via browser pane): log a meal in <30 s, timeline pulses, charts render with seed data, generate report and print preview.
- Mobile: Expo on emulator — offline log then reconnect syncs once (no duplicates).
- AI: run insights on seed data; verify every finding's numbers match stats.
- Security: header scan (Mozilla Observatory ≥ A), rate-limit tests (6th PIN attempt → 429/lockout), authz matrix tests, `pnpm audit`/OSV clean, geo-alert fires on spoofed `CF-IPCountry` in test.
- i18n: switch locale on web+mobile, no missing keys (CI check), RTL snapshot renders correctly, report prints in chosen language.
- CI: open a PR → all jobs green, preview deploys, secrets pulled via Infisical OIDC only.
- Manual: R2 presigned upload/download; PIN rotation invalidates carer session.
