import { app } from "@repo/config/app";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_API_URL: z.url().default(`http://localhost:${app.api.port}`),
    NEXT_PUBLIC_APP_URL: z.url().default(app.url),
    // Sentry DSN for the web project (public by design; it only allows sending events).
    // PostHog EU project token for the web app (public by design; it only allows sending events).
    NEXT_PUBLIC_POSTHOG_TOKEN: z.string().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
  },
  emptyStringAsUndefined: true,
  runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_POSTHOG_TOKEN: process.env.NEXT_PUBLIC_POSTHOG_TOKEN,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
  server: {},
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
});
