# @repo/api

The Hono HTTP API (Node). The only service that talks to Postgres, storage and, later, email and AI.

## Why it exists

Web and native share one backend that owns authorisation, validation and data access. It exports `AppType` so clients get end-to-end types through Hono's typed client.

## Routes

| Route | Description |
| --- | --- |
| `GET /api` | app name |
| `GET /api/healthz` | liveness check |
| `GET/POST /api/auth/*` | Better Auth: sign-up, sign-in, verify email, reset and change password (see `packages/auth`) |
| `GET /api/me` | the signed-in user, or 401 |
| `GET /api/_debug/error` | development only: throws on purpose to prove error reporting works |
| `ALL /api/novu` | Novu bridge: Novu calls it to run notification workflows (503 until `NOVU_SECRET_KEY` is set) |

Every response has an `x-request-id`; every error uses the shape from `@repo/errors` and bugs are reported to Sentry (`src/instrument.ts`, see `docs/error-handling.md`). Secure headers are on and CORS is limited to `WEB_ORIGIN`. Auth, entries, uploads and reports are planned (see `docs/plan.md`).

## Run it

```bash
pnpm dev                              # whole repo; API on http://localhost:9000
pnpm --filter @repo/api dev           # API only (secrets via Infisical /api)
pnpm --filter @repo/api dev:local     # without Infisical, defaults only
```

Port, base path and name come from `@repo/config/app`; env is validated by `@repo/env/api`.

## Tests

`pnpm --filter @repo/api check-types`. No handler tests yet; add them with the first real routes.

## Depends on / used by

Depends on `@repo/config`, `@repo/env`, `@repo/errors`, `@sentry/hono`, `hono`, `@hono/node-server`. Called by `apps/web` and `apps/native`.
