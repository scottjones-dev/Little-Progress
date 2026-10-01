import { serve } from "@hono/node-server";
import { app as appConfig } from "@repo/config/app";

import { app } from "./app";

const port = Number(process.env.PORT ?? appConfig.api.port);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(
    `${appConfig.name} API listening on http://localhost:${info.port}`
  );
});
