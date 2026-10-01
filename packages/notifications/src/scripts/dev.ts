import { spawn } from "node:child_process";

import { app } from "@repo/config/app";
import { env } from "@repo/env/notifications";

import { novuDashboardUrl } from "../client";

/**
 * Starts `novu dev`: a tunnel from Novu to the local API's bridge (/api/novu) so Novu can
 * run our code-first workflows. Everything comes from config, nothing is hard-coded:
 * the port and path from @repo/config, the dashboard from NOVU_REGION (the CLI otherwise
 * opens the US dashboard even for an EU account).
 *
 * Runs headless by default so `pnpm dev` does not open a browser tab every time.
 * Pass --open (the `studio` script) to open the Novu dashboard.
 */
const open = process.argv.includes("--open");

const command = [
  "pnpm exec novu dev",
  `--port ${app.api.port}`,
  `--route ${app.api.basePath}/novu`,
  `--dashboard-url ${novuDashboardUrl(env.NOVU_REGION)}`,
  open ? "" : "--headless",
]
  .filter(Boolean)
  .join(" ");

const child = spawn(command, { shell: true, stdio: "inherit" });

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => child.kill(signal));
}
child.on("exit", (code) => process.exit(code ?? 0));
