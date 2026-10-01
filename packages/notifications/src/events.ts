import { renderEmail } from "@repo/emails/registry";
import type { EmailId, EmailPropsMap } from "@repo/emails/registry";
import { z } from "zod";

/** A payload as it arrives from Novu: plain JSON. Each event parses it with its own schema. */
export const rawPayloadSchema = z.record(z.string(), z.json());
export type RawPayload = z.infer<typeof rawPayloadSchema>;

export interface PushContent {
  body: string;
  title: string;
}

export interface EventDefinition<Id extends EmailId> {
  /** Security and account events: the user cannot switch these off in preferences. */
  critical: boolean;
  /** Validates and types the payload. It must match the email template's props. */
  payload: z.ZodType<EmailPropsMap[Id]>;
  /** Short push message. Leave out for email-only events. No sensitive detail. */
  push?: (payload: EmailPropsMap[Id]) => PushContent;
  /** True when this event also sends a push notification. */
  hasPush: boolean;
  /** Renders the email (html, plain text, subject) from the payload. */
  renderEmail: (payload: RawPayload) => ReturnType<typeof renderEmail>;
  /** Builds the push message from the payload. Only call when hasPush is true. */
  renderPush: (payload: RawPayload) => PushContent;
}

const defineEmailEvent = <Id extends EmailId>(
  id: Id,
  definition: Pick<EventDefinition<Id>, "critical" | "payload" | "push">
): EventDefinition<Id> => ({
  ...definition,
  hasPush: Boolean(definition.push),
  renderEmail: (payload) => renderEmail(id, definition.payload.parse(payload)),
  renderPush: (payload) => {
    if (!definition.push) {
      throw new Error(`${id} has no push message`);
    }
    return definition.push(definition.payload.parse(payload));
  },
});

/**
 * The one list of notifications. Adding a notification means adding an entry here;
 * workflows, the typed notify() and the tests all read from it.
 */
export const events = {
  // Unused for now: we are not offering magic-link sign-in. Kept so the template stays covered.
  "magic-link": defineEmailEvent("magic-link", {
    critical: true,
    payload: z.object({
      expiresInMinutes: z.number().int().positive(),
      name: z.string().min(1),
      signInUrl: z.url(),
    }),
  }),
  "new-location-sign-in": defineEmailEvent("new-location-sign-in", {
    critical: true,
    payload: z.object({
      device: z.string().min(1),
      location: z.string().min(1),
      name: z.string().min(1),
      secureAccountUrl: z.url(),
      time: z.string().min(1),
    }),
    push: (payload) => ({
      body: `Signed in from ${payload.location}. Was this you?`,
      title: "New sign-in",
    }),
  }),
  "password-changed": defineEmailEvent("password-changed", {
    critical: true,
    payload: z.object({
      changedAt: z.string().min(1),
      name: z.string().min(1),
      secureAccountUrl: z.url(),
    }),
    push: () => ({
      body: "Your password was changed. Tap to review if this was not you.",
      title: "Password changed",
    }),
  }),
  "reset-password": defineEmailEvent("reset-password", {
    critical: true,
    payload: z.object({
      expiresInMinutes: z.number().int().positive(),
      name: z.string().min(1),
      resetUrl: z.url(),
    }),
  }),
  "verify-email": defineEmailEvent("verify-email", {
    critical: true,
    payload: z.object({
      code: z.string().min(1),
      expiresInMinutes: z.number().int().positive(),
      name: z.string().min(1),
      verifyUrl: z.url(),
    }),
  }),
} satisfies { [Id in EmailId]: EventDefinition<Id> };

export type EventId = keyof typeof events;

/** The payload type for an event, taken from its email template's props. */
export type EventPayload<Id extends EventId> = EmailPropsMap[Id];

// SAFETY: `events` is declared with exactly these keys, so its key list is the EventId union.
export const eventIds = Object.keys(events) as EventId[];
