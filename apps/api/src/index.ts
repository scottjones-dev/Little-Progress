import { serve } from "@hono/node-server";
import { app as appConfig } from "@repo/config/app";
import { env } from "@repo/env/api";
import * as Sentry from "@sentry/hono/node";

import { app } from "./app";

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(
    `${appConfig.name} API listening on http://localhost:${info.port}`
  );
});

// Send any events still waiting before the process exits (Sentry needs a moment to flush).
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await Sentry.close(2000);
    process.exit(0);
  });
}
