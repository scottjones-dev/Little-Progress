# CI/CD

What runs automatically on every pull request, how to run the same checks yourself, and how to set the repository up. Files: `.github/workflows/ci.yml`, `.github/workflows/security.yml`, `.github/actions/setup/action.yml`, `.github/dependabot.yml`.

Status: **checks and security scans only. Nothing is deployed yet.** The workflows were checked with `actionlint` and every command was run in a clean Linux container, but they have not run on GitHub because the repository has no remote yet.

## 1. What a pull request must prove

| Job | Proves | Same thing locally |
| --- | --- | --- |
| **Lint, types, tests** (`ci.yml`) | formatting and lint rules, TypeScript, unit tests | `pnpm check`, `pnpm check-types`, `pnpm test` |
| (advisory step) `i18n:check` | every language has every key. Only reports for now, because Polish, Spanish and Welsh are empty until the translation service works | `pnpm i18n:check` |
| **Build** | the website and the packages build | `pnpm build` |
| **Expo bundle** | the app compiles into a bundle with Sentry, PostHog and translations | `pnpm --filter @repo/native exec expo export --platform android` |
| **Database migrations and storage** | every migration applies to an empty Postgres 18, and the storage code works against the S3 emulator | see section 3 |
| **Dependency audit** (`security.yml`) | no high or critical advisory in production dependencies | `pnpm audit --prod --audit-level high` |
| **OSV scan** | no known-vulnerable package in `pnpm-lock.yaml`. On a pull request only new vulnerabilities fail it; on `main` and every Monday everything is scanned |  |
| **Secret scan** | no secret anywhere in the git history (same scanner and `.infisicalignore` as the pre-commit hook) | `infisical scan` |
| **Dependency review** | a pull request does not add a dependency with a known high or critical vulnerability. Public repositories only (free there) |  |
| **CodeQL** | code analysis. Runs automatically while the repository is public; on a private one it needs GitHub's paid code security, then set the repository variable `ENABLE_CODEQL=true` |  |

No job needs a real secret. The integration job uses throwaway values for two disposable containers (the same ones as local development).

How it is built:

- Third-party actions are pinned to a full commit SHA with the version in a comment; Dependabot opens the update pull requests each Monday.
- `permissions: contents: read` everywhere; only the OSV and CodeQL jobs ask for more.
- A new push to the same pull request cancels the older run.
- `.github/actions/setup` is the shared start of each job: pnpm (version from `packageManager`), Node 24 with the pnpm cache, the Turborepo cache, `pnpm install --frozen-lockfile`.
- Git hooks are switched off on the runner (`HUSKY=0`) and telemetry is off.

## 2. Accepted vulnerabilities

An advisory we have decided to live with is listed with a reason and a date to look again. Never skip the job instead. There are two lists, one per scanner, kept in step:

- `pnpm audit`: `audit.ignore` in `pnpm-workspace.yaml` (high and critical only fail the job).
- OSV scan: `osv-scanner.toml` (every severity fails the job). After the `ignoreUntil` date the scan fails again, so an old exception cannot be forgotten.

Today, all from Expo's build tooling, none in the app that ships: `GHSA-86w9-cpqp-85rv` (node-forge, no patched version), `GHSA-w5hq-g745-h8pq` (uuid 7), `GHSA-vcc3-ghjq-m6fr` (decode-uri-component). Check again on 2026-12-01, or when Expo updates.

Fixed instead of accepted: the email preview tool (`@react-email/ui`) bundled its own `next` 16.3.3 with a critical advisory. `overrides` in `pnpm-workspace.yaml` points it at the website's version (checked: the preview still starts). Remove the override when `@react-email/ui` ships a patched `next`.

The secret scan ignores two known throwaway local passwords (the Docker Postgres and the CI test database) by listing them in `.infisicalignore` and, for the current CI file, with an inline `betterleaks:allow` comment.

### Dependabot and Expo

Dependabot opens update pull requests every Monday (`.github/dependabot.yml`), but it must not touch the packages Expo manages. Expo SDK 57 needs one exact, matching set (React Native, React, Reanimated, Worklets, screens, Sentry's React Native SDK, `@expo/*`). Updating them one at a time broke the app once: merged pull requests moved `react-native` to 0.87, `react` to 19.3 and `@expo/ui` to 58, which no Expo SDK supports together, and left the lockfile and `package.json` disagreeing so CI failed at install. Those packages are now ignored in `dependabot.yml`; they change together with the SDK, on purpose (`pnpm exec expo install --fix`, then the checks).

Rule: **never merge a Dependabot pull request with red checks.** Branch protection (section 4) enforces it. Close pull requests for ignored packages instead of merging them.

## 3. Running the integration job locally

```bash
pnpm infra:up                     # Postgres 18 and the S3 emulator (Floci)
pnpm db:migrate                   # applies the migrations (through Infisical)
pnpm storage:init && pnpm test:integration
```

CI runs the underlying commands directly with the values in `ci.yml` instead of going through Infisical: `drizzle-kit check`, `drizzle-kit migrate`, `tsx src/server/init.ts` and `vitest run integration`.

## 4. Setting up the repository (once)

1. Create the GitHub repository (it is public: the project is open source), add it as `origin` and push `main`.
2. Settings, Actions: allow actions. Turn on Dependabot alerts and Dependabot security updates.
3. Settings, Branches: protect `main`. Require a pull request and these checks: _Lint, types, tests_, _Build_, _Expo bundle_, _Database migrations and storage_, _Dependency audit_, _Secret scan_, _OSV scan (new in this pull request)_. Require branches to be up to date. No force pushes.
4. Settings, Code security: turn on _Private vulnerability reporting_ (SECURITY.md sends reporters there), _Secret scanning_ and _Push protection_.
5. Settings, Actions, General: _Fork pull request workflows_ set to require approval for all outside contributors, and the default token set to read-only. The workflows need no secrets, so a fork cannot reach any.
6. Add a `CODEOWNERS` file with your GitHub username when you know it.

Watch these on the first real run: the runner can download Google fonts for the website build, the S3 emulator starts in time, the Expo bundle duration, and cache hits on the second run.

## 5. When a job fails

- **Audit or OSV**: read the advisory. Update the package (`pnpm update <name>`), or if there is no fix and it is not reachable, add an entry under `audit.ignore` with a reason and a date.
- **Secret scan**: rotate the secret first, then remove it. A secret in git history stays valuable to an attacker even after you delete it.
- **Integration**: run the same commands locally (section 3); the container images match.

## 6. Adding deploys later

Not built. When hosting is chosen add a `deploy.yml` that runs after `ci.yml` succeeds on `main`, with a `production` environment that needs your approval. It will need: Infisical machine identity (OIDC, no long-lived keys in GitHub), the Vercel and EAS tokens, `SENTRY_AUTH_TOKEN` and `SENTRY_RELEASE=${{ github.sha }}` for readable stack traces, and a migration step before the API starts. All are listed in `todos.md`.
