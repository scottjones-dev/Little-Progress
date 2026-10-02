# @repo/native

The Expo (React Native) app for phones and tablets.

## Why it exists

Quick one-handed logging at mealtimes and a nursery-tablet quick-log. Currently a minimal shell showing the app name; offline queue and screens come later.

## Run it

```bash
pnpm dev                              # whole repo; Metro on http://localhost:8081
pnpm --filter @repo/native dev        # Expo only (secrets via Infisical /native)
pnpm --filter @repo/native dev:local  # without Infisical
```

Scan the QR code with Expo Go. Analytics (PostHog EU) lives in `src/lib/analytics.ts` with screen tracking in `src/app/_layout.tsx`; see `docs/analytics.md`. Errors are reported to Sentry from `src/app/_layout.tsx` (with an Expo Router `ErrorBoundary`); `metro.config.js` adds Sentry debug ids. In development the home screen has Sentry test buttons (`src/components/sentry-test.tsx`). Native crashes need a development build, see `docs/error-handling.md`. Code lives under `src/app` (expo-router). Colours and name come from `@repo/config/app`; the API URL from `@repo/env/native` (`src/lib/api.ts`).

## Tests

`pnpm --filter @repo/native check-types`. No tests yet.

## Depends on / used by

Depends on `@repo/analytics`, `posthog-react-native`, `@repo/config`, `@repo/env`, `@repo/errors`, `@sentry/react-native`, Expo SDK 57. Talks to `apps/api`.
