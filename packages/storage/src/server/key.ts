import { randomUUID } from "node:crypto";

import { extensions } from "../shared/constants";
import type { AllowedContentType } from "../shared/constants";

export const buildKey = (input: {
  childId?: string;
  contentType: AllowedContentType;
  familyId: string;
  kind: "attachment" | "report";
}) => {
  const scope = input.childId
    ? `family/${input.familyId}/child/${input.childId}`
    : `family/${input.familyId}`;
  return `${scope}/${input.kind}/${randomUUID()}.${extensions[input.contentType]}`;
};
