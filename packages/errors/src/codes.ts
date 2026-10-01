export const errorCodeNames = [
  "CONFLICT",
  "FORBIDDEN",
  "INTERNAL",
  "NOT_FOUND",
  "RATE_LIMITED",
  "STALE_VERSION",
  "UNAUTHORIZED",
  "VALIDATION_FAILED",
] as const;

export type ErrorCode = (typeof errorCodeNames)[number];

/** The HTTP status each code is sent with. Clients branch on the code, never the text. */
export const statusByCode = {
  CONFLICT: 409,
  FORBIDDEN: 403,
  INTERNAL: 500,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  // An edit used an out-of-date version (If-Match), see the sync contract in docs/plan.md.
  STALE_VERSION: 412,
  UNAUTHORIZED: 401,
  VALIDATION_FAILED: 422,
} as const satisfies Record<ErrorCode, number>;
