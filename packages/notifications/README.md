# @repo/notifications

One function, `notify()`, to tell a user something. It delivers by email today, push (Expo) for chosen events, and SMS later, through [Novu](https://novu.co) (Cloud, EU region).

## Why it exists

Auth and the API should never know which channel, provider or template is behind a message, and we do not want a different send function per email. Callers say _what happened_ and _who to tell_; this package decides the rest.

```
apps/api  --notify()-->  @repo/notifications  --trigger-->  Novu Cloud  --> Resend (email)
   ^                                                              |          --> Expo Push (phones)
   '------ /api/novu bridge (Novu runs our workflows here) <------'          --> SMS (provider TBD)
```

Novu is the queue and retry layer, so `notify()` returns quickly and a provider outage never breaks sign-up.

## Use it

```ts
import { notify } from "@repo/notifications/notify";

void notify("password-changed", {
  to: { subscriberId: user.id, email: user.email },
  payload: { name: user.name, changedAt, secureAccountUrl },
  idempotencyKey: `password-changed:${user.id}:${changeId}`, // optional, stops double sends on retry
});
```

- The event id decides the payload type, so a missing field is a compile error. Payloads are also validated at runtime.
- `notify()` never throws and never logs the payload (it holds one-time links). Use `void notify(...)` inside auth callbacks so response time does not reveal whether an account exists.
- Without `NOVU_SECRET_KEY` (plain local dev) it logs "skipped" and does nothing.

## Add a notification

Everything is driven by the catalog in `src/events.ts` (today: `verify-email`, `reset-password`, `password-changed`, `two-factor-changed`, `delete-account`, `family-invite`, `new-location-sign-in`, `magic-link`). Add one entry:

1. Make the email template in `@repo/emails` (it gets a matching entry in that registry).
2. Add an `events` entry: payload schema, `critical` (cannot be switched off by the user), and an optional `push` message.
3. Tests pick it up automatically (the catalog must match the email templates exactly).

There is one generic workflow builder (`src/workflows.ts`), so there is no per-notification workflow code. SMS will become another step there once a provider is chosen.

## Push devices

```ts
import { registerDevice, unregisterDevice } from "@repo/notifications/devices";

await registerDevice(user.id, expoPushToken); // on sign-in from the app
await unregisterDevice(user.id, expoPushToken); // on sign-out
```

Tokens are stored on the Novu subscriber (max 100). The subscriber is created by the first `notify()` (the verification email at sign-up), so call this after that.

## Files

```
src/
  events.ts     catalog of notifications (payload, critical, push)
  workflows.ts  builds the Novu workflows from the catalog
  notify.ts     notify() and createNotify() (dependencies injected for tests)
  devices.ts    Expo push token helpers
  client.ts     Novu client from env (EU or US)
  bridge.ts     Hono handler Novu calls, mounted at /api/novu in apps/api
```

## Set up Novu (once)

1. Create a Novu Cloud account and copy the secret key into Infisical (`/api`) as `NOVU_SECRET_KEY`. Set `NOVU_REGION` to the region the account was created in (`eu` by default; dev uses `us` today because that is where the account is). A key from one region is rejected by the other with "API Key not found".
2. In the Novu dashboard add integrations: **Resend** (email, with your Resend API key), **Expo Push** (access token). Add an SMS integration later.
3. Local: run the API (`pnpm dev`), then in another terminal `pnpm --filter @repo/notifications studio`. It opens a tunnel from Novu to `localhost:9000/api/novu` (you will be asked to log in to Novu).
4. Production: the API must be publicly reachable at `/api/novu`; sync with `pnpm dlx novu sync --bridge-url https://<api-host>/api/novu --secret-key $NOVU_SECRET_KEY`.

Privacy: Novu stores recipient emails and payloads. Mention it in the privacy notice.

## Tests

`pnpm --filter @repo/notifications test` (Vitest, no network): catalog matches the email templates, payload validation, `notify` behaviour with a fake Novu client (right workflow, subscriber, idempotency key, never throws, no payload in logs, skipped when not configured), the real workflow definitions (steps per channel, critical = read-only), the bridge's 503 without a key, and device-token handling (dedupe, cap, removal).

Not covered yet: a live send. Do that manually with a Novu dev key (see setup) by triggering `verify-email` from the dashboard.

## Depends on / used by

Depends on `@novu/framework`, `@novu/api`, `@repo/emails` (templates), `@repo/env`, `zod`, `hono`. Used by `apps/api` (bridge now, `notify` from auth next).
