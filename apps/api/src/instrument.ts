import { env } from "@repo/env/api";
import { baseSentryOptions } from "@repo/errors/options";
import * as Sentry from "@sentry/hono/node";

/*
 * Sentry must start before the app loads so it can instrument libraries, so this file is
 * loaded with node's --import flag (see the dev and start scripts in package.json).
 * Without SENTRY_DSN nothing is sent. What is scrubbed and why: docs/error-handling.md.
 */
Sentry.init(
  baseSentryOptions({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
    release: env.SENTRY_RELEASE,
  })
);
