import { app } from "@repo/config/app";
import { renderEmail } from "@repo/emails/registry";
import type { EmailId, EmailPropsMap } from "@repo/emails/registry";
import { getT } from "@repo/i18n/core";
import { z } from "zod";

/**
 * Every event can carry the recipient's language. notify() fills it in from the recipient,
 * so callers never put it in the payload themselves.
 */
const localeField = { locale: z.enum(app.i18n.locales).optional() };

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
  "delete-account": defineEmailEvent("delete-account", {
    critical: true,
    payload: z.object({
      ...localeField,
      confirmUrl: z.url(),
      expiresInHours: z.number().int().positive(),
      name: z.string().min(1),
    }),
  }),
  "family-invite": defineEmailEvent("family-invite", {
    critical: true,
    payload: z.object({
      ...localeField,
      expiresInDays: z.number().int().positive(),
      familyName: z.string().min(1),
      inviteUrl: z.url(),
      inviterName: z.string().min(1),
    }),
  }),
  // Unused for now: we are not offering magic-link sign-in. Kept so the template stays covered.
  "magic-link": defineEmailEvent("magic-link", {
    critical: true,
    payload: z.object({
      ...localeField,
      expiresInMinutes: z.number().int().positive(),
      name: z.string().min(1),
      signInUrl: z.url(),
    }),
  }),
  "new-location-sign-in": defineEmailEvent("new-location-sign-in", {
    critical: true,
    payload: z.object({
      ...localeField,
      device: z.string().min(1),
      location: z.string().min(1),
      name: z.string().min(1),
      secureAccountUrl: z.url(),
      time: z.string().min(1),
    }),
    push: (payload) => {
      const t = getT(payload.locale, "push");
      return {
        body: t("newLocationSignIn.body", { location: payload.location }),
        title: t("newLocationSignIn.title"),
      };
    },
  }),
  "password-changed": defineEmailEvent("password-changed", {
    critical: true,
    payload: z.object({
      ...localeField,
      changedAt: z.string().min(1),
      name: z.string().min(1),
      secureAccountUrl: z.url(),
    }),
    push: (payload) => {
      const t = getT(payload.locale, "push");
      return {
        body: t("passwordChanged.body"),
        title: t("passwordChanged.title"),
      };
    },
  }),
  "reset-password": defineEmailEvent("reset-password", {
    critical: true,
    payload: z.object({
      ...localeField,
      expiresInMinutes: z.number().int().positive(),
      name: z.string().min(1),
      resetUrl: z.url(),
    }),
  }),
  "two-factor-changed": defineEmailEvent("two-factor-changed", {
    critical: true,
    payload: z.object({
      ...localeField,
      changedAt: z.string().min(1),
      name: z.string().min(1),
      secureAccountUrl: z.url(),
      state: z.enum(["on", "off"]),
    }),
  }),
  "verify-email": defineEmailEvent("verify-email", {
    critical: true,
    payload: z.object({
      ...localeField,
      code: z.string().min(1).optional(),
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
