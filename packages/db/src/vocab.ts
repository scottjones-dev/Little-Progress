export const entryKinds = [
  "meal",
  "sleep",
  "nappy",
  "milk",
  "milestone",
] as const;
export const preparations = [
  "mushed",
  "blended",
  "smooth",
  "finger_food",
] as const;
export const temperatures = ["hot", "cold", "microwaved", "room_temp"] as const;
export const reactions = [
  "refused",
  "touched_lips",
  "licked",
  "swallowed",
  "gagged",
  "reached_for_more",
] as const;
export const settings = ["highchair", "lap", "nursery_table", "floor"] as const;
export const nappyTypes = ["wet", "dirty", "both"] as const;
export const milestoneCategories = [
  "movement",
  "sound",
  "word",
  "first_try",
] as const;

export type EntryKind = (typeof entryKinds)[number];
export type Preparation = (typeof preparations)[number];
export type Temperature = (typeof temperatures)[number];
export type Reaction = (typeof reactions)[number];
export type Setting = (typeof settings)[number];
export type NappyType = (typeof nappyTypes)[number];
export type MilestoneCategory = (typeof milestoneCategories)[number];
