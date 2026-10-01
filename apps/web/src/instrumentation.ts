import { env } from "@repo/env/web";
import { baseSentryOptions } from "@repo/errors/options";
import * as Sentry from "@sentry/nextjs";

// Next calls this once per server runtime (Node and edge). Without a DSN nothing is sent.
export const register = () => {
  Sentry.init(
    baseSentryOptions({
      dsn: env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
    })
  );
};

// Reports errors thrown while rendering on the server.
export const onRequestError = Sentry.captureRequestError;
