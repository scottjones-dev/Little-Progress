import { scrubBreadcrumb, scrubEvent } from "./scrub";

interface SentryBaseInput {
  /** The project's DSN. Without one, Sentry stays off and nothing is sent. */
  dsn?: string;
  environment: string;
  /** Usually the git commit SHA, set by CI. */
  release?: string;
}

/**
 * The Sentry options every runtime shares. Each app passes the result to its own
 * `Sentry.init(...)`.
 *
 * Privacy (the app holds a child's health diary):
 * - sendDefaultPii is off, and events and breadcrumbs go through the scrubbers.
 * - There is deliberately no replay, screenshot, view-hierarchy or profiling integration here.
 *   Do not add one without a privacy review.
 */
export const baseSentryOptions = ({
  dsn,
  environment,
  release,
}: SentryBaseInput) => ({
  beforeBreadcrumb: scrubBreadcrumb,
  beforeSend: scrubEvent,
  dsn,
  enabled: Boolean(dsn),
  environment,
  // Expected noise: cancelled requests, a browser quirk, and being offline (the app is offline-first).
  ignoreErrors: [
    "AbortError",
    "Network request failed",
    "ResizeObserver loop completed with undelivered notifications",
  ],
  release,
  sendDefaultPii: false,
  // Errors are always sent; only performance traces are sampled.
  tracesSampleRate: environment === "development" ? 1 : 0.1,
});
