import { app } from "@repo/config/app";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_API_URL: z.url().default(`http://localhost:${app.api.port}`),
    NEXT_PUBLIC_APP_URL: z.url().default(app.url),
  },
  emptyStringAsUndefined: true,
  runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  server: {},
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
});
