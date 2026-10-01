# @repo/errors

The error shape every API response uses, and the privacy rules every Sentry setup shares.

## Why it exists

Users should see calm, predictable errors, and we should find out about real failures. This is a child's health diary, so nothing personal may reach Sentry. The API, web and native apps each need their own Sentry init files, but the rules must be identical, so they live here once. This package has no Sentry dependency.

## What's inside

| Import | What it gives you |
| --- | --- |
| `@repo/errors/codes` | `errorCodeNames`, `ErrorCode`, `statusByCode` (the HTTP status of each code) |
| `@repo/errors/app-error` | `AppError`, `errorBodySchema` (Zod), `toErrorBody()` |
| `@repo/errors/scrub` | `scrubEvent`, `scrubBreadcrumb`, `scrubUrl` |
| `@repo/errors/options` | `baseSentryOptions({ dsn, environment, release })` |

## Use it

```ts
// API handler: an error we expect and can explain.
throw new AppError("NOT_FOUND", "Child not found");

// Sentry init in any app. No DSN means nothing is sent.
Sentry.init(baseSentryOptions({ dsn, environment }));
```

Anything that is not an `AppError` is treated as a bug: it is reported and the client sees a generic message. See `docs/error-handling.md` for the full picture.

## Tests

`pnpm --filter @repo/errors test` (scrubbing, `AppError`, response body, default options). No network.

## Depends on / used by

Depends on `zod`. Used by `apps/api`, `apps/web` and `apps/native`.
