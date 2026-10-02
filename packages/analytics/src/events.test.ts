import { describe, expect, it } from "vitest";

import { eventSchemas, parseEvent } from "./events";
import type { EventName } from "./events";

describe(parseEvent, () => {
  it("accepts an event with valid properties", () => {
    expect(
      parseEvent("entry_logged", {
        kind: "meal",
        seconds_to_log: "under_15",
        source: "app",
      })
    ).toStrictEqual({
      kind: "meal",
      seconds_to_log: "under_15",
      source: "app",
    });
  });

  it("accepts events that have no properties", () => {
    expect(parseEvent("family_created", {})).toStrictEqual({});
  });

  it("drops an event with an unknown property", () => {
    expect(
      parseEvent("entry_logged", {
        // @ts-expect-error: `food` is not part of the entry_logged catalog entry
        food: "banana",
        kind: "meal",
        seconds_to_log: "under_15",
        source: "app",
      })
    ).toBeNull();
  });

  it("drops an event whose value is not one of the allowed options", () => {
    expect(
      parseEvent("entry_logged", {
        // @ts-expect-error: `poached egg` is not an entry kind
        kind: "poached egg",
        seconds_to_log: "under_15",
        source: "app",
      })
    ).toBeNull();
  });

  it("never accepts free text in any property", () => {
    const freeText = "Ate all of the pureed carrot, then refused the spoon";
    // SAFETY: Object.keys of eventSchemas returns exactly its keys, which are the event names.
    for (const name of Object.keys(eventSchemas) as EventName[]) {
      for (const key of Object.keys(eventSchemas[name].shape)) {
        const result = eventSchemas[name].safeParse({ [key]: freeText });
        expect(result.success).toBeFalsy();
      }
    }
  });
});
