# @repo/emails

Transactional emails as typed React components, styled with Tailwind, in the dark "Midnight Sanctuary" theme.

## Why it exists

Auth and notification emails need to look the same everywhere and be sendable by any provider later (Resend, Novu, others). This package owns the templates and renders them to HTML and plain text. It does **not** send anything.

All brand data (name, URL, colours, support and privacy links, from address) comes from `packages/config/src/app.ts`.

## Layout

```
src/
  components/  layout, header, footer, button, callout
  templates/   verify-email, reset-password, magic-link,
               password-changed, new-location-sign-in
  lib/         tailwind.ts (Tailwind config from app colours, absoluteUrl)
  registry.ts  every template + subject + preview props, renderEmail()
  render.ts    renderElement() -> { html, text, subject }
  scripts/     build.ts (production artefacts)
```

Each template has a `PreviewProps` export so it renders in the preview server, and its subject lives next to it.

## Use it

```ts
import { renderEmail } from "@repo/emails/registry";

const { html, text, subject } = await renderEmail("verify-email", {
  code: "482 913",
  expiresInMinutes: 15,
  name: "Alex",
  verifyUrl: "https://littleprogress.app/verify?token=abc",
});
// hand html, text and subject to your mail provider
```

## Run it

| Command | What it does |
| --- | --- |
| `pnpm dev` (repo root) | starts the preview at <http://localhost:5000> with everything else |
| `pnpm --filter @repo/emails dev` | preview only |
| `pnpm --filter @repo/emails build` | writes `dist/html`, `dist/text`, `dist/manifest.json` (placeholder tokens) and `dist/export` (static HTML from `email export`) |
| `pnpm --filter @repo/emails preview:build` / `preview:start` | builds / serves the preview app itself (`email build` / `email start`) for hosting it as a website |
| `pnpm --filter @repo/emails test` | unit tests (Vitest) |

`build` has two outputs. `dist/html` renders each template with placeholder tokens such as `{{name}}` so non-React tools can fill them in. Set `EMAIL_TOKEN_PREFIX=payload.` to get `{{payload.name}}` (Novu style). `manifest.json` lists each template's subject, files and variables. `dist/export` is the stock `email export` output (preview props filled in) for quick manual checks.

## Adding a template

1. Create `src/templates/<id>.tsx` using `EmailLayout` and the other components, with a `PreviewProps` export and a subject function.
2. Add it to `EmailPropsMap` and `registry` in `src/registry.ts`.
3. The tests pick it up automatically; run them.

## Depends on / used by

- Depends on `@repo/config` (brand data), `@react-email/components`, `@react-email/render`, `react-email` (preview CLI).
- Used by `packages/notifications`, which renders these templates inside its Novu email step.

## Notes

- Dark theme: some mail clients re-colour dark emails. We set the `color-scheme` meta tags and checked contrast; test in real clients before launch.
- Copy is English (en-GB) only for now.
