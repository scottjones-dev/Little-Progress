import { app } from "@repo/config/app";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  client: {
    EXPO_PUBLIC_API_URL: z.url().default(`http://localhost:${app.api.port}`),
    // PostHog EU project token for the native app (public by design; it only allows sending events).
    EXPO_PUBLIC_POSTHOG_TOKEN: z.string().optional(),
    // Sentry DSN for the native project (public by design; it only allows sending events).
    EXPO_PUBLIC_SENTRY_DSN: z.url().optional(),
  },
  clientPrefix: "EXPO_PUBLIC_",
  emptyStringAsUndefined: true,
  runtimeEnv: {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_POSTHOG_TOKEN: process.env.EXPO_PUBLIC_POSTHOG_TOKEN,
    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  },
});
