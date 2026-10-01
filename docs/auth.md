---
title: Auth
description: How parents sign in, how accounts and families are secured, and which emails Better Auth sends. Server side is built; client side is in auth-client.md.
---

# Auth (Better Auth)

This is the design and status of **parent accounts**. Carers use the shared PIN gate, which is a separate system (see `docs/plan.md`, "Auth and roles"); nothing here applies to carers except that the carer PIN hash and family code are stored on the family (organization) row.

- Server code: [`packages/auth`](../packages/auth) (one `auth.ts`, plus `emails.ts`), mounted by `apps/api` at `/api/auth/*`.
- Client usage for web, Expo and every plugin: [`auth-client.md`](auth-client.md).
- Screens and states: [`user-flows.md`](user-flows.md).
- Open work: [`todos.md`](todos.md).

Status: **server built, not yet tested or wired to a UI.** Everything is configured the way the Better Auth docs show it. Where the docs offer an option we use it instead of inventing our own (the earlier custom "lockdown" table is gone).

## 1. Requirements

| Need | Decision | Where |
| --- | --- | --- |
| Email verification | **Required** before first sign-in | `emailAndPassword.requireEmailVerification` |
| Change email | **Not allowed** | `user.changeEmail.enabled: false` |
| Social sign-in | Google and Microsoft now (each turns on when its credentials exist). Apple and Facebook later | `socialProviders` |
| Password reset | Email link, single use, 1 hour, signs out other sessions | `sendResetPassword`, `revokeSessionsOnPasswordReset` |
| "Your password changed" email | Every time, reset or settings | `onPasswordReset` + after-hook on `/change-password` |
| Lockdown | Sign-in rate limit (5 per minute per IP) and the 2FA plugin's built-in lockout. No custom lock table | `rateLimit`, `twoFactor` |
| 2FA | Authenticator app (TOTP), 10 backup codes, trusted devices. Email OTP not used | `twoFactor` plugin |
| Passkeys | Optional sign-in method and credential | `@better-auth/passkey` |
| Last login | Method recorded in the database (shown in settings). The sign-in screen badge needs the non-essential cookie, so it waits for the cookie-consent decision | `lastLoginMethod` |
| Families | A family is a Better Auth **organization**; the creator is `owner`, a second parent is invited | `organization` plugin |
| Delete account | Email confirmation; a family with no parents left is deleted with its data | `user.deleteUser` |
| Mobile | Expo app signs in with the same server | `@better-auth/expo` |

Why no email change: the email address is the identity. Fixing a typo is rare, and an attacker who hijacks a session could redirect all reset mail by changing it. A genuine change is a manual support action (section 8).

## 2. Constraints and scale

Primer step 1. About 2 parents per family and a handful of families, so traffic is tiny. We optimise for **security and clarity**, not throughput. The data is a child's health diary, so a hijacked account is the main risk. Hence: verification, 2FA, passkeys, rate limits, instant session revocation (cookie cache is off) and the email notices.

If Novu is unreachable, `notify` logs and returns; the user can ask for the link again. Sending is never awaited inside auth callbacks (section 5).

## 3. High-level design

```
Web (Next, client only) ─┐                       ┌─ Postgres (Drizzle): user, session, account, verification,
                         ├─ HTTPS ─▶ Hono API ───┤   twoFactor, passkey, organization, member, invitation,
Expo app ────────────────┘   /api/auth/*         │   rateLimit
                                Better Auth      └─ @repo/notifications ─▶ Novu ─▶ email
                                  │
                                  └─ OAuth ─▶ Google · Microsoft (Apple later)
```

- One Better Auth instance, in `packages/auth/src/auth.ts`, served by the Hono handler `app.on(["POST","GET"], "/auth/*", ...)` under the `/api` base path. CORS (with credentials) is registered before it.
- The web app is **client only**: Next has no auth route handler and does not use the `nextCookies` plugin. See `auth-client.md` for the cookie/origin decision.
- Native uses the Expo plugin and stores the session in SecureStore.
- Auth never sends email itself. It calls `notify` from `@repo/notifications`; templates are in `@repo/emails`.
- The generated Drizzle schema is `packages/db/src/schemas/auth.ts`, produced by `pnpm auth:generate`. It is never edited by hand and is excluded from Ultracite.
- Drizzle 1.0 uses relations v2, so the adapter comes from `@better-auth/drizzle-adapter/relations-v2` (the adapter docs' route for Drizzle v1); the plain `better-auth/adapters/drizzle` import makes the generator emit the old `relations()` API, which Drizzle 1.0 no longer exports.

## 4. Flows

### 4.1 Sign up and verify email

1. Email, password (8 to 128 characters) and name.
2. User is created with `emailVerified = false` and **verify-email** is sent (link, 1 hour).
3. Sign-in is refused (403) until the link is clicked. With verification required, sign-up answers the same way for an existing address, so the form cannot reveal who has an account.
4. The link verifies the email and signs the user in (`autoSignInAfterVerification`).

Verification is a link for now. A 6-digit code (email OTP) is a later option; the `verify-email` template already supports an optional `code`.

### 4.2 Sign in

Password, Google or Microsoft, or a passkey. The session lasts 7 days (refreshed daily). Rules:

- Password sign-in is rate limited to 5 attempts a minute per IP. A 429 carries `X-Retry-After`.
- If 2FA is on, a password sign-in returns `twoFactorRedirect: true` and the client shows the code screen. Social and passkey sign-ins are not challenged by 2FA (Google, Microsoft and passkeys bring their own strong factor).
- After too many wrong 2FA codes the plugin locks verification temporarily (429 `ACCOUNT_TEMPORARILY_LOCKED`).
- The login method is recorded for the "last used" hint (section 7).

### 4.3 Forgot and reset password

1. User asks for a reset. The answer is always the same, whether or not the email exists.
2. **reset-password** email with a single-use link, 1 hour.
3. On success all other sessions are revoked and **password-changed** is sent.

### 4.4 Change password (signed in)

Current plus new password, client passes `revokeOtherSessions: true`. The server sends **password-changed** from an after-hook on `/change-password`, only when the call succeeded (after-hooks also run on failure). The reset path uses `onPasswordReset`; both call one shared `notifyPasswordChanged`.

### 4.5 Social sign-in and linking

- Google and Microsoft are configured only when their client id and secret are in the environment.
- `account.accountLinking`: enabled, `trustedProviders: ["google","microsoft"]`, `allowDifferentEmails: false`, `allowUnlinkingAll: false`. A linked provider must have the same email as the account, and the last way to sign in cannot be unlinked.
- Provider access, refresh tokens are **encrypted** before they are stored (a `databaseHooks.account.create.before` hook, as the Users and Accounts docs show).
- Microsoft's profile photo (a huge base64 string) is dropped.
- A user who only used Google has no password; they can set one through the forgot-password flow.
- **Apple** is not set up: it needs a paid Apple Developer account and has no `localhost`. Apple is required on iOS if any other social sign-in is offered, so it blocks the App Store release, not the web.

### 4.6 Lockdown (what we rely on)

Better Auth rate-limits requests and the 2FA plugin locks repeated wrong codes. We do **not** keep a custom per-account lock table. If a stronger policy is needed later, add a documented option rather than new storage.

| Layer | Setting |
| --- | --- |
| Per IP, all endpoints | Better Auth default window, rate-limit data in the database |
| Per IP, `/sign-in/email` | 5 per 60 seconds |
| `/get-session` | not limited |
| 2FA codes | plugin's built-in temporary lock |
| IP source | `cf-connecting-ip`, then `x-forwarded-for`. Keep the API reachable only through Cloudflare or a client can spoof the header |

### 4.7 Two-factor (TOTP)

- Enabling needs the current password and a first correct code (`skipVerificationOnEnable` stays `false`), so a mis-scanned QR cannot lock someone out.
- 10 backup codes, shown once. "Trust this device" lasts 30 days.
- `allowPasswordless` stays `false`, so users who only use Google or a passkey cannot enable 2FA; their provider's own MFA covers them.
- Turning 2FA on or off sends **two-factor-changed** (after-hooks on `/two-factor/verify-totp` for enrolment and `/two-factor/disable`).

### 4.8 Passkeys

- Plugin `@better-auth/passkey` with `rpID` (`PASSKEY_RP_ID`, `localhost` in development), `rpName`, `origin`.
- Passkeys are an **added** sign-in method; users always keep another way in.
- Native: the Expo client's `cookiePrefix` must match the passkey challenge cookie prefix (default `better-auth` already does).
- Passkeys are bound to the domain. Settle the production domain before users enrol.

### 4.9 Families (organizations)

- `organizationLimit: 1`: a parent belongs to one family. The creator is `owner`; the second parent is `admin` (default roles; custom statements later).
- Inviting a second parent sends **family-invite** with a link to `<web>/accept-invitation/<id>`. Invitations last 7 days, can be re-sent (`cancelPendingInvitationsOnReInvite`), and need a verified email to accept (`requireEmailVerificationOnInvitation`).
- The organization row also holds `carerPinHash`, `carerPinVersion` and `joinCode` (all `input: false`, so a client can never set them). Rotating the PIN bumps `carerPinVersion`, which invalidates carer sessions. The carer login itself is not Better Auth.
- Our own tables (`child`, `carer`, `food`, `entry`, `attachment`) point at `organization.id` through their `family_id` column. Deleting an organization removes them.

### 4.10 Delete account

`user.deleteUser` is enabled with an email confirmation (**delete-account**, link valid 1 day; Better Auth fixes this). The call first needs a fresh session (signed in within 15 minutes) or the password. After deletion, any family with no members left is deleted too, and its children, entries and photos follow through the foreign keys. A family with another parent stays.

## 5. Emails

Templates live in `@repo/emails`; delivery is a Novu workflow in `@repo/notifications`, one per row, with the same id. `packages/auth/src/emails.ts` holds the callbacks:

| Event | Template | Sent by |
| --- | --- | --- |
| Sign-up, resend verification | `verify-email` | `emailVerification.sendVerificationEmail` |
| Forgot password | `reset-password` | `emailAndPassword.sendResetPassword` |
| Password changed (reset or settings) | `password-changed` | `onPasswordReset` and the after-hook |
| 2FA turned on or off | `two-factor-changed` | after-hooks |
| Delete account confirmation | `delete-account` | `deleteUser.sendDeleteAccountVerification` |
| Second parent invited | `family-invite` | `organization.sendInvitationEmail` |
| Sign-in from a new country | `new-location-sign-in` | **not wired** (no documented hook; needs `CF-IPCountry` and stored countries) |
| Magic link | `magic-link` | **unused** (not offering magic-link sign-in) |

Rules for every send:

- Never `await` the send inside a Better Auth callback (`void notify(...)`). Waiting makes "email exists" requests slower than "email does not exist" ones, which leaks who has an account. `notify` catches and logs its own errors.
- Security notices are Novu **critical** workflows, so a user's preferences cannot switch them off.
- Payloads carry only what the email needs. Links carry a random token, never the email or user id.
- The invitee may have no account yet, so the Novu subscriber id for an invite is `invite:<email>`.

## 6. Configuration

`packages/auth/src/auth.ts` is the source of truth; it follows the docs section by section. Key settings:

| Area | Setting |
| --- | --- |
| Base | `appName`, `baseURL` (`BETTER_AUTH_URL`), `secret`, `trustedOrigins`: web origin, the app scheme `littleprogress://` and, in development only, `exp://` wildcards |
| Session | `expiresIn` 7 days, `updateAge` 1 day, `freshAge` 15 minutes, cookie cache **off** |
| Rate limit | enabled, database storage, `/sign-in/email` 5 per minute, `/get-session` off |
| IP | `cf-connecting-ip`, then `x-forwarded-for` |
| User | `changeEmail` off, `deleteUser` on, `additionalFields.locale` |
| Account | linking as in 4.5; OAuth tokens encrypted |
| Plugins | `twoFactor`, `passkey`, `lastLoginMethod`, `expo`, `organization` |
| Types | `export type Session = typeof auth.$Infer.Session` |

Regenerating the schema after changing plugins: `pnpm auth:generate`, then `pnpm db:generate` and `pnpm db:migrate`. If `drizzle-kit` asks rename-or-create questions, pass them with `--hints` (see `packages/auth/README.md`).

## 7. Last login

1. **Last used method** (`lastLoginMethod`, `storeInDatabase: true`). `beforeStoreCookie` returns `false`, so the plugin's cookie is never set; the docs call it a non-essential cookie under GDPR. The database value is available once the user is signed in (settings: "you last signed in with Google"). A "you used Google last time" badge on the **sign-in screen** needs the cookie, because there is no user yet. To get it, change `beforeStoreCookie` to return whether the user accepted optional cookies, once the privacy notice and consent banner exist.
2. **Sessions list** for settings: sessions store IP and user agent. Show a coarse location (country) and a "sign out this device" button.

## 8. Account recovery and support

- Lost password: reset link (4.3).
- Lost authenticator and backup codes: the hard case. Sign in with a passkey or a linked Google/Microsoft account if available; otherwise a manual support process that verifies identity out of band. Write the exact steps before launch. Do not add an email-only "disable 2FA" link; it removes the point of 2FA.
- Wrong email at sign-up: the unverified account is abandoned; sign up again with the right address.
- Genuine email change: support deletes and recreates, or runs a one-off script after identity checks.

## 9. Data model

Generated by the Better Auth CLI into `packages/db/src/schemas/auth.ts`:

| Table | From | Holds |
| --- | --- | --- |
| `user`, `session`, `account`, `verification` | core | users, sessions (IP, user agent, `active_organization_id`), linked logins and password hash, one-time tokens |
| `user.two_factor_enabled`, `two_factor` | twoFactor | flag; encrypted TOTP secret, backup codes, failed count and lock time |
| `passkey` | passkey | public key, counter, device type, AAGUID |
| `user.last_login_method` | lastLoginMethod | "email", "google", "microsoft", "passkey" |
| `user.locale` | additionalFields | preferred language (for later) |
| `organization`, `member`, `invitation` | organization | the family, its parents and roles, pending invites |
| `organization.carer_pin_hash`, `carer_pin_version`, `join_code` | additionalFields | carer PIN gate data |
| `rate_limit` | rateLimit storage | counters per key |

## 10. Secrets and environment

From `@repo/env/auth` (Infisical `/api`): `BETTER_AUTH_SECRET` (32+ characters, also keys the OAuth token encryption), `BETTER_AUTH_URL`, `WEB_ORIGIN`, `PASSKEY_RP_ID`, and optional `GOOGLE_CLIENT_ID/SECRET`, `MICROSOFT_CLIENT_ID/SECRET`. Redirect URIs to register in each provider: `<BETTER_AUTH_URL>/api/auth/callback/google` and `.../callback/microsoft`, for dev, staging and prod. Later for Apple: client id (Services ID), team id, key id, private key.

## 11. Threats and what answers them

| Threat | Answer |
| --- | --- |
| Stolen password | 2FA, passkeys, rate limit, password-changed email |
| Attacker changes the password | password-changed email to the real owner |
| Attacker changes the email | Not possible (feature off) |
| Password guessing | 5 per minute per IP, database-backed counters |
| 2FA code guessing | Plugin's temporary lock |
| Finding who has an account | Same response for existing or new emails, same generic login error, un-awaited email sends |
| Reset link theft | Single use, 1 hour, all other sessions revoked on use |
| Provider account takeover via linking | Same-email rule, trusted providers only, no unlinking the last method |
| Stolen provider tokens from the database | Tokens encrypted at rest |
| Spoofed IP to dodge limits | Only trust `cf-connecting-ip` when the API is reachable only through Cloudflare |
| Invite link guessed or forwarded | Opaque id, 7-day expiry, verified email required to accept |
| Lost 2FA device | Backup codes, passkey, manual support process |

## 12. Tests (not written yet)

Per project rules tests come with the code; they were deferred on request. When asked, write Vitest tests in `packages/auth` against the real test Postgres, mocking `@repo/notifications/notify`:

- Sign-up sends verify email; unverified sign-in refused; link verifies; existing-email sign-up looks the same.
- Reset: token works once, revokes sessions, sends password-changed. Change password sends it too, and **not** when the current password is wrong.
- Change-email endpoint refused. Sign-in rate limit returns 429 with `X-Retry-After`.
- 2FA: enable needs a code; sign-in redirects; backup code works once; `two-factor-changed` sent on enable and disable.
- Organization: one family per parent; invite sends `family-invite`; accepting needs a verified email; deleting the last parent deletes the family.
- A linked provider with a different email is refused (needs provider test credentials).

Playwright E2E later: sign-up to first log, 2FA, passkey (virtual authenticator).

A manual smoke test of the running API (sign-up, verify, sign-in, `/api/me`, organization create and invite, 2FA enable, change-email refused, 429) passed on the build date.

## 13. Build order

1. Done: base tables, email and password, verification, reset, password-changed.
2. Done (server): rate limit and session settings, 2FA, Google and Microsoft, linking, last login, delete account, passkeys, Expo plugin, organization (family) with invitations.
3. Next: the web screens and Expo screens, written from `auth-client.md`.
4. Then: tests (section 12), Apple sign-in, new-location notice, email OTP if wanted.

## 14. Open questions

- Production domain and cookie setup: Next proxy (same origin) or `app.` / `api.` subdomains. It decides passkey `rpID` and cookie settings. See `auth-client.md`.
- Apple relay addresses vs `allowDifferentEmails: false`. Likely answer: allow Apple linking only when signed in.
- Should 2FA be **required** for parents given the data is a child's health record? Recommendation: prompt at sign-up and require it before the first report export or carer PIN change.
- Delete account: confirm the exact data-deletion promise for the privacy notice (a family with another parent keeps its data).
- Which email sender sits behind Novu is Novu configuration, not auth's concern.
- Possible later: Stripe, if the project is monetised or sold (Better Auth has a Stripe plugin).

## Related

- [`plan.md`](plan.md): overall design, carer PIN gate, rate limits, security headers
- [`auth-client.md`](auth-client.md): client usage and screen map
- [`user-flows.md`](user-flows.md): screens and states
- [`todos.md`](todos.md): open work
- [`../packages/auth/README.md`](../packages/auth/README.md): server package
- [`../packages/emails/README.md`](../packages/emails/README.md): templates
