import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
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
