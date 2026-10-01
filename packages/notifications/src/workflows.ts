import { workflow } from "@novu/framework";

import { eventIds, events } from "./events";
import type { EventId } from "./events";

/**
 * Builds the Novu workflow for one event from the catalog.
 * Every event goes through this one builder, so there is no per-notification workflow code.
 * SMS will become another step here once a provider is chosen.
 */
export const buildWorkflow = (id: EventId) => {
  const definition = events[id];

  return workflow(
    id,
    async ({ payload, step }) => {
      await step.email("email", async () => {
        const { html, subject } = await definition.renderEmail(payload);
        return { body: html, subject };
      });

      if (definition.hasPush) {
        await step.push("push", () => {
          const { body, title } = definition.renderPush(payload);
          return { body, subject: title };
        });
      }
    },
    {
      name: id,
      payloadSchema: definition.payload,
      // Critical workflows are read-only: a user's preferences cannot switch them off.
      preferences: { all: { enabled: true, readOnly: definition.critical } },
    }
  );
};

export const workflows = eventIds.map(buildWorkflow);
