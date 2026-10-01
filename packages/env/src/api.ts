import { app } from "@repo/config/app";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    AI_GATEWAY_API_KEY: z.string().min(1).optional(),
    CARER_TOKEN_SECRET: z.string().min(32).optional(),
    DATABASE_URL: z.url().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(app.api.port),
    // Sentry (EU). Errors are only reported when a DSN is set. See docs/error-handling.md.
    SENTRY_DSN: z.url().optional(),
    // Defaults to NODE_ENV when not set.
    SENTRY_ENVIRONMENT: z.string().min(1).optional(),
    // Usually the git commit SHA, set by CI.
    SENTRY_RELEASE: z.string().min(1).optional(),
    WEB_ORIGIN: z.url().default(app.url),
  },
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
});
