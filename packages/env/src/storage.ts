import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    S3_ACCESS_KEY_ID: z.string().min(1),
    S3_BUCKET: z.string().min(1),
    S3_ENDPOINT: z.url().optional(),
    S3_FORCE_PATH_STYLE: z.stringbool().default(false),
    S3_REGION: z.string().min(1).default("auto"),
    S3_SECRET_ACCESS_KEY: z.string().min(1),
    STORAGE_DRIVER: z.enum(["s3"]).default("s3"),
  },
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
});
