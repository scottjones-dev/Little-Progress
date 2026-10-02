# Contributing to LittleProgress

Thank you for helping. LittleProgress is an open source family care diary, so a lot of the people who use it are tired parents looking after a small child. Calm, careful and private matters more here than clever.

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Your contributions are licensed under the [MIT License](LICENSE).

## The one rule that matters most

**Never put real personal or health data in this repository, an issue, a pull request, a screenshot or a log.** That means no real names, no photos, no feeding notes or dates of birth of a real child, no emails, no keys or passwords. Use made-up data (the examples in the code use "Alex" and "The Jones family"). If you find something real that was committed by mistake, report it as described in [SECURITY.md](SECURITY.md) instead of opening a public issue.

## Ways to help

- Report a bug or suggest an idea: open an issue (use the templates).
- Check the open work in [`docs/todos.md`](docs/todos.md); anything unticked is fair game, and it is a good idea to comment on an issue before starting something big.
- Improve the documentation, or read a translation file in a language you speak well. Anything about health, feeding or safety needs a native reader (see [`docs/i18n.md`](docs/i18n.md)).

## Run it on your computer (no accounts needed)

You need Node 24 or newer, [pnpm](https://pnpm.io), and Docker.

```bash
pnpm install
pnpm setup:local          # writes a .env with local settings and random secrets
pnpm infra:up             # Postgres and an S3 emulator, in Docker
pnpm db:migrate:local     # create the database tables
pnpm storage:init:local   # create the local bucket
pnpm dev:local            # API, website and app
```

| Service       | URL                         |
| ------------- | --------------------------- |
| Website       | <http://localhost:3000>     |
| API           | <http://localhost:9000/api> |
| Email preview | <http://localhost:5000>     |
| App (Metro)   | <http://localhost:8081>     |

Features that need an outside account (sending real email and push through Novu, Sentry, PostHog, Google and Microsoft sign-in) stay switched off until you add their keys. `.env.example` describes them. The maintainer's own setup uses Infisical for secrets (`pnpm dev`, `pnpm db:migrate`); you do not need it, use the `:local` commands above.

## Before you open a pull request

Run the same checks the project runs on every pull request:

```bash
pnpm check          # formatting and lint (Ultracite)
pnpm check-types    # TypeScript
pnpm test           # unit tests
pnpm build          # website and packages
```

The database and storage tests also run in CI; locally: `pnpm infra:up`, then `pnpm test:integration:local`.

How the code is organised and the rules we follow are in [`AGENTS.md`](AGENTS.md) (written for AI assistants, and just as useful for people). The short version:

- Every app and package keeps its code under `src/`.
- Add dependencies with `pnpm add`, never by editing `package.json` by hand.
- Each workspace has a `README.md`. Update it in the same pull request when behaviour, scripts or settings change.
- Add tests for new logic and run them; say why if something needs none.
- Text people read goes through `@repo/i18n` (no hard-coded sentences). Write English only; other languages are generated and checked with `pnpm i18n:check`.
- Keep code simple enough to explain. Comment the why, not the what.
- Never log, send to analytics or put into an error message anything from a child's entries. See [`docs/analytics.md`](docs/analytics.md) and [`docs/error-handling.md`](docs/error-handling.md).

Open the pull request from a branch of your fork, describe what and why, and tick the checklist in the template. Small, focused pull requests are reviewed much faster than large ones. The first time you contribute, a maintainer has to approve the automatic checks before they run.

## Security

Please do not report vulnerabilities in public issues. See [SECURITY.md](SECURITY.md).
