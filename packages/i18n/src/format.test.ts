import { describe, expect, it } from "vitest";

import { formatDate, formatDateTime, formatList, formatNumber } from "./format";

const moment = new Date("2026-10-01T13:32:00Z");

describe("formatting", () => {
  it("writes English dates the UK way with 24 hour time", () => {
    expect(formatDateTime(moment, "en", "UTC")).toBe("1 October 2026 at 13:32");
    expect(formatDate(moment, "en", "UTC")).toBe("1 October 2026");
  });

  it("writes dates in the person's language", () => {
    expect(formatDate(moment, "pl", "UTC")).toBe("1 października 2026");
    expect(formatDate(moment, "es", "UTC")).toBe("1 de octubre de 2026");
    expect(formatDate(moment, "cy", "UTC")).toBe("1 Hydref 2026");
  });

  it("uses English for an unknown language", () => {
    expect(formatDate(moment, "fr", "UTC")).toBe("1 October 2026");
    expect(formatDate(moment, undefined, "UTC")).toBe("1 October 2026");
  });

  it("formats numbers per language", () => {
    expect(formatNumber(1234.5, "en")).toBe("1,234.5");
    expect(formatNumber(1234.5, "es")).toBe("1234,5");
  });

  it("joins lists with the right word", () => {
    expect(formatList(["milk", "sleep", "nappy"], "en")).toBe(
      "milk, sleep and nappy"
    );
    expect(formatList(["mleko", "sen"], "pl")).toBe("mleko i sen");
  });
});
