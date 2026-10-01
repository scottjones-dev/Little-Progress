# infra/storage

Local S3-compatible object storage for development, using [Floci](https://floci.io) (an AWS emulator).

## Why it exists

Photos and report PDFs go to S3 or Cloudflare R2 in production. Locally we use Floci so no cloud account is needed, and the same code path runs everywhere.

## Use it

```bash
pnpm infra:storage:up     # start (or pnpm infra:up for Postgres + storage)
pnpm storage:init         # create the bucket, CORS and lifecycle rule
pnpm infra:storage:down   # stop (data kept in the floci-data volume)
```

| Service                                  | URL                     |
| ---------------------------------------- | ----------------------- |
| S3 API                                   | <http://localhost:4566> |
| Floci web UI (browse and create buckets) | <http://localhost:4500> |

Dev credentials (`test` / `test`), endpoint and bucket are stored in Infisical `dev` under `/api` as `S3_*`.

## Tests

`pnpm --filter @repo/storage test:integration` runs against this container. Floci does not verify request signatures, so tampered or expired URLs can only be tested against a real R2 bucket.

## Depends on / used by

Needs Docker. Used by `packages/storage` (and later `apps/api`).
