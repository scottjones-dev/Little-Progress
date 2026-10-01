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

## Testing infrastructure

- [x] Vitest added to `packages/storage` with `test` and `test:integration` scripts, plus root `pnpm test` / `pnpm test:integration` via turbo
- [ ] Add Vitest to the other packages as they gain logic (`apps/api`, `packages/db`)
- [ ] Add Playwright for E2E (web + api), run via the Browser pane locally
- [ ] CI job: Postgres + Floci service containers, run unit + integration tests

## Other

- [ ] `packages/shared` skipped for now: enum lists live in `@repo/db/vocab`, request shapes come from the Hono typed client
- [ ] Auth (Better Auth), carer PIN gate, entries API, parent dashboard UI (see `docs/plan.md` M1 to M4)
