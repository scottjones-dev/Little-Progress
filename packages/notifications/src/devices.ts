import type { Novu } from "@novu/api";
import { ChatOrPushProviderEnum } from "@novu/api/models/components";

import { getNovu } from "./client";

/** Novu allows at most 100 device tokens per subscriber and provider. */
export const maxDeviceTokens = 100;

type SubscribersApi = Pick<Novu, "subscribers">;

const tokensOf = async (client: SubscribersApi, subscriberId: string) => {
  const { result } = await client.subscribers.retrieve(subscriberId);
  const channel = result.channels?.find(
    (c) => c.providerId === ChatOrPushProviderEnum.Expo
  );
  return channel?.credentials.deviceTokens ?? [];
};

const save = async (
  client: SubscribersApi,
  subscriberId: string,
  deviceTokens: string[]
) => {
  await client.subscribers.credentials.update(
    {
      credentials: { deviceTokens },
      providerId: ChatOrPushProviderEnum.Expo,
    },
    subscriberId
  );
};

/** Device-token helpers for Expo push. Tests pass a fake client. */
export const createDevices = (client: SubscribersApi) => ({
  /** Add an Expo push token to a user. Safe to call again with the same token. */
  async registerDevice(subscriberId: string, expoToken: string) {
    const existing = await tokensOf(client, subscriberId);
    if (existing.includes(expoToken)) {
      return;
    }
    // Keep the newest tokens if the cap is reached.
    await save(
      client,
      subscriberId,
      [...existing, expoToken].slice(-maxDeviceTokens)
    );
  },

  /** Remove one token (for example on sign-out). Other devices are untouched. */
  async unregisterDevice(subscriberId: string, expoToken: string) {
    const existing = await tokensOf(client, subscriberId);
    if (!existing.includes(expoToken)) {
      return;
    }
    await save(
      client,
      subscriberId,
      existing.filter((token) => token !== expoToken)
    );
  },
});

const notConfigured = () => {
  throw new Error("Novu is not configured (NOVU_SECRET_KEY is missing)");
};

export const registerDevice = (subscriberId: string, expoToken: string) => {
  const client = getNovu();
  return client
    ? createDevices(client).registerDevice(subscriberId, expoToken)
    : notConfigured();
};

export const unregisterDevice = (subscriberId: string, expoToken: string) => {
  const client = getNovu();
  return client
    ? createDevices(client).unregisterDevice(subscriberId, expoToken)
    : notConfigured();
};
