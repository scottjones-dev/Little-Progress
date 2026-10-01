import { auth } from "@repo/auth/auth";
import { app as appConfig } from "@repo/config/app";
import { env } from "@repo/env/api";
import { bridge } from "@repo/notifications/bridge";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

import { sessionMiddleware } from "./middleware/session";
import type { SessionEnv } from "./middleware/session";

export const app = new Hono<SessionEnv>()
  .basePath(appConfig.api.basePath)
  .use(secureHeaders())
  // CORS must be registered before the auth route (Better Auth's Hono guide).
  .use(
    cors({
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["POST", "GET", "OPTIONS"],
      credentials: true,
      exposeHeaders: ["Content-Length"],
      maxAge: 600,
      origin: [env.WEB_ORIGIN],
    })
  )
  .get("/", (c) => c.json({ name: appConfig.name }))
  .get("/healthz", (c) => c.json({ ok: true }))
  // Better Auth: sign-up, sign-in, verify email, reset password, ... at /api/auth/*.
  .on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw))
  // The signed-in user, or 401.
  .get("/me", sessionMiddleware, (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    return c.json({
      user: {
        email: user.email,
        emailVerified: user.emailVerified,
        id: user.id,
        name: user.name,
      },
    });
  })
  // Novu calls this to run notification workflows (see packages/notifications).
  .all("/novu", bridge);

export type AppType = typeof app;
