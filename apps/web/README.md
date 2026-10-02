# @repo/web

The Next.js web app: parent dashboard, carer quick-log and printable reports.

## Why it exists

The main way parents (and carers on a nursery tablet) use the diary in a browser. Currently a placeholder page that shows the app name; the real UI comes with auth and the entry form.

## Run it

```bash
pnpm dev                          # whole repo; web on http://localhost:3000
pnpm --filter @repo/web dev       # web only (secrets via Infisical /web)
pnpm --filter @repo/web dev:local # without Infisical: reads the root .env
pnpm --filter @repo/web build
```

Errors are reported to Sentry (`src/instrumentation.ts`, `src/instrumentation-client.ts`, browser events through `/monitoring`) and shown by `error.tsx`, `global-error.tsx` and `not-found.tsx`; see `docs/error-handling.md`. `/debug` (development only) has buttons that throw test errors. Analytics (PostHog EU, through the `/ingest` rewrites in `next.config.ts`) starts from `src/lib/analytics.ts`; see `docs/analytics.md`. Text comes from translation files (`@repo/i18n`): the language is chosen in `src/lib/i18n` (cookie, browser, English) and switched with the language switcher; see `docs/i18n.md`. Code lives under `src/app`. Name and description come from `@repo/config/app`; env from `@repo/env/web`.

## Tests

`pnpm --filter @repo/web check-types`. No component or E2E tests yet (Playwright is planned, see `docs/todos.md`).

## Depends on / used by

Depends on `@repo/i18n`, `react-i18next`, `@repo/analytics`, `posthog-js`, `@repo/config`, `@repo/env`, `@repo/errors`, `@sentry/nextjs`, Next.js, Tailwind. Talks to `apps/api`. shadcn/ui will be added when the UI is built.
