# LittleProgress

A private family care diary for a toddler who is behind on solids and development. It records detailed feeding trials plus sleep, nappies, milk and milestones, surfaces patterns over time, and produces printable reports for health visitors, dietitians and paediatricians. Parents have full accounts; carers (nursery, grandparents) log through a shared-PIN quick-log screen.

The full plan, decisions and trade-offs are in [`docs/plan.md`](docs/plan.md). What each person does screen by screen is in [`docs/user-flows.md`](docs/user-flows.md). Open work is tracked in [`docs/todos.md`](docs/todos.md). Project rules for contributors and AI agents are in [`AGENTS.md`](AGENTS.md).

## Workspaces

| Workspace | What it is |
| --- | --- |
| [`apps/web`](apps/web) | Next.js web app (parent dashboard, quick-log, reports), port 3000 |
| [`apps/native`](apps/native) | Expo mobile app, Metro on port 8081 |
| [`apps/api`](apps/api) | Hono API, port 9000. The only thing that touches the database and storage |
| [`packages/config`](packages/config) | Shared tsconfigs and global app constants (`@repo/config/app`) |
| [`packages/env`](packages/env) | Validated environment variables per runtime, plus `pnpm secrets:seed <env>` to fill Infisical |
| [`packages/db`](packages/db) | Drizzle schema, migrations, client, care vocabulary |
| [`packages/storage`](packages/storage) | S3-compatible storage (AWS S3, Cloudflare R2, Floci) |
| [`packages/emails`](packages/emails) | React Email templates, preview on port 5000 |
| [`packages/auth`](packages/auth) | Better Auth for parent accounts (server side): email and password, verification |
| [`packages/notifications`](packages/notifications) | `notify()` for email, push and later SMS, delivered through Novu |
| [`infra/postgres`](infra/postgres) | Local PostgreSQL via Docker |
| [`infra/storage`](infra/storage) | Local S3 emulator (Floci) and its UI via Docker |

```
web / native ──▶ api ──▶ Postgres (db)
                   ├──▶ object storage (storage)
                   └──▶ emails (render) ──▶ Resend / Novu later
config + env are used by everything
```

## Getting started

Requirements: Node 24+, pnpm, Docker, the [Infisical CLI](https://infisical.com/docs/cli/overview) (logged in).

```bash
pnpm install
pnpm infra:up        # Postgres + storage (Docker)
pnpm db:migrate      # create tables
pnpm storage:init    # create the dev bucket
pnpm dev             # web, api, native, email preview, Drizzle Studio
```

| Service       | URL                         |
| ------------- | --------------------------- |
| Web           | <http://localhost:3000>     |
| API           | <http://localhost:9000/api> |
| Email preview | <http://localhost:5000>     |
| Expo (Metro)  | <http://localhost:8081>     |
| Floci UI      | <http://localhost:4500>     |

Secrets live in Infisical (`/api`, `/web`, `/native`); `.env.example` lists the key names. On a fresh Infisical environment run `pnpm secrets:seed dev` (or `prod`) first. Each app also has a `dev:local` script that skips Infisical.

## Everyday commands

| Command | Does |
| --- | --- |
| `pnpm check` / `pnpm fix` | lint and format check / auto-fix (Ultracite: Oxlint + Oxfmt) |
| `pnpm check-types` | type-check every workspace |
| `pnpm test` | unit tests (Vitest) in every workspace that has them |
| `pnpm test:integration` | integration tests (needs `pnpm infra:up`) |
| `pnpm build` | build everything (Next build, email templates) |
| `pnpm db:generate` / `db:migrate` / `db:push` | Drizzle migrations |
