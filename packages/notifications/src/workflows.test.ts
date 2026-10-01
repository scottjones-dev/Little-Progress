import { describe, expect, it } from "vitest";

import { eventIds, events } from "./events";
import { workflows } from "./workflows";

const discoverAll = () =>
  Promise.all(workflows.map(async (workflow) => await workflow.discover()));

describe("workflows built from the catalog", () => {
  it("has one workflow per event, named after it", async () => {
    const found = await discoverAll();
    expect(found.map((w) => w.workflowId).toSorted()).toStrictEqual(
      eventIds.toSorted()
    );
  });

  it("always has an email step, and a push step only where the event has one", async () => {
    const found = await discoverAll();
    for (const workflow of found) {
      const types = workflow.steps.map((step) => step.type);
      const id = eventIds.find((eventId) => eventId === workflow.workflowId);
      expect(id).toBeDefined();
      if (!id) {
        continue;
      }
      expect(types).toContain("email");
      expect(types.includes("push")).toBe(events[id].hasPush);
    }
  });

  it("makes critical workflows read-only so users cannot opt out", async () => {
    const found = await discoverAll();
    for (const workflow of found) {
      expect(workflow.preferences?.all?.readOnly).toBeTruthy();
    }
  });
});
