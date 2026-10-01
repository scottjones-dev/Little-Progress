import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { bridge } from "./bridge";

describe("bridge without NOVU_SECRET_KEY", () => {
  it("answers 503 instead of crashing", async () => {
    const app = new Hono().all("/novu", bridge);

    const res = await app.request("/novu");

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toStrictEqual({
      error: "Novu is not configured",
    });
  });
});
