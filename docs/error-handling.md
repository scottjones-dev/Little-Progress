# Error handling and Sentry

How errors are shown to users and reported to us, in the API (Hono), the web app (Next.js) and the native app (Expo). Code: `packages/errors`, plus the Sentry init in each app.

## 1. What the user sees

The API answers every error with one shape, so clients branch on `code` and never parse messages:

```json
{ "error": { "code": "NOT_FOUND", "message": "Not found", "requestId": "..." } }
```

| Code                | Status | When                                      |
| ------------------- | ------ | ----------------------------------------- |
| `UNAUTHORIZED`      | 401    | no valid session                          |
| `FORBIDDEN`         | 403    | signed in, not allowed                    |
| `NOT_FOUND`         | 404    | unknown route or record                   |
| `CONFLICT`          | 409    | clashes with existing data                |
| `STALE_VERSION`     | 412    | `If-Match` version is old (sync contract) |
| `VALIDATION_FAILED` | 422    | input failed validation                   |
| `RATE_LIMITED`      | 429    | too many requests                         |
| `INTERNAL`          | 500    | a bug                                     |

- Throw `new AppError(code, message)` for errors we expect. Its message is shown to the user (unless `expose: false`).
- Anything else is a bug: the client gets code `INTERNAL` with a generic message, never the real message or stack.
- `requestId` is also the `x-request-id` header and a Sentry tag (`request_id`). If a user quotes it, search Sentry for that tag.
- Better Auth answers `/api/auth/*` with its own error format. Those are documented in `auth-client.md` section 4 and are not reshaped.
- Web: `error.tsx` (a page failed), `global-error.tsx` (the root layout failed), `not-found.tsx`. Native: an Expo Router `ErrorBoundary` in the root layout. All show a calm message with "Try again" and report the error.

## 2. What is reported

| App | SDK | Reported |
| --- | --- | --- |
| API | `@sentry/hono` + `@sentry/node`, loaded with `--import ./src/instrument.ts` | unhandled errors (5xx). 3xx and 4xx are ignored, so a wrong password is not an issue |
| Web | `@sentry/nextjs` (server, edge, browser) | render errors, route errors, unhandled browser errors. Browser events go through `/monitoring` on our own domain |
| Native | `@sentry/react-native` | JS errors, unhandled rejections, native crashes (native crashes need a development build, not Expo Go) |

Nothing is sent when the DSN is empty, so local development needs no Sentry account.

## 3. What is never sent (privacy)

`baseSentryOptions()` applies to all three apps:

- `sendDefaultPii: false`. No Session Replay, screenshots, view hierarchy, profiling or feedback widget (all would capture screens of a health diary).
- `scrubEvent` removes request bodies, cookies, `authorization`/`cookie`/`set-cookie` headers, sensitive URL query values (`token`, `code`, `key`, `secret`, `email`, ...), and reduces the user to an opaque id (no email, IP or username). It filters keys that look like notes or passwords from `extra` and `contexts`.
- `scrubBreadcrumb` drops console and UI-click breadcrumbs and scrubs URLs of network breadcrumbs.
- Traces are sampled at 10% in production (100% in development). Errors are always sent.

Rule for code: never put entry content, names, notes or tokens in an error message or Sentry tag. Use ids.

## 4. Setup (one time, by you)

1. Create a Sentry organization with **EU data storage** (de.sentry.io).
2. Create three projects: `api` (Node/Hono), `web` (Next.js), `native` (React Native).
3. Put the DSNs in Infisical: `/api` `SENTRY_DSN`; `/web` `NEXT_PUBLIC_SENTRY_DSN`; `/native` `EXPO_PUBLIC_SENTRY_DSN`. Do this for dev, staging and prod (use `SENTRY_ENVIRONMENT` on the API to tell staging from prod).
4. Source maps (readable stack traces), later: create an auth token and set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` for the web build. Without the token builds still pass, just with unreadable traces. For native, the `@sentry/cli` build script is currently disabled in `pnpm-workspace.yaml` (`allowBuilds`). Enable it when you set up EAS builds.
5. Alerts to create in Sentry: new issue in production, error-rate spike on `api`, weekly digest.

## 5. Check it works

- API: `GET /api/_debug/error` (development only) returns the standard 500 body and, with a DSN, one event with the `request_id` tag and no cookies or headers.
- Web: open `http://localhost:3000/debug` (development only, 404 in production). Buttons send a captured error, throw in a click handler, or crash while rendering; the link fails on the server. The events appear in the web project.
- Native: the home screen shows two test buttons in development (`src/components/sentry-test.tsx`): send a captured error, or crash a screen to see the error screen. Native crashes (not JS errors) need a development build.
