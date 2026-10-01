import { app } from "@repo/config/app";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    AI_GATEWAY_API_KEY: z.string().min(1).optional(),
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    CARER_TOKEN_SECRET: z.string().min(32).optional(),
    DATABASE_URL: z.url().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(app.api.port),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_ACCOUNT_ID: z.string().min(1).optional(),
    R2_BUCKET: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    WEB_ORIGIN: z.url().default(app.url),
  },
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
});
