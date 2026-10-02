import type { Novu } from "@novu/api";
import { toLocale } from "@repo/i18n/resolve";
import { z } from "zod";

import { getNovu } from "./client";
import { events } from "./events";
import type { EventId, EventPayload } from "./events";

export interface Recipient {
  email?: string;
  locale?: string;
  phone?: string;
  /** Our user id. Novu creates or updates the subscriber on every send. */
  subscriberId: string;
}

export interface NotifyInput<Id extends EventId> {
  /** Pass the same key when retrying so the user is not notified twice. */
  idempotencyKey?: string;
  payload: EventPayload<Id>;
  to: Recipient;
}

interface Deps {
  client: Pick<Novu, "trigger"> | null;
  log: (message: string, details: Record<string, string>) => void;
}

const sdkErrorSchema = z.object({ body: z.string() });
const bodyMessageSchema = z.object({ message: z.string() });

/**
 * The most useful one-line reason for a failed send. Novu's SDK hides the real reason
 * (for example `workflow_not_found`) behind "Response validation failed", so prefer the
 * message in the HTTP body when there is one. Never includes the payload.
 */
const describeError = (error: Error) => {
  const sdkError = sdkErrorSchema.safeParse(error);
  if (sdkError.success) {
    try {
      const body = bodyMessageSchema.safeParse(JSON.parse(sdkError.data.body));
      if (body.success) {
        return body.data.message;
      }
    } catch {
      // The body was not JSON; fall back to the error message.
    }
  }
  return error.message;
};

/**
 * Builds notify() with its dependencies. Tests pass fakes; the app uses the default below.
 * The returned function never throws, so callers can write `void notify(...)`.
 */
export const createNotify =
  ({ client, log }: Deps) =>
  async <Id extends EventId>(
    eventId: Id,
    { idempotencyKey, payload, to }: NotifyInput<Id>
  ): Promise<void> => {
    try {
      if (!client) {
        log("notify skipped: Novu is not configured", { eventId });
        return;
      }
      const validPayload = events[eventId].payload.parse(payload);
      // The email and push text follow the recipient's language. An unknown one means English.
      const locale = toLocale(to.locale);
      await client.trigger({
        payload: locale ? { ...validPayload, locale } : validPayload,
        to: {
          email: to.email,
          locale: to.locale,
          phone: to.phone,
          subscriberId: to.subscriberId,
        },
        transactionId: idempotencyKey,
        workflowId: eventId,
      });
    } catch (error) {
      // Log the event and subscriber only, never the payload (it holds one-time links).
      log("notify failed", {
        error: error instanceof Error ? describeError(error) : String(error),
        eventId,
        subscriberId: to.subscriberId,
      });
    }
  };

/**
 * Tell a user something happened.
 *
 * @example
 * void notify("password-changed", {
 *   to: { subscriberId: user.id, email: user.email },
 *   payload: { name, changedAt, secureAccountUrl },
 * });
 */
export const notify = <Id extends EventId>(
  eventId: Id,
  input: NotifyInput<Id>
) =>
  createNotify({
    client: getNovu(),
    log: (message, details) =>
      console.warn(`[notifications] ${message}`, details),
  })(eventId, input);
