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
    // Social sign-in. A provider is only switched on when both of its values are set.
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    MICROSOFT_CLIENT_ID: z.string().min(1).optional(),
    MICROSOFT_CLIENT_SECRET: z.string().min(1).optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    // Passkeys are bound to this domain (no scheme, no port). `localhost` for development.
    PASSKEY_RP_ID: z.string().min(1).default("localhost"),
    // The web app origin, allowed to call the API with cookies.
    WEB_ORIGIN: z.url().default(app.url),
  },
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
});
