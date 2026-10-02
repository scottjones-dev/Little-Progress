import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";

import { buildLocalEnv } from "./plan";

/*
 * `pnpm setup:local`: writes a ready-to-use .env at the repository root so anyone can run
 * the project without an Infisical account. It never overwrites an existing .env unless
 * you pass --force.
 */

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..", "..");
const target = path.join(repoRoot, ".env");
const force = process.argv.includes("--force");

if (existsSync(target) && !force) {
  console.error(
    `${target} already exists, so nothing was changed.\nDelete it or run \`pnpm setup:local --force\` to replace it.`
  );
  process.exit(1);
}

const { lines } = buildLocalEnv();
writeFileSync(target, `${lines.join("\n")}\n`, { mode: 0o600 });

console.log(`Wrote ${target}

Next:
  pnpm infra:up              # Postgres and the S3 emulator in Docker
  pnpm db:migrate:local      # create the database tables
  pnpm storage:init:local    # create the local bucket
  pnpm dev:local             # API, website and app`);
