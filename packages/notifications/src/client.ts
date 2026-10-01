import { Novu } from "@novu/api";
import { env } from "@repo/env/notifications";

export const novuApiUrl = (region: "eu" | "us") =>
  region === "eu" ? "https://eu.api.novu.co" : "https://api.novu.co";

/** The Novu dashboard for a region. `novu dev` opens the US one unless told otherwise. */
export const novuDashboardUrl = (region: "eu" | "us") =>
  region === "eu"
    ? "https://eu.dashboard.novu.co"
    : "https://dashboard.novu.co";

let client: Novu | null = null;

/** The shared Novu client, or null when NOVU_SECRET_KEY is not set (local dev without Novu). */
export const getNovu = () => {
  if (!env.NOVU_SECRET_KEY) {
    return null;
  }
  client ??= new Novu({
    secretKey: env.NOVU_SECRET_KEY,
    serverURL: novuApiUrl(env.NOVU_REGION),
  });
  return client;
};
