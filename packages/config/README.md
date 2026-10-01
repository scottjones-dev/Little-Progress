# @repo/config

Shared configuration for the whole monorepo.

## Why it exists

One place for things every workspace needs to agree on: TypeScript settings and the global app constants (name, URL, colours, links, logos, metadata).

## What's inside

- `typescript/*.json`: shared tsconfigs. `base.json`, `nextjs.json` (web), `expo.json` (native), `node.json` (api, db, env, storage), `react-library.json` (emails).
- `src/app.ts`: the `app` constant (name, tagline, URL, locale, theme colours, email from/reply-to, API port and base path, support/privacy/terms links, logos).

## Use it

```jsonc
// any workspace tsconfig.json
{ "extends": "@repo/config/typescript/node.json", "include": ["src"] }
```

```ts
import { app } from "@repo/config/app";

console.log(app.name, app.url);
```

## Tests

`pnpm --filter @repo/config check-types` type-checks the constants. There is no runtime logic to unit test.

## Depends on / used by

No runtime dependencies. Used by every other workspace.
