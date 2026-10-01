# Todos

Running list of work that is planned but not done yet. Full plan: `docs/plan.md`.

## Storage (`packages/storage`)

Done / in progress

- [x] Spike: Floci (S3 emulator) supports presigned PUT/GET and bucket CORS; UI at `:4500`
- [x] `infra/storage/docker-compose.yml` (Floci `:4566`, Floci UI `:4500`)
- [x] `packages/storage` source: `shared`, `server` (S3 provider), `client`
- [x] `@repo/env/storage` (`S3_*`, `STORAGE_DRIVER`), R2-specific keys removed
- [x] Install, lint and type-check `packages/storage`
- [x] Vitest unit tests (22): `buildKey`, `presignRequestSchema`, `validateFile`, `uploadToPresignedUrl`, S3 provider presigning and `head`
- [x] Vitest integration tests against Floci (4): presigned PUT then HEAD/GET round trip, server-side put/delete, missing object, CORS allow/deny (`pnpm test:integration`)
- [x] `attachment` migration generated and applied
- [x] Dev S3 secrets in Infisical `/api` (dev); `pnpm storage:init` run against Floci
- [x] Fix found by tests: presigned PUT now signs `Content-Type` (was only `Content-Length`)
- [x] Commit

Later

- [ ] API routes: `POST /api/uploads/presign`, `POST /api/uploads/:id/complete`, `GET /api/attachments/:id/url` (needs auth + family scoping)
- [ ] UI: photo picker on the meal entry form, upload progress, attachment thumbnails (needs entry form + auth first)
- [ ] E2E (Playwright): upload from `localhost:3000` (CORS ok), carer can only add to own entries, other family's attachment is 403/404, web bundle contains no `@aws-sdk/*`
- [ ] Run the same integration tests against a real Cloudflare R2 dev bucket (Floci does not verify signatures, so tampered/expired URLs can only be tested there)
- [ ] Production R2 bucket: CORS, lifecycle rule for pending uploads, 7-day expiry for report PDFs
- [ ] Azure Blob adapter behind `StorageProvider` (only if needed; Floci has an Azure emulator on `:4577`)

## Emails (`packages/emails`)

Done

- [x] React Email + Tailwind package, preview on `http://localhost:5000` (runs under `pnpm dev`)
- [x] 5 components (`layout`, `header`, `footer`, `button`, `callout`) using brand tokens from `packages/config/src/app.ts`
- [x] 5 templates: `verify-email`, `reset-password`, `magic-link`, `password-changed`, `new-location-sign-in`
- [x] Registry + `renderEmail()` (html, plain text, subject); `pnpm --filter @repo/emails build` emits `dist/html`, `dist/text`, `dist/manifest.json` with `{{variable}}` tokens (`EMAIL_TOKEN_PREFIX=payload.` for Novu)
- [x] Vitest (23 tests): renders, branding, footer links, no rem units, token variables, build output

Later

- [ ] Notification layer: moved to `packages/notifications` (see below)
- [ ] New templates for auth: `account-locked`, `two-factor-changed`, optionally `passkey-changed` and `account-linked` (`magic-link` is unused, decide whether to keep it)
- [ ] Real logo image in the header (`app.logos.mark` as absolute URL) once the asset exists
- [ ] Translate email copy with the rest of the i18n work (strings are en-GB only for now)
- [ ] Test in real clients (Gmail, Outlook, Apple Mail, dark mode) via the preview Compatibility panel or an email tester; add a light variant if dark renders badly
- [ ] Templates for care notifications (family invite, report ready, weekly summary) when those features exist
- [ ] Playwright check that every template renders at `localhost:5000` (desktop + 375px)

## Notifications (`packages/notifications`)

Delivery layer on Novu. Auth and other features call a typed `notify()`; they never import Novu or `@repo/emails`. Design in `docs/auth.md` section 5.

Done

- [x] Package scaffolded under `src/` with README
- [x] `@repo/env/notifications` (`NOVU_SECRET_KEY` optional in dev, `NOVU_REGION` default `eu`)
- [x] Decided: code-first workflows (Novu Framework + Hono bridge at `/api/novu`), Novu Cloud EU
- [x] Typed `notify(eventId, { to, payload, idempotencyKey })`; never throws, never logs payloads
- [x] One event catalog (`events.ts`) and one generic workflow builder; 5 events (`magic-link` unused)
- [x] Security and account workflows critical (read-only preferences); push for `password-changed` and `new-location-sign-in`
- [x] Expo device token helpers (`registerDevice` / `unregisterDevice`)
- [x] Vitest (35 tests): catalog vs templates, validation, notify behaviour, workflow definitions, bridge 503, devices

To do

- [x] Novu is on the **EU** account: the EU key is in Infisical dev with `NOVU_REGION=eu` (an earlier US key and a stale API process caused "API Key not found" and "Signature does not match")
- [x] All 8 workflows are registered in the EU account (via `novu sync` through the tunnel); a trigger is accepted and the email job runs
- [x] The Novu tunnel now runs under `pnpm dev` (`@repo/notifications#dev`) and follows `NOVU_REGION` for the dashboard
- [ ] **You:** in the Novu dashboard connect the Resend (email) and Expo Push integrations
- [ ] Dev sync: the tunnel URL changes on every `pnpm dev`, and Novu keeps the bridge URL from the last sync. Until it is automated (parse the tunnel URL in `src/scripts/dev.ts` and run `novu sync`), open the dashboard once per session with `pnpm --filter @repo/notifications studio` or run `novu sync --bridge-url <tunnel> --api-url https://eu.api.novu.co`
- [ ] Live test: `pnpm dev`, trigger `verify-email`, confirm the email arrives rendered by `@repo/emails`
- [ ] Production: public API URL for `/api/novu`, `novu sync`, separate prod Novu environment and key
- [x] Events and templates added: `two-factor-changed`, `delete-account`, `family-invite`
- [ ] Optional later: `passkey-changed`, `account-linked`; `new-location-sign-in` needs a documented hook (not wired); `magic-link` is unused
- [ ] SMS: choose a provider, add the Novu integration, add an `sms` field to the catalog and a `step.sms` in `workflows.ts`
- [ ] Expo app: ask for push permission, get the Expo token (`expo-notifications`), call `POST /api/devices` (API route behind auth, not built yet)
- [ ] Wire Better Auth callbacks to `notify` (see Auth below)
- [ ] Privacy notice: Novu stores recipient emails and payloads (EU region chosen)

## Auth (`docs/auth.md`, client side in `docs/auth-client.md`)

Server side (`packages/auth`, built to the Better Auth docs):

- [x] Better Auth installed; schema generated with `pnpm auth:generate`; migrations applied
- [x] Handler mounted in `apps/api` at `/api/auth/*`; session middleware; `GET /api/me`
- [x] Email and password with required verification, reset, change password, "password changed" email on both paths
- [x] Rate limit (database storage, 5 sign-in attempts a minute, Cloudflare IP header) and session settings (7 days, 15 minute fresh age)
- [x] 2FA (TOTP, backup codes, trusted devices) with the plugin's own lockout; `two-factor-changed` email
- [x] Google and Microsoft sign-in with account linking and encrypted provider tokens (turn on when credentials are set)
- [x] Passkeys, Expo server plugin, last login method (database only)
- [x] Organization plugin as the family: owner/admin roles, 7-day invitations, one family per parent, carer PIN fields on the organization
- [x] Delete account with email confirmation; a family with no parents left is deleted with its data
- [x] `family` table replaced by the organization; `child`, `carer`, `food`, `entry`, `attachment` reference `organization.id`
- [x] Docs: `auth.md` rewritten, `auth-client.md` written, `user-flows.md` updated
- [x] Google and Microsoft credentials are in Infisical `dev /api`; both providers answer with a real sign-in redirect
- [ ] **You:** add the same redirect URIs for staging and production in both consoles and the production credentials to those Infisical environments (URIs in `auth.md` section 10); settle the production domain for `PASSKEY_RP_ID`
- [ ] **You:** replace the invalid `NOVU_SECRET_KEY` ("API Key not found") so auth emails actually send
- [ ] Tests for the server (list in `auth.md` section 12), then a CI job for them
- [ ] Verify the delete-account flow end to end once emails send (the family cleanup query itself is checked)
- [ ] Apple sign-in once the Apple Developer account is paid; decide Apple relay emails vs `allowDifferentEmails`
- [ ] New-location sign-in email (needs a country source and stored countries; no documented hook)
- [ ] Decide: require 2FA for parents; show the sign-in "last used" badge (needs the consent decision and a cookie)
- [ ] Write the lost-2FA support process before launch
- [ ] Optional later: email OTP (6-digit code in `verify-email`), i18n plugin (`@better-auth/i18n`), openAPI reference, test utils plugin, Facebook
- [ ] Maybe later, if the project is sold or monetised: Stripe (Better Auth Stripe plugin)

Client side (documentation in `auth-client.md`, screens not built):

- [ ] Decide cookie/origin setup: Next proxy (recommended) or subdomains
- [ ] `auth-client.ts` in `apps/web` and `apps/native` with the plugins listed in `auth-client.md`
- [ ] Screens: sign-up, verify, sign-in (+ 2FA code, passkey autofill), forgot/reset, onboarding (family, child), accept invitation
- [ ] Settings screens: security (password, sessions, linked accounts, passkeys, 2FA), family (members, invites), delete account
- [ ] Message catalog keys for every auth error (401, 403, 429 with `X-Retry-After`, `ACCOUNT_TEMPORARILY_LOCKED`)
- [ ] Expo: secure store, deep-link scheme, social sign-in via deep link, authenticated fetch with `getCookie()`

## Error handling and Sentry (`docs/error-handling.md`)

- [x] `packages/errors`: error shape, scrubbing, shared options; wired into api, web and native
- [x] Sentry EU organization and three projects (`little-progress-server`, `-web`, `-mobile`); DSNs in Infisical dev
- [ ] Add the DSNs to Infisical staging and prod when those environments exist
- [x] Sentry auth token, org and project are in Infisical dev `/web`
- [ ] Enable `@sentry/cli` in `pnpm-workspace.yaml` `allowBuilds` for EAS builds
- [ ] Set `SENTRY_RELEASE` to the git SHA in CI
- [ ] Create alert rules: new production issue, API error-rate spike, weekly digest
- [x] Proved capture with real DSNs on api, web and native (debug route, `/debug` page, native test buttons)
- [ ] Use `AppError` in the real routes as they are added (entries, uploads, reports)

## User flows (`docs/user-flows.md`)

- [x] Write flows for parent onboarding, carer quick-log, parent daily use, reports and insights
- [ ] Review the open questions in section 10 and settle them
- [x] Family and invites now use Better Auth organizations (see `auth.md` 4.9); `user-flows.md` updated
- [ ] Add `POST /children` and the carer routes to `docs/plan.md`, and note in its data model that `family` is now the Better Auth `organization`
- [ ] Wireframes for each screen in a `.pen` file

## Testing infrastructure

- [x] Vitest added to `packages/storage` with `test` and `test:integration` scripts, plus root `pnpm test` / `pnpm test:integration` via turbo
- [ ] Add Vitest to the other packages as they gain logic (`apps/api`, `packages/db`)
- [ ] Add Playwright for E2E (web + api), run via the Browser pane locally
- [ ] CI job: Postgres + Floci service containers, run unit + integration tests

## Other

- [ ] `packages/shared` skipped for now: enum lists live in `@repo/db/vocab`, request shapes come from the Hono typed client
- [ ] Carer PIN gate, entries API, parent dashboard UI (see `docs/plan.md` M1 to M4); auth is covered in the Auth section
