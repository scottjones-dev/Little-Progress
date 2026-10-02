import { parseEvent } from "@repo/analytics/events";
import type { EventName, EventProps } from "@repo/analytics/events";
import {
  beforeSend,
  posthogUiHost,
  propertyDenylist,
  webIngestPath,
} from "@repo/analytics/options";
import { env } from "@repo/env/web";
import { posthog } from "posthog-js";

/*
 * Product and web analytics (PostHog EU). Privacy rules and the event catalog live in
 * @repo/analytics; this file only connects them to posthog-js. Without a token nothing is
 * started and every function below does nothing. See docs/analytics.md.
 */

const token = env.NEXT_PUBLIC_POSTHOG_TOKEN;

// Runs only in the browser: this file is imported from instrumentation-client.ts.
if (token) {
  posthog.init(token, {
    // No flag requests, no autocapture (it reads page text), no recordings, no surveys.
    advanced_disable_flags: true,
    // Events go through our own domain (see the /ingest rewrites in next.config.ts).
    api_host: webIngestPath,
    autocapture: false,
    before_send: beforeSend,
    capture_pageleave: false,
    // Single-page navigation in the App Router counts as a page view.
    capture_pageview: "history_change",
    defaults: "2026-05-30",
    disable_session_recording: true,
    disable_surveys: true,
    // Nothing is stored in cookies or localStorage; a reload is a new anonymous visitor.
    persistence: "memory",
    // Anonymous visitors get no person profile.
    person_profiles: "identified_only",
    property_denylist: propertyDenylist,
    respect_dnt: true,
    ui_host: posthogUiHost,
  });
}

/** Sends one catalog event. An event that does not match the catalog is dropped. */
export const track = <N extends EventName>(name: N, props: EventProps<N>) => {
  const properties = parseEvent(name, props);
  if (token && properties) {
    posthog.capture(name, properties);
  }
};

/** After sign-in. Only the opaque user id: never an email, name or other trait. */
export const identifyUser = (userId: string) => {
  if (token) {
    posthog.identify(userId);
  }
};

/** On sign-out, so the next person on this browser is not linked to the last. */
export const resetAnalytics = () => {
  if (token) {
    posthog.reset();
  }
};

/** The parent's analytics setting. Off means nothing is sent from this browser. */
export const setAnalyticsEnabled = (enabled: boolean) => {
  if (!token) {
    return;
  }
  if (enabled) {
    posthog.opt_in_capturing();
    return;
  }
  track("analytics_opted_out", {});
  posthog.opt_out_capturing();
};
