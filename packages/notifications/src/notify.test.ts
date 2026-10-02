import { registry } from "@repo/emails/registry";
import { describe, expect, it, vi } from "vitest";

import { createNotify } from "./notify";

const payload = registry["password-changed"].previewProps;
const to = { email: "alex@example.test", subscriberId: "user_1" };

type Trigger = () => Promise<object>;
type Log = (message: string, details: Record<string, string>) => void;

const setup = (trigger = vi.fn<Trigger>().mockResolvedValue({})) => {
  const log = vi.fn<Log>();
  const notify = createNotify({
    // SAFETY: notify only calls trigger(); the rest of the Novu client is never touched.
    client: { trigger } as never,
    log,
  });
  return { log, notify, trigger };
};

describe("notify", () => {
  it("triggers the workflow named after the event, for the subscriber", async () => {
    const { notify, trigger } = setup();

    await notify("password-changed", {
      idempotencyKey: "pc-1",
      payload,
      to: { ...to, locale: "en-GB" },
    });

    expect(trigger).toHaveBeenCalledWith({
      payload: { ...payload, locale: "en" },
      to: {
        email: "alex@example.test",
        locale: "en-GB",
        phone: undefined,
        subscriberId: "user_1",
      },
      transactionId: "pc-1",
      workflowId: "password-changed",
    });
  });

  it("passes the recipient's language to the workflow, ignoring the region", async () => {
    const { notify, trigger } = setup();

    await notify("password-changed", {
      payload,
      to: { ...to, locale: "pl-PL" },
    });

    expect(trigger).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { ...payload, locale: "pl" } })
    );
  });

  it("sends no language for an unsupported one, so the message is English", async () => {
    const { notify, trigger } = setup();

    await notify("password-changed", { payload, to: { ...to, locale: "fr" } });

    expect(trigger).toHaveBeenCalledWith(expect.objectContaining({ payload }));
  });

  it("does not send an invalid payload and logs why", async () => {
    const { log, notify, trigger } = setup();

    await notify("password-changed", {
      // SAFETY: deliberately wrong shape to prove runtime validation catches it.
      payload: { name: "Alex" } as never,
      to,
    });

    expect(trigger).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(
      "notify failed",
      expect.objectContaining({
        eventId: "password-changed",
        subscriberId: "user_1",
      })
    );
  });

  it("never throws when Novu fails", async () => {
    const { log, notify } = setup(
      vi.fn<Trigger>().mockRejectedValue(new Error("503"))
    );

    await expect(
      notify("password-changed", { payload, to })
    ).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith(
      "notify failed",
      expect.objectContaining({ error: "503" })
    );
  });

  it("does not put the payload (one-time links) in the logs", async () => {
    const { log, notify } = setup(
      vi.fn<Trigger>().mockRejectedValue(new Error("boom"))
    );

    await notify("password-changed", { payload, to });

    expect(JSON.stringify(log.mock.calls)).not.toContain(
      payload.secureAccountUrl
    );
  });

  it("skips quietly when Novu is not configured", async () => {
    const log = vi.fn<Log>();
    const notify = createNotify({ client: null, log });

    await notify("password-changed", { payload, to });

    expect(log).toHaveBeenCalledWith("notify skipped: Novu is not configured", {
      eventId: "password-changed",
    });
  });
});
