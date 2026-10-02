import { scrubUrl } from "@repo/errors/scrub";

/*
 * Shared rules for web and native analytics (PostHog EU). This file imports no analytics
 * SDK: each app installs its own and passes these into it.
 */

/** PostHog Cloud EU (Frankfurt). Events never leave the EU. */
export const posthogEuHost = "https://eu.i.posthog.com";

/** Where PostHog's own UI lives, used for toolbar links. */
export const posthogUiHost = "https://eu.posthog.com";

/** On the web, events go through our own domain (Next rewrites) so blockers and CSP are fine. */
export const webIngestPath = "/ingest";

/** The carer quick-log and the pages that carry one-time links are never tracked. */
const untrackedPath =
  /^\/(?:quick-log|reset-password|accept-invitation|delete-account|verify-email)(?:\/|$)/iu;

/** Property names that must never be sent, whatever a caller passes. A backstop only. */
export const propertyDenylist = [
  "birth_date",
  "dob",
  "email",
  "name",
  "note",
  "notes",
  "password",
  "phone",
  "token",
];

/** Properties PostHog fills in that hold a URL or screen name. */
const locationKeys = ["$current_url", "$pathname", "$referrer", "$screen_name"];

const pathOf = (value: string) => {
  try {
    return new URL(value, "http://local.invalid").pathname;
  } catch {
    return value;
  }
};

/** False for pages and screens we never track. Accepts a path or a full URL. */
export const isTrackedPath = (pathOrUrl: string) =>
  !untrackedPath.test(pathOf(pathOrUrl));

export interface CaptureEvent {
  event: string;
  properties?: Record<string, unknown>;
}

const scrubProperties = (properties: Record<string, unknown>) => {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (propertyDenylist.includes(key)) {
      continue;
    }
    clean[key] =
      locationKeys.includes(key) && value !== undefined && value !== null
        ? scrubUrl(String(value))
        : value;
  }
  return clean;
};

/**
 * For the SDK's `before_send`. Returns null to drop the event (untracked page or screen),
 * otherwise the event with secrets removed from URLs and denylisted properties removed.
 */
export const beforeSend = <E extends CaptureEvent>(
  event: E | null
): E | null => {
  if (!event?.properties) {
    return event;
  }
  const { properties } = event;
  const where = locationKeys
    .map((key) => properties[key])
    .filter((value) => value !== undefined && value !== null)
    .map(String);
  if (where.some((value) => !isTrackedPath(value))) {
    return null;
  }
  return { ...event, properties: scrubProperties(properties) };
};
