import { describe, expect, it, vi } from "vitest";

import { createDevices, maxDeviceTokens } from "./devices";

type Update = (
  request: { credentials: { deviceTokens: string[] }; providerId: string },
  subscriberId: string
) => Promise<object>;

const setup = (existing: string[]) => {
  const update = vi.fn<Update>().mockResolvedValue({});
  const retrieve = vi.fn<() => Promise<object>>().mockResolvedValue({
    result: {
      channels: [
        { credentials: { deviceTokens: existing }, providerId: "expo" },
      ],
    },
  });
  // SAFETY: the devices helpers only call subscribers.retrieve and subscribers.credentials.update.
  const client = {
    subscribers: { credentials: { update }, retrieve },
  } as never;
  return { devices: createDevices(client), update };
};

describe("registerDevice", () => {
  it("adds a new token next to the existing ones", async () => {
    const { devices, update } = setup(["ExponentPushToken[a]"]);

    await devices.registerDevice("user_1", "ExponentPushToken[b]");

    expect(update).toHaveBeenCalledWith(
      {
        credentials: {
          deviceTokens: ["ExponentPushToken[a]", "ExponentPushToken[b]"],
        },
        providerId: "expo",
      },
      "user_1"
    );
  });

  it("does nothing when the token is already registered", async () => {
    const { devices, update } = setup(["ExponentPushToken[a]"]);

    await devices.registerDevice("user_1", "ExponentPushToken[a]");

    expect(update).not.toHaveBeenCalled();
  });

  it("keeps only the newest tokens at the cap", async () => {
    const full = Array.from({ length: maxDeviceTokens }, (_, i) => `t${i}`);
    const { devices, update } = setup(full);

    await devices.registerDevice("user_1", "newest");

    const saved = update.mock.calls[0]?.[0].credentials.deviceTokens ?? [];
    expect(saved).toHaveLength(maxDeviceTokens);
    expect(saved.at(-1)).toBe("newest");
    expect(saved).not.toContain("t0");
  });
});

describe("unregisterDevice", () => {
  it("removes only that token", async () => {
    const { devices, update } = setup(["a", "b", "c"]);

    await devices.unregisterDevice("user_1", "b");

    expect(update).toHaveBeenCalledWith(
      { credentials: { deviceTokens: ["a", "c"] }, providerId: "expo" },
      "user_1"
    );
  });

  it("does nothing for an unknown token", async () => {
    const { devices, update } = setup(["a"]);

    await devices.unregisterDevice("user_1", "zzz");

    expect(update).not.toHaveBeenCalled();
  });
});
