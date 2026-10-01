import { app } from "@repo/config/app";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    // 32+ random characters, signs sessions and cookies. Generate with `openssl rand -base64 32`.
    BETTER_AUTH_SECRET: z.string().min(32),
    // Public URL of the API (where /api/auth/* is served). Used to build email links.
    BETTER_AUTH_URL: z.url().default(`http://localhost:${app.api.port}`),
    // The web app origin, allowed to call the API with cookies.
    WEB_ORIGIN: z.url().default(app.url),
  },
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
});
