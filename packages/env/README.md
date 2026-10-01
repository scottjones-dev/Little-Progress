# @repo/env

Typed, validated environment variables for each runtime.

## Why it exists

Bad or missing config should fail at startup with a clear message, not deep inside a request. Each runtime gets its own schema so secrets never leak into client bundles.

## What's inside

| Import | Used by | Variables |
| --- | --- | --- |
| `@repo/env/api` | `apps/api` | `PORT`, `WEB_ORIGIN`, `NODE_ENV`, `DATABASE_URL`, auth secrets, `AI_GATEWAY_API_KEY` |
| `@repo/env/db` | `packages/db` | `DATABASE_URL` (required) |
| `@repo/env/auth` | `packages/auth` | `BETTER_AUTH_SECRET` (required), `BETTER_AUTH_URL`, `WEB_ORIGIN` |
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

## Seeding Infisical

`src/seed/` fills a fresh Infisical environment with every key above. It lives here because it is the same list of keys the schemas validate. It is not in `exports`, so apps never bundle it.

Log in once (`infisical login`), then:

```bash
pnpm secrets:seed dev              # local development
pnpm secrets:seed prod --dry-run   # show what would be added, change nothing
pnpm secrets:seed prod
```

Environments: `dev`, `staging`, `prod`. Per environment it:

1. Creates the `/api`, `/web` and `/native` folders if missing.
2. Adds any **missing** key it can fill itself. It never overwrites an existing key, so it is safe to re-run.
3. Prints the keys that still need a real value from a vendor dashboard, with where to get them (see `.env.example`).

| Filled automatically | Notes |
| --- | --- |
| `BETTER_AUTH_SECRET`, `CARER_TOKEN_SECRET` | Random, different per key and per environment |
| `NODE_ENV`, `PORT`, `STORAGE_DRIVER`, `S3_REGION`, `S3_FORCE_PATH_STYLE`, `NOVU_REGION` | Defaults (`NODE_ENV=production` outside `dev`) |
| `WEB_ORIGIN`, `NEXT_PUBLIC_*`, `EXPO_PUBLIC_API_URL` | `localhost` URLs, **dev only** |

Left for you in every environment: `DATABASE_URL`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `NOVU_SECRET_KEY`, `AI_GATEWAY_API_KEY`. In `staging` and `prod` the URL keys are manual too.

To push a filled-in root `.env` into Infisical `dev /api`, run `pnpm secrets:push`. It sends **every** key in the file and **overwrites** existing ones, and it only targets `/api`, so keep `NEXT_PUBLIC_*` and `EXPO_PUBLIC_*` keys out of that file (they belong in `/web` and `/native`). Keys with an empty value make it stop with an error.

Generated values reach Infisical through a temporary owner-only file and are never printed. Seeding only fills Infisical. For production, give the deployed API an [Infisical machine identity](https://infisical.com/docs/documentation/platform/identities/universal-auth) and run it with `infisical run --env=prod --path=/api -- ...`, or sync `/web` to Vercel with the [Vercel integration](https://infisical.com/docs/integrations/cloud/vercel). Needs the `infisical` CLI on your PATH.

## Tests

`pnpm --filter @repo/env test` covers the seed plan (`src/seed/plan.ts`). `seed.ts` is thin glue over the `infisical` CLI and is checked with `--dry-run`. `pnpm --filter @repo/env check-types` for types. Validation itself is exercised by the apps that import it (for example the API refuses to start on a bad `PORT`).

## Depends on / used by

Depends on `@repo/config`, `@t3-oss/env-core`, `@t3-oss/env-nextjs`, `zod`. Used by `apps/api`, `apps/web`, `apps/native`, `packages/db`, `packages/storage`, `packages/notifications`, `packages/auth`.
