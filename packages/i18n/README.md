# @repo/i18n

Translation catalogs and the helpers that pick a language, shared by the server, the website and the app.

## Why it exists

Every sentence a person reads must come from a translation file, so it can be translated once and used everywhere. This package holds those files and the small amount of logic around them. It uses i18next, with the same file format on all platforms.

## What's inside

| Import | What it gives you |
| --- | --- |
| `@repo/i18n/core` | `getT(locale, namespace)` for server code, `getI18n()`, `i18nOptions()` for building your own i18next instance (website, app) |
| `@repo/i18n/resolve` | `Locale`, `locales`, `toLocale()`, `parseAcceptLanguage()`, `resolveLocale()` |
| `@repo/i18n/format` | `formatDate()`, `formatDateTime()`, `formatNumber()`, `formatList()`, `intlLocale()` |
| `@repo/i18n/resources` | the bundled catalogs and namespace list |

Catalogs: `src/locales/<language>/<namespace>.json` (English is the source; `pl`, `es`, `cy` are generated).

## Use it

```ts
import { getT } from "@repo/i18n/core";

const t = getT(user.locale, "push"); // falls back to English
t("passwordChanged.title");
```

Rules for writing keys, choosing a language and translating: `docs/i18n.md`.

## Run it

```bash
pnpm i18n:translate   # Languine translates what changed in English (needs LANGUINE_API_KEY in Infisical /i18n)
pnpm i18n:check       # fails if a language is incomplete or inconsistent
```

## Tests

`pnpm --filter @repo/i18n test`: language choice, `Accept-Language` parsing, fallback to English, formatting, and catalog checks (placeholders, plural forms, no markup or personal data). No network.

## Depends on / used by

Depends on `i18next`, `@repo/config`, `@repo/errors` (error codes in tests). Used by `packages/emails`, `packages/notifications`, `packages/auth`, `apps/web` and `apps/native`.
