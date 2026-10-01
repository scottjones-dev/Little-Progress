import { Client } from "@novu/framework";
import { serve } from "@novu/framework/hono";
import { env } from "@repo/env/notifications";
import type { Context } from "hono";

import { novuApiUrl } from "./client";
import { workflows } from "./workflows";

let handler: ReturnType<typeof serve> | null = null;

/**
 * The endpoint Novu calls to run our workflows. Mount it in the API at /api/novu.
 * Novu signs requests with NOVU_SECRET_KEY. Without a key (local dev without Novu)
 * it answers 503 instead of stopping the whole API from starting.
 */
export const bridge = async (c: Context): Promise<Response> => {
  const secretKey = env.NOVU_SECRET_KEY;
  if (!secretKey) {
    return c.json({ error: "Novu is not configured" }, 503);
  }
  handler ??= serve({
    client: new Client({
      apiUrl: novuApiUrl(env.NOVU_REGION),
      secretKey,
      strictAuthentication: true,
    }),
    workflows,
  });
  return await handler(c);
};
