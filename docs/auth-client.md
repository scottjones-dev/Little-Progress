---
title: Auth client
description: How the Next.js web app and the Expo app talk to Better Auth, flow by flow, matched to the screens in user-flows.md.
---

# Auth client (web and Expo)

The server is built (see [`auth.md`](auth.md)); **this is the client side, as documentation only.** `packages/auth` stays server only. Nothing here is built yet. Use it to write the screens in [`user-flows.md`](user-flows.md) and the tasks in [`todos.md`](todos.md).

Rules that apply to everything below:

- Install with `pnpm add` in the app (never type versions by hand).
- No hard-coded strings in screens: error text comes from the message catalogs, keyed by the error `code` Better Auth returns.
- Dark theme, tap targets 48 px or larger (see `user-flows.md` section 7).
- The carer zone (`/carer`, `/quick-log`) is **not** Better Auth. It has its own PIN login and token and never calls the calls below.

## 1. Setup

### 1.1 Web (Next.js, client only)

The Hono API owns `/api/auth/*`. Next has **no** auth route handler and does **not** use the `nextCookies` plugin (that is for Next-hosted auth).

```bash
pnpm --filter @repo/web add better-auth @better-auth/passkey
```

```ts
// apps/web/src/lib/auth-client.ts
import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/react";
import {
  inferAdditionalFields,
  lastLoginMethodClient,
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // Omit baseURL when /api is proxied through Next (recommended, see 1.3).
  // baseURL: env.NEXT_PUBLIC_API_URL,
  plugins: [
    // The server adds user.locale; declare it here instead of importing the server types,
    // so the web app does not depend on server-only packages ("separate projects" option in the docs).
    inferAdditionalFields({ user: { locale: { type: "string" } } }),
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/two-factor"; // the code screen
      },
    }),
    passkeyClient(),
    lastLoginMethodClient(),
    organizationClient(),
  ],
});

export type Session = typeof authClient.$Infer.Session;
```

### 1.2 Expo

```bash
pnpm --filter @repo/native add better-auth @better-auth/expo @better-auth/passkey expo-secure-store expo-network expo-linking expo-web-browser expo-constants
```

```ts
// apps/native/src/lib/auth-client.ts
import { expoClient } from "@better-auth/expo/client";
import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/react";
import {
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

import { apiUrl } from "./api"; // EXPO_PUBLIC_API_URL via @repo/env/native

export const authClient = createAuthClient({
  baseURL: apiUrl,
  plugins: [
    expoClient({
      scheme: "littleprogress", // = app.scheme in @repo/config and app.json
      storagePrefix: "littleprogress",
      storage: SecureStore, // session and cookies are kept in the secure store
    }),
    twoFactorClient({
      onTwoFactorRedirect() {
        // navigate to the 2FA code screen
      },
    }),
    passkeyClient(),
    organizationClient(),
  ],
});
```

Already done on the server: `expo()` plugin, `trustedOrigins` with `littleprogress://` (and `exp://` wildcards in development only), CORS with credentials. Notes from the Expo docs:

- Metro must not disable package exports (the default in recent SDKs is fine). Clear the cache after changing Metro config: `npx expo start --clear`.
- The session is cached in SecureStore so the app opens without a loading spinner. Pass `disableCache: true` to `expoClient` to turn that off.
- Passkey challenge cookie: the server uses the default `better-auth-passkey`, which already matches the default `cookiePrefix: "better-auth"`. If the server's `webAuthnChallengeCookie` is ever renamed, add its prefix to `cookiePrefix`.
- Native has no cookie jar for our own API calls. To call a Hono route that needs the session, add the stored cookie by hand:

```ts
const cookie = authClient.getCookie();
const res = await fetch(`${apiUrl}/api/me`, {
  headers: { Cookie: cookie },
  credentials: "omit", // 'include' would fight the header we just set
});
```

### 1.3 Cookies and origins: decide before building screens

Session cookies are set by the API. The web app can only use them if they are first-party.

| Option | How | Notes |
| --- | --- | --- |
| **A. Proxy through Next (recommended)** | `rewrites` in `next.config.ts` send `/api/:path*` to the API. Browser sees one origin | No CORS, cookies first-party, Next `proxy.ts` can see the cookie, passkey `rpID` = the web domain. Native still calls the API directly |
| B. Subdomains | `app.example.com` + `api.example.com`, server `advanced.crossSubDomainCookies` and `lastLoginMethodClient({ domain })` | Needs extra server config, CORS with credentials (already on) |

Either way `WEB_ORIGIN` must equal the browser's origin (it feeds CORS and `trustedOrigins`), and `PASSKEY_RP_ID` must be that site's registrable domain.

### 1.4 Calling our own API with types

Our Hono routes use the typed client; send cookies for cross-origin web calls:

```ts
import { hc } from "hono/client";
import type { AppType } from "@repo/api/app";

const api = hc<AppType>(baseUrl, { init: { credentials: "include" } });
```

### 1.5 Guarding routes (web)

- Next 16 `proxy.ts`: `getSessionCookie(request)` from `better-auth/cookies` is an **optimistic redirect only**. It checks that a cookie exists, not that it is valid, so never treat it as security.
- The real check is the API: a server component or action calls `GET /api/me` with the incoming cookie and redirects to `/sign-in` on 401. Authorisation always happens on the API.
- Client components use `authClient.useSession()`.

## 2. Flows, screen by screen

### 2.1 Sign up and verify (`/sign-up`, `/verify`)

```ts
await authClient.signUp.email({
  email,
  password,
  name,
  callbackURL: "/onboarding", // where the verify link sends them
});
// then show "check your email" with a resend button
await authClient.sendVerificationEmail({ email, callbackURL: "/onboarding" });
```

Password rules: 8 to 128 characters. An existing email looks the same as a new one, so never promise "account created". Signing in before verifying returns **403**: send the user to `/verify` (the "Not verified" state in `user-flows.md` section 3).

### 2.2 Sign in (`/sign-in`)

```ts
const { error } = await authClient.signIn.email({ email, password });
```

- 401 wrong email or password (one generic message). 403 not verified, go to `/verify`.
- 2FA on: the plugin's `onTwoFactorRedirect` fires, show `/two-factor`.
- **429**: show "try again in N seconds" from the `X-Retry-After` header (the "Rate limited" state):

```ts
await authClient.signIn.email(
  { email, password },
  {
    onError({ response }) {
      if (response.status === 429) {
        const seconds = response.headers.get("X-Retry-After");
      }
    },
  }
);
```

- Social: `authClient.signIn.social({ provider: "google" | "microsoft", callbackURL: "/" })`. Show a button only for providers the server has credentials for. On Expo the relative `callbackURL` becomes a deep link; navigate yourself after it resolves.
- Passkey: `authClient.signIn.passkey({ autoFill: true })`. For conditional UI, give the email input `autocomplete="username webauthn"` and the password input `autocomplete="current-password webauthn"` (webauthn last), and call it once on mount after checking `PublicKeyCredential.isConditionalMediationAvailable()`.

### 2.3 Forgot and reset (`/forgot`, `/reset`)

```ts
await authClient.requestPasswordReset({ email, redirectTo: "/reset" }); // always "if that email exists, we sent a link"
await authClient.resetPassword({ newPassword, token }); // token from the ?token= query on /reset
```

On success every other session is signed out and a "password changed" email goes out.

### 2.4 Settings: security

```ts
// Change password (also emails "password changed")
await authClient.changePassword({
  currentPassword,
  newPassword,
  revokeOtherSessions: true,
});

// Sessions: show device, country (from IP, coarse), sign-out button
const { data: sessions } = await authClient.listSessions();
await authClient.revokeSession({ token });
await authClient.revokeOtherSessions();

// Linked sign-in methods
const { data: accounts } = await authClient.listAccounts();
await authClient.linkSocial({ provider: "google", callbackURL: "/settings" });
await authClient.unlinkAccount({ accountId: account.id }); // refused for the last method

// Passkeys
await authClient.passkey.addPasskey({ name: "My phone" });
const { data: passkeys } = await authClient.passkey.listUserPasskeys();
await authClient.passkey.updatePasskey({ id, name });
await authClient.passkey.deletePasskey({ id });
```

Changing the email address is not offered (the server refuses it); show the address read-only with a "contact support" note.

### 2.5 Two-factor

```ts
// Enrol: needs the password and a fresh sign-in (within 15 minutes)
const { data } = await authClient.twoFactor.enable({ password });
// data.totpURI: render the QR code locally (never send it to a third-party QR service); data.backupCodes: show once
await authClient.twoFactor.verifyTotp({ code }); // first correct code turns 2FA on

// Sign-in challenge (/two-factor)
await authClient.twoFactor.verifyTotp({ code, trustDevice: true }); // trusts this device for 30 days
await authClient.twoFactor.verifyBackupCode({ code });

// Manage
await authClient.twoFactor.generateBackupCodes({ password }); // replaces the old set
await authClient.twoFactor.disable({ password });
```

Too many wrong codes returns 429 with `ACCOUNT_TEMPORARILY_LOCKED`: show it like the rate-limit state. Users who only use Google or a passkey cannot enable 2FA (by design).

### 2.6 Families: onboarding and second parent

A family is an organization. Parents get one.

```ts
// /onboarding step 1: create the family (slug from the name, made unique)
const { data: family } = await authClient.organization.create({ name, slug });
await authClient.organization.setActive({ organizationId: family.id });

// Which state is the user in? (user-flows.md "Resumable states")
const { data: orgs } = authClient.useListOrganizations();
const { data: active } = authClient.useActiveOrganization();

// Invite the second parent (they get a link valid for 7 days)
await authClient.organization.inviteMember({ email, role: "admin" });
await authClient.organization.listInvitations();

// Accept: the link opens /accept-invitation/<id>; the invitee signs up or in first, then:
await authClient.organization.acceptInvitation({ invitationId });
await authClient.organization.rejectInvitation({ invitationId });

// Settings
await authClient.organization.listMembers();
await authClient.organization.removeMember({ memberIdOrEmail });
await authClient.organization.leave({ organizationId });
```

The organization has the carer fields (`carerPinHash`, `carerPinVersion`, `joinCode`), but they are server-managed (`input: false`). The carer PIN screens call **our** API, not these. Children, carers and entries are our Hono routes (`POST /children`, ...), always scoped to the active organization.

A second family is refused (403) by `organizationLimit: 1`.

### 2.7 Last login

`session.user.lastLoginMethod` is available after sign-in (settings: "you last signed in with Google"). The **sign-in screen badge** needs the plugin's cookie, which the server currently never sets (GDPR: it is non-essential). Do not build the badge until the cookie-consent decision is made; then change `beforeStoreCookie` on the server and use `authClient.getLastUsedLoginMethod()`.

### 2.8 Delete account (settings, danger zone)

```ts
await authClient.deleteUser({ password }); // sends the confirmation email; nothing is deleted yet
// /delete-account?token=...
await authClient.deleteUser({ token, callbackURL: "/goodbye" }); // completes it
```

Needs a session signed in within 15 minutes (or the password). Warn that a family with no other parent is deleted with all its data; offer the report download first.

### 2.9 Sign out

`await authClient.signOut()`, then go to `/sign-in`. Expiry mid-session returns 401: send the user to `/sign-in` and back to the same place.

## 3. Screen and state map

| Screen / state in `user-flows.md` | Client call | Server behaviour |
| --- | --- | --- |
| `/sign-up` | `signUp.email` | creates unverified user, sends verify link |
| Not verified, `/verify` | `sendVerificationEmail` | 403 on sign-in until verified |
| `/sign-in` | `signIn.email`, `signIn.social`, `signIn.passkey` | 401 generic, 429 `X-Retry-After`, 2FA redirect |
| `/forgot`, `/reset` | `requestPasswordReset`, `resetPassword` | same answer for any email, single-use link |
| No family, `/onboarding` step 1 | `organization.create`, `setActive` | one family per parent |
| No child, `/onboarding` step 2 | our API `POST /children` | scoped to active organization |
| Invite second parent | `organization.inviteMember` | email with 7-day link |
| Accept invite | `organization.acceptInvitation` | needs a verified email |
| Prompt: turn on 2FA | `twoFactor.enable`, `verifyTotp` | backup codes shown once |
| Settings: security | `changePassword`, `listSessions`, `revokeSession`, `listAccounts`, passkey calls | emails on password and 2FA changes |
| Settings: delete account | `deleteUser` | email confirmation, family cleanup |
| Rate limited (429) | read `X-Retry-After` | per-IP limits |
| Session expired | 401 then `/sign-in` | session 7 days, refreshed daily |
| Account locked | generic sign-in error; 2FA lock shows `ACCOUNT_TEMPORARILY_LOCKED` | plugin lock |
| Carer zone | not Better Auth | PIN token, separate gate |

## 4. Errors

Branch on `error.status` and `error.code`, never on the message text, and look the text up in the catalogs.

| Situation | Status | Show |
| --- | --- | --- |
| Wrong email or password | 401 | one generic "check your details" |
| Email not verified | 403 | go to `/verify`, offer resend |
| Too many requests | 429 | countdown from `X-Retry-After` |
| 2FA temporarily locked | 429 | same countdown, `ACCOUNT_TEMPORARILY_LOCKED` |
| Not signed in | 401 | go to `/sign-in` and come back |
| Family limit, role not allowed | 403 | plain explanation |
| Network failure | none | offline banner (see `user-flows.md` section 7) |

## 5. Build checklist

1. Settle the cookie/origin option (1.3) and set `WEB_ORIGIN`, `BETTER_AUTH_URL`, `PASSKEY_RP_ID` for each environment.
2. Create `auth-client.ts` in web and native (1.1, 1.2), plus message catalog keys for every error above.
3. Build in the order of `docs/auth.md` section 13: sign-up/verify/sign-in, forgot/reset, onboarding (family, child), settings (security, 2FA, passkeys, accounts, delete), invite.
4. Add Google/Microsoft buttons when credentials are in Infisical.
5. Tests: Playwright for sign-up to first log, 2FA and passkey (virtual authenticator) once the screens exist.

## Docs these calls come from

Better Auth: Installation, Client, Email and Password, Session Management, Rate Limit, Users and Accounts, Google, Microsoft, Two-Factor, Passkey, Last Login Method, Organization, Hono, Next.js, Expo.
