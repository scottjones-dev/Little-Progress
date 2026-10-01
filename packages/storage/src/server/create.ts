import { env } from "@repo/env/storage";

import type { StorageProvider } from "../shared/provider";
import { createS3Provider } from "./s3";

export const createStorage = (): StorageProvider =>
  createS3Provider({
    accessKeyId: env.S3_ACCESS_KEY_ID,
    bucket: env.S3_BUCKET,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    region: env.S3_REGION,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  });
