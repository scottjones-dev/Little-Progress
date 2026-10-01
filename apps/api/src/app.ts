import { app as appConfig } from "@repo/config/app";
import { env } from "@repo/env/api";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

export const app = new Hono()
  .basePath(appConfig.api.basePath)
  .use(secureHeaders())
  .use(cors({ origin: [env.WEB_ORIGIN] }))
  .get("/", (c) => c.json({ name: appConfig.name }))
  .get("/healthz", (c) => c.json({ ok: true }));

export type AppType = typeof app;
