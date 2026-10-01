import { describe, expect, it } from "vitest";

import { AppError, errorBodySchema, toErrorBody } from "./app-error";
import { errorCodeNames, statusByCode } from "./codes";

describe(AppError, () => {
  it.each(errorCodeNames)("%s has an http status", (code) => {
    expect(new AppError(code, "x").status).toBe(statusByCode[code]);
  });

  it("exposes its message unless it is an INTERNAL error", () => {
    expect(new AppError("NOT_FOUND", "x").expose).toBeTruthy();
    expect(new AppError("INTERNAL", "x").expose).toBeFalsy();
  });

  it("keeps the original error as its cause", () => {
    const cause = new Error("db down");

    expect(new AppError("INTERNAL", "x", { cause }).cause).toBe(cause);
  });
});

describe(toErrorBody, () => {
  it("shows an AppError's code, message and request id", () => {
    const { body, status } = toErrorBody(
      new AppError("NOT_FOUND", "Child not found"),
      "req_1"
    );

    expect(status).toBe(404);
    expect(body).toStrictEqual({
      error: {
        code: "NOT_FOUND",
        message: "Child not found",
        requestId: "req_1",
      },
    });
  });

  it("hides the message of an INTERNAL AppError", () => {
    const { body } = toErrorBody(
      new AppError("INTERNAL", "connection string x")
    );

    expect(body.error.message).not.toContain("connection string");
  });

  it("turns an unknown error into a generic 500 without leaking it", () => {
    const { body, status } = toErrorBody(
      new Error("SELECT * FROM child"),
      "req_2"
    );

    expect(status).toBe(500);
    expect(body.error.code).toBe("INTERNAL");
    expect(JSON.stringify(body)).not.toContain("SELECT");
  });

  it("always produces a body that matches the public schema", () => {
    const { body } = toErrorBody(new AppError("RATE_LIMITED", "Slow down"));

    expect(errorBodySchema.safeParse(body).success).toBeTruthy();
  });
});
