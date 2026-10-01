import { randomBytes } from "node:crypto";

export const ENVIRONMENTS = ["dev", "staging", "prod"] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

export type Folder = "/api" | "/web" | "/native";

/** A secret we know how to fill in ourselves. */
interface AutoSecret {
  folder: Folder;
  key: string;
  value: string;
}

/** A secret only the user can provide (it comes from a third-party dashboard). */
export interface ManualSecret {
  folder: Folder;
  hint: string;
  key: string;
}

export interface SeedPlan {
  auto: AutoSecret[];
  manual: ManualSecret[];
}

/** 32 random bytes is 43 base64url chars, comfortably over the 32-char minimum in @repo/env. */
const SECRET_BYTES = 32;

export const generateSecret = (): string =>
  randomBytes(SECRET_BYTES).toString("base64url");

const LOCAL_WEB_URL = "http://localhost:3000";
const LOCAL_API_URL = "http://localhost:9000";

/**
 * Decides which keys can be filled automatically for an environment and which
 * need a human. Pure (apart from `generate`, injectable for tests) so it is easy to test.
 *
 * - Random signing secrets are always generated: each environment gets its own.
 * - Localhost URLs are only defaulted for `dev`.
 * - Anything from a vendor dashboard (database, R2, Novu, AI Gateway) is manual everywhere.
 */
export const buildSeedPlan = (
  environment: Environment,
  generate: () => string = generateSecret
): SeedPlan => {
  const isDev = environment === "dev";

  const auto: AutoSecret[] = [
    { folder: "/api", key: "BETTER_AUTH_SECRET", value: generate() },
    { folder: "/api", key: "CARER_TOKEN_SECRET", value: generate() },
    {
      folder: "/api",
      key: "NODE_ENV",
      value: isDev ? "development" : "production",
    },
    { folder: "/api", key: "PORT", value: "9000" },
    { folder: "/api", key: "STORAGE_DRIVER", value: "s3" },
    { folder: "/api", key: "S3_REGION", value: "auto" },
    { folder: "/api", key: "S3_FORCE_PATH_STYLE", value: "false" },
    { folder: "/api", key: "NOVU_REGION", value: "eu" },
  ];

  const manual: ManualSecret[] = [
    {
      folder: "/api",
      hint: "Neon or Supabase connection string",
      key: "DATABASE_URL",
    },
    {
      folder: "/api",
      hint: "Cloudflare R2 > bucket > Settings > S3 API",
      key: "S3_ENDPOINT",
    },
    { folder: "/api", hint: "R2 bucket name", key: "S3_BUCKET" },
    {
      folder: "/api",
      hint: "R2 > Manage API Tokens",
      key: "S3_ACCESS_KEY_ID",
    },
    {
      folder: "/api",
      hint: "R2 > Manage API Tokens",
      key: "S3_SECRET_ACCESS_KEY",
    },
    {
      folder: "/api",
      hint: "https://dashboard.novu.co/api-keys",
      key: "NOVU_SECRET_KEY",
    },
    {
      folder: "/api",
      hint: "Vercel dashboard > AI Gateway > API Keys",
      key: "AI_GATEWAY_API_KEY",
    },
  ];

  // URLs: localhost is correct for dev, but a deployed environment needs its real hostnames.
  const urls: [Folder, string, string][] = [
    ["/api", "WEB_ORIGIN", LOCAL_WEB_URL],
    ["/web", "NEXT_PUBLIC_API_URL", LOCAL_API_URL],
    ["/web", "NEXT_PUBLIC_APP_URL", LOCAL_WEB_URL],
    ["/native", "EXPO_PUBLIC_API_URL", LOCAL_API_URL],
  ];
  for (const [folder, key, localValue] of urls) {
    if (isDev) {
      auto.push({ folder, key, value: localValue });
    } else {
      manual.push({ folder, hint: "deployed https URL", key });
    }
  }

  return { auto, manual };
};
