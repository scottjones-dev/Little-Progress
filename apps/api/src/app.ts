import { auth } from "@repo/auth/auth";
import { app as appConfig } from "@repo/config/app";
import { env } from "@repo/env/api";
import { AppError, toErrorBody } from "@repo/errors/app-error";
import { bridge } from "@repo/notifications/bridge";
import * as Sentry from "@sentry/hono/node";
import { sentry } from "@sentry/hono/node";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";

import { sessionMiddleware } from "./middleware/session";
import type { SessionEnv } from "./middleware/session";

const base = new Hono<SessionEnv>().basePath(appConfig.api.basePath);

// Every response carries a request id, and so does every error body and Sentry event.
base.use(requestId());
// Sentry middleware goes early. It reports unhandled errors (5xx) and ignores 3xx and 4xx.
base.use(sentry(base));
// Lets us find the Sentry issue for an error id a user quotes from the response.
base.use(async (c, next) => {
  Sentry.setTag("request_id", c.get("requestId"));
  return await next();
});

// One error shape for the whole API: { error: { code, message, requestId } }.
// AppError becomes its own status; anything else is a bug and shows a generic 500.
base.onError((thrown, c) => {
  if (thrown instanceof HTTPException) {
    return thrown.getResponse();
  }
  const { body, status } = toErrorBody(thrown, c.get("requestId"));
  return c.json(body, status);
});
base.notFound((c) => {
  const { body, status } = toErrorBody(
    new AppError("NOT_FOUND", "Not found"),
    c.get("requestId")
  );
  return c.json(body, status);
});

export const app = base
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
  // Development only: proves error handling and Sentry reporting work end to end.
  .get("/_debug/error", () => {
    if (env.NODE_ENV === "production") {
      throw new AppError("NOT_FOUND", "Not found");
    }
    throw new Error("Debug error: this is a test of error reporting");
  })
  // Novu calls this to run notification workflows (see packages/notifications).
  .all("/novu", bridge);

export type AppType = typeof app;
