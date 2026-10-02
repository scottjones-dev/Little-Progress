# @repo/analytics

The event catalog and privacy rules for product and web analytics (PostHog EU), shared by web and native.

## Why it exists

We want to know how the product is used, but this is a child's health diary: nothing about a child may leave the app. The rules live here once so web and native cannot drift. This package has no PostHog dependency; each app installs its own SDK (`posthog-js`, `posthog-react-native`) and passes these rules into it.

## What's inside

| Import | What it gives you |
| --- | --- |
| `@repo/analytics/events` | `eventSchemas` (the catalog, Zod), `EventName`, `EventProps<N>`, `parseEvent()` |
| `@repo/analytics/options` | `posthogEuHost`, `webIngestPath`, `propertyDenylist`, `isTrackedPath()`, `beforeSend()` |

## Use it

```ts
const properties = parseEvent("entry_logged", {
  kind: "meal",
  seconds_to_log: "under_15",
  source: "app",
});
// null when the event does not match the catalog, so the caller drops it.
```

Apps normally call the `track()` wrapper in their own `src/lib/analytics.ts`. Full picture: `docs/analytics.md`.

## Tests

`pnpm --filter @repo/analytics test` (catalog validation, no free text anywhere, untracked pages, URL scrubbing, denylist). No network.

## Depends on / used by

Depends on `zod`, `@repo/db` (entry kinds) and `@repo/errors` (URL scrubbing). Used by `apps/web` and `apps/native`.
