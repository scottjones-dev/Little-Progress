import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    // Optional so the API still boots without Novu in local dev; notify() then logs and skips.
    NOVU_REGION: z.enum(["eu", "us"]).default("eu"),
    NOVU_SECRET_KEY: z.string().min(1).optional(),
  },
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
});
