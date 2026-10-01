import { env } from "@repo/env/web";
import { baseSentryOptions } from "@repo/errors/options";
import * as Sentry from "@sentry/nextjs";

// Runs in the browser before the app is interactive. No Session Replay on purpose:
// the screens show a child's health diary (see docs/error-handling.md).
Sentry.init(
  baseSentryOptions({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
  })
);
