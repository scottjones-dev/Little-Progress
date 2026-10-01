# @repo/api

The Hono HTTP API (Node). The only service that talks to Postgres, storage and, later, email and AI.

## Why it exists

Web and native share one backend that owns authorisation, validation and data access. It exports `AppType` so clients get end-to-end types through Hono's typed client.

## Routes

| Route | Description |
| --- | --- |
| `GET /api` | app name |
| `GET /api/healthz` | liveness check |
| `ALL /api/novu` | Novu bridge: Novu calls it to run notification workflows (503 until `NOVU_SECRET_KEY` is set) |

Secure headers are on and CORS is limited to `WEB_ORIGIN`. Auth, entries, uploads and reports are planned (see `docs/plan.md`).

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

Depends on `@repo/config`, `@repo/env`, `hono`, `@hono/node-server`. Called by `apps/web` and `apps/native`.
