import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Analytics goes through our own domain like the Sentry tunnel, so blockers and a strict
  // CSP are fine. These are PostHog's documented EU rewrites; /ingest matches webIngestPath
  // in @repo/analytics.
  rewrites() {
    return [
      {
        destination: "https://eu-assets.i.posthog.com/static/:path*",
        source: "/ingest/static/:path*",
      },
      {
        destination: "https://eu-assets.i.posthog.com/array/:path*",
        source: "/ingest/array/:path*",
      },
      {
        destination: "https://eu.i.posthog.com/:path*",
        source: "/ingest/:path*",
      },
    ];
  },
  // PostHog's API paths end in a slash; do not redirect them away.
  skipTrailingSlashRedirect: true,
};

// Source maps (readable stack traces) are uploaded only when SENTRY_AUTH_TOKEN is set,
// so local builds and CI without the token still pass.
export default withSentryConfig(nextConfig, {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  sentryUrl: "https://de.sentry.io/",
  silent: !process.env.CI,
  // Browser events go through our own domain so ad blockers do not drop them.
  tunnelRoute: "/monitoring",
});
