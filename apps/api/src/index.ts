import { serve } from "@hono/node-server";
import { app as appConfig } from "@repo/config/app";
import { env } from "@repo/env/api";

import { app } from "./app";

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(
    `${appConfig.name} API listening on http://localhost:${info.port}`
  );
});
