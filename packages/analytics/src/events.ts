import { entryKinds } from "@repo/db/vocab";
import { z } from "zod";

/*
 * The only events we send to analytics. Each has a strict schema of coarse values: enums,
 * booleans and buckets, never free text. That is how "nothing about the child leaves the
 * app" is enforced in code: a property that is not listed here cannot be sent, and a string
 * that is not one of the listed options is rejected.
 */

/** How long a parent took from opening the form to saving, in buckets (not exact times). */
const secondsToLog = ["under_15", "15_to_30", "30_to_60", "over_60"] as const;

const signInMethods = ["password", "google", "microsoft", "passkey"] as const;

const noProps = z.strictObject({});

export const eventSchemas = {
  analytics_opted_out: noProps,
  entry_logged: z.strictObject({
    kind: z.enum(entryKinds),
    seconds_to_log: z.enum(secondsToLog),
    source: z.enum(["app", "web"]),
  }),
  family_created: noProps,
  insight_viewed: noProps,
  invite_accepted: noProps,
  invite_sent: noProps,
  report_generated: noProps,
  report_printed: noProps,
  sign_in_completed: z.strictObject({ method: z.enum(signInMethods) }),
  sign_up_completed: noProps,
} as const;

export type EventName = keyof typeof eventSchemas;
export type EventProps<N extends EventName> = z.infer<(typeof eventSchemas)[N]>;

/** What an analytics SDK accepts as event properties. */
export type PropertyBag = Record<string, boolean | number | string>;

/**
 * Checks an event against the catalog. Returns the properties to send, or null when they
 * do not match (the caller drops the event instead of sending something unexpected).
 */
export const parseEvent = <N extends EventName>(
  name: N,
  props: EventProps<N>
): PropertyBag | null => {
  const schema: z.ZodType<PropertyBag> = eventSchemas[name];
  const result = schema.safeParse(props);
  return result.success ? result.data : null;
};
