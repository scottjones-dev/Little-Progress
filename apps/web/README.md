# @repo/web

The Next.js web app: parent dashboard, carer quick-log and printable reports.

## Why it exists

The main way parents (and carers on a nursery tablet) use the diary in a browser. Currently a placeholder page that shows the app name; the real UI comes with auth and the entry form.

## Run it

```bash
pnpm dev                          # whole repo; web on http://localhost:3000
pnpm --filter @repo/web dev       # web only (secrets via Infisical /web)
pnpm --filter @repo/web dev:local # without Infisical
pnpm --filter @repo/web build
```

Code lives under `src/app`. Name and description come from `@repo/config/app`; env from `@repo/env/web`.

## Tests

`pnpm --filter @repo/web check-types`. No component or E2E tests yet (Playwright is planned, see `docs/todos.md`).

## Depends on / used by

Depends on `@repo/config`, `@repo/env`, Next.js, Tailwind. Talks to `apps/api`. shadcn/ui will be added when the UI is built.
