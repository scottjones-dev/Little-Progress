# Analytics (PostHog EU)

How we measure use of the product and the website without sending anything about a child. Code: `packages/analytics` (rules and event catalog), `apps/web/src/lib/analytics.ts`, `apps/native/src/lib/analytics.ts`.

## 1. What we measure

- **Page views and screen views** on web and native (which screens parents use).
- **Product events** from a fixed catalog (`packages/analytics/src/events.ts`):

| Event | Properties | Meaning |
| --- | --- | --- |
| `sign_up_completed` | none | a parent finished sign-up |
| `sign_in_completed` | `method`: password, google, microsoft, passkey | a parent signed in |
| `family_created` | none | onboarding created the family |
| `invite_sent`, `invite_accepted` | none | second parent invited, accepted |
| `entry_logged` | `kind`, `seconds_to_log` (bucket), `source` (app or web) | an entry was saved, and roughly how long it took |
| `report_generated`, `report_printed` | none | report use |
| `insight_viewed` | none | a pattern insight was opened |
| `analytics_opted_out` | none | a parent turned analytics off |

Entry and report events are defined now and sent when those features are built.

## 2. What is never sent

The catalog is the only way to send an event, and every property is an enum, a boolean or a bucket, never free text. A property that is not in the catalog is rejected and the event is dropped, so nothing can be added by accident. On top of that:

- No names, food names, notes, dates of birth, emails, phone numbers or tokens. A denylist of those keys is removed from every event as a backstop.
- URLs are scrubbed with the same rules as Sentry (`@repo/errors/scrub`): tokens in query strings and secret path segments are hidden.
- The carer quick-log and the pages that carry one-time links (reset password, accept invitation, delete account, verify email) are never tracked: events from them are dropped.
- No autocapture (it reads page text), no session replay, no surveys, no heatmaps, no feature-flag requests.
- Anonymous visitors have no person profile and nothing is stored in cookies or localStorage on web (`persistence: "memory"`). After sign-in the only identity is the opaque user id, never an email or name (`identifyUser(userId)`), and `resetAnalytics()` on sign-out.
- `respect_dnt` is on for the web.
- Data goes to PostHog Cloud EU (Frankfurt). On web it goes through our own domain at `/ingest` (Next rewrites), so ad blockers and a strict CSP are not a problem.

Because there are no tracking cookies or stored ids, we do not show a cookie banner. This is a design stance to be confirmed in the privacy notice, not legal advice.

## 3. How to use it in code

```ts
import { track } from "../lib/analytics"; // web and native have the same functions

track("sign_in_completed", { method: "google" }); // typed: wrong names or properties do not compile
```

To add an event, add one entry with a strict schema to `events.ts`. Do not add a string property.

| Function | When |
| --- | --- |
| `track(name, props)` | an event from the catalog |
| `identifyUser(userId)` | right after sign-in |
| `resetAnalytics()` | on sign-out |
| `setAnalyticsEnabled(boolean)` | the parent's analytics setting (settings screen comes later) |

Without a token every function does nothing, so local development needs no PostHog account.

## 4. Setup (one time, by you)

1. Create a PostHog account on the **EU cloud** (<https://eu.posthog.com>) and a project.
2. In Project settings turn on **Discard client IP data**, keep session replay, autocapture and surveys off, and set a data retention period you are happy with.
3. Copy the **Project token** (starts with `phc_`) into Infisical: `NEXT_PUBLIC_POSTHOG_TOKEN` under `/web` and `EXPO_PUBLIC_POSTHOG_TOKEN` under `/native` (dev, and staging and prod later). One project or two, your choice. Two keeps web and app numbers apart.
4. Later: dashboards for sign-up to first entry, entries per week, time to log, report use.

## 5. Check it works

- Web: open `http://localhost:3000/debug` and press "Send an analytics test event". In PostHog, Activity then Live events should show the page view and `insight_viewed`. The page URL there should show `token=[Filtered]` if you opened `/debug?token=abc`.
- Native: press the same button on the home screen. Changing screens shows `$screen` events.
- Open `/quick-log` (once it exists): nothing should appear in Live events.
