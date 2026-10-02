# @repo/native

The Expo (React Native) app for phones and tablets. It is native only: it does not build for the web (`platforms` in `app.json` is iOS and Android, and there is no `react-native-web`); the website is `apps/web`.

## Why it exists

Quick one-handed logging at mealtimes and a nursery-tablet quick-log. Currently a minimal shell showing the app name; offline queue and screens come later.

## Run it

```bash
pnpm dev                              # whole repo; Metro on http://localhost:8081
pnpm --filter @repo/native dev        # Expo only (secrets via Infisical /native)
pnpm --filter @repo/native dev:local  # without Infisical: reads the root .env
```

Scan the QR code with Expo Go. Text comes from translation files (`@repo/i18n`); the language is the one chosen in the app, then the device language (`src/lib/i18n.ts`, switcher on the home screen); see `docs/i18n.md`. Analytics (PostHog EU) lives in `src/lib/analytics.ts` with screen tracking in `src/app/_layout.tsx`; see `docs/analytics.md`. Errors are reported to Sentry from `src/app/_layout.tsx` (with an Expo Router `ErrorBoundary`); `metro.config.js` adds Sentry debug ids. In development the home screen has Sentry test buttons (`src/components/sentry-test.tsx`). Native crashes need a development build, see `docs/error-handling.md`. Code lives under `src/app` (expo-router). Styling uses Tailwind classes through Nativewind 5 (`className`): `src/global.css` holds the Tailwind setup and the brand colour tokens (`bg-obsidian`, `text-mist`, `text-muted`, `text-gold`, `border-border`, `bg-surface`), `postcss.config.mjs` and `metro.config.js` wire it in, and `nativewind-env.d.ts` gives `className` its types. Nativewind 5 is a release candidate, so its versions (and Tailwind 4.1.12, lightningcss 1.30.1) are pinned exactly; do not bump them one by one. The name comes from `@repo/config/app`; the API URL from `@repo/env/native` (`src/lib/api.ts`).

## Tests

`pnpm --filter @repo/native check-types`. No tests yet.

## Depends on / used by

Depends on `@repo/i18n`, `react-i18next`, `@repo/analytics`, `posthog-react-native`, `@repo/config`, `@repo/env`, `@repo/errors`, `@sentry/react-native`, Expo SDK 57. Talks to `apps/api`.
