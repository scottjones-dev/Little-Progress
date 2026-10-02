import { parseEvent } from "@repo/analytics/events";
import type { EventName, EventProps } from "@repo/analytics/events";
import { beforeSend, posthogEuHost } from "@repo/analytics/options";
import { env } from "@repo/env/native";
import PostHog from "posthog-react-native";

/*
 * Product analytics for the app (PostHog EU). Privacy rules and the event catalog live in
 * @repo/analytics; this file only connects them to posthog-react-native. Without a token
 * `analytics` is null and every function below does nothing. See docs/analytics.md.
 */

const token = env.EXPO_PUBLIC_POSTHOG_TOKEN;

export const analytics = token
  ? new PostHog(token, {
      before_send: beforeSend,
      // No lifecycle events, no session replay, no flag requests.
      captureAppLifecycleEvents: false,
      enableSessionReplay: false,
      host: posthogEuHost,
      persistence: "file",
      // Anonymous users get no person profile.
      personProfiles: "identified_only",
      preloadFeatureFlags: false,
    })
  : null;

/** Sends one catalog event. An event that does not match the catalog is dropped. */
export const track = <N extends EventName>(name: N, props: EventProps<N>) => {
  const properties = parseEvent(name, props);
  if (analytics && properties) {
    analytics.capture(name, properties);
  }
};

/** Records a screen view. Screens we never track (the carer quick-log) are dropped by beforeSend. */
export const trackScreen = (pathname: string) => {
  if (analytics) {
    analytics.screen(pathname);
  }
};

/** After sign-in. Only the opaque user id: never an email, name or other trait. */
export const identifyUser = (userId: string) => {
  analytics?.identify(userId);
};

/** On sign-out, so the next person on this device is not linked to the last. */
export const resetAnalytics = () => {
  analytics?.reset();
};

/** The parent's analytics setting. Off means nothing is sent from this device. */
export const setAnalyticsEnabled = async (enabled: boolean) => {
  if (!analytics) {
    return;
  }
  if (enabled) {
    await analytics.optIn();
    return;
  }
  track("analytics_opted_out", {});
  await analytics.optOut();
};
