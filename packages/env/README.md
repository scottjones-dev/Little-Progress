# @repo/env

Typed, validated environment variables for each runtime.

## Why it exists

Bad or missing config should fail at startup with a clear message, not deep inside a request. Each runtime gets its own schema so secrets never leak into client bundles.

## What's inside

| Import | Used by | Variables |
| --- | --- | --- |
| `@repo/env/api` | `apps/api` | `PORT`, `WEB_ORIGIN`, `NODE_ENV`, `DATABASE_URL`, auth secrets, `AI_GATEWAY_API_KEY` |
| `@repo/env/db` | `packages/db` | `DATABASE_URL` (required) |
| `@repo/env/storage` | `packages/storage` | `S3_*`, `STORAGE_DRIVER` (required keys) |
| `@repo/env/notifications` | `packages/notifications` | `NOVU_SECRET_KEY` (optional in dev), `NOVU_REGION` |
| `@repo/env/web` | `apps/web` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL` |
| `@repo/env/native` | `apps/native` | `EXPO_PUBLIC_API_URL` |

Defaults come from `@repo/config` so the apps still run with no secrets set. Real values live in Infisical (folders `/api`, `/web`, `/native`); `.env.example` at the repo root lists the key names. Set `SKIP_ENV_VALIDATION=1` to skip validation (CI builds).

## Use it

```ts
import { env } from "@repo/env/api";

console.log(env.PORT);
```

## Tests

`pnpm --filter @repo/env check-types`. Validation is exercised by the apps that import it (for example the API refuses to start on a bad `PORT`).

## Depends on / used by

Depends on `@repo/config`, `@t3-oss/env-core`, `@t3-oss/env-nextjs`, `zod`. Used by `apps/api`, `apps/web`, `apps/native`, `packages/db`, `packages/storage`, `packages/notifications`.
