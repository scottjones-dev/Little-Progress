import { z } from "zod";

import { errorCodeNames, statusByCode } from "./codes";
import type { ErrorCode } from "./codes";

/** The HTTP statuses an error body can be sent with. */
export type ErrorStatus = (typeof statusByCode)[ErrorCode];

interface AppErrorOptions {
  cause?: unknown;
  /** Whether the message is safe to show to the user. Defaults to true except for INTERNAL. */
  expose?: boolean;
}

/**
 * An error we expect and can explain. Throw it from an API handler and the API turns it
 * into the standard error body with the right status. Anything that is not an AppError is
 * treated as a bug: it is reported to Sentry and the user sees a generic message.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly expose: boolean;

  constructor(code: ErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.expose = options.expose ?? code !== "INTERNAL";
  }

  get status() {
    return statusByCode[this.code];
  }
}

/** The shape of every error the API returns. Clients parse this and branch on `code`. */
export const errorBodySchema = z.object({
  error: z.object({
    code: z.enum(errorCodeNames),
    message: z.string(),
    requestId: z.string().optional(),
  }),
});

export type ErrorBody = z.infer<typeof errorBodySchema>;

const genericMessage = "Something went wrong. Please try again.";

export interface ErrorResponse {
  body: ErrorBody;
  status: ErrorStatus;
}

/** Turns any thrown value into a status and a body that is safe to send to a client. */
export const toErrorBody = (
  error: Error,
  requestId?: string
): ErrorResponse => {
  if (error instanceof AppError) {
    return {
      body: {
        error: {
          code: error.code,
          message: error.expose ? error.message : genericMessage,
          requestId,
        },
      },
      status: error.status,
    };
  }
  // Unknown errors are bugs: never leak their message, stack or cause.
  return {
    body: { error: { code: "INTERNAL", message: genericMessage, requestId } },
    status: statusByCode.INTERNAL,
  };
};
