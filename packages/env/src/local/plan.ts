import { generateSecret } from "../seed/plan";

/*
 * What `pnpm setup:local` writes to a new .env: everything needed to run the project on
 * one machine with no accounts, using the Docker services in infra/. The values are the
 * disposable local ones (the Postgres and S3 emulator defaults) plus fresh random secrets.
 * Anything that needs an account (Novu, Sentry, PostHog, Google sign-in) is left out, and
 * the features that use it switch themselves off.
 */

export interface LocalEnv {
  /** Lines for the .env file, in order. Comments start with #. */
  lines: string[];
  /** Just the key/value pairs, for tests and for printing a summary. */
  values: Record<string, string>;
}

const LOCAL_WEB_URL = "http://localhost:3000";
const LOCAL_API_URL = "http://localhost:9000";

export const buildLocalEnv = (
  generate: () => string = generateSecret
): LocalEnv => {
  const sections: { comment: string; values: Record<string, string> }[] = [
    {
      comment:
        "Random secrets for this machine only. Never reuse them anywhere else.",
      values: {
        BETTER_AUTH_SECRET: generate(),
        CARER_TOKEN_SECRET: generate(),
      },
    },
    {
      comment: "API",
      values: {
        BETTER_AUTH_URL: LOCAL_API_URL,
        NODE_ENV: "development",
        PASSKEY_RP_ID: "localhost",
        PORT: "9000",
        WEB_ORIGIN: LOCAL_WEB_URL,
      },
    },
    {
      comment: "Local Postgres (pnpm infra:postgres:up)",
      values: {
        DATABASE_URL:
          "postgres://postgres:postgres@localhost:5432/littleprogress",
      },
    },
    {
      comment: "Local S3 emulator (pnpm infra:storage:up)",
      values: {
        S3_ACCESS_KEY_ID: "test",
        S3_BUCKET: "littleprogress-dev",
        S3_ENDPOINT: "http://localhost:4566",
        S3_FORCE_PATH_STYLE: "true",
        S3_REGION: "us-east-1",
        S3_SECRET_ACCESS_KEY: "test",
        STORAGE_DRIVER: "s3",
      },
    },
    {
      comment: "Web and app",
      values: {
        EXPO_PUBLIC_API_URL: LOCAL_API_URL,
        NEXT_PUBLIC_API_URL: LOCAL_API_URL,
        NEXT_PUBLIC_APP_URL: LOCAL_WEB_URL,
      },
    },
  ];

  const lines: string[] = [
    "# Written by `pnpm setup:local`. Local development only; this file is git-ignored.",
    "# Optional services (Novu, Sentry, PostHog, Google and Microsoft sign-in) are described in",
    "# .env.example. Leave them out and those features stay off.",
  ];
  const values: Record<string, string> = {};
  for (const { comment, values: group } of sections) {
    lines.push("", `# ${comment}`);
    for (const [key, value] of Object.entries(group)) {
      lines.push(`${key}=${value}`);
      values[key] = value;
    }
  }
  return { lines, values };
};
