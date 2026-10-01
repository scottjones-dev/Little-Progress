import {
  boolean,
  date,
  index,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./columns";

export const family = pgTable("family", {
  carerPinHash: text("carer_pin_hash"),
  carerPinVersion: text("carer_pin_version").notNull().default("1"),
  createdAt: createdAt(),
  id: id(),
  joinCode: text("join_code").notNull().unique(),
  name: text("name").notNull(),
  updatedAt: updatedAt(),
});

export const child = pgTable(
  "child",
  {
    createdAt: createdAt(),
    dateOfBirth: date("date_of_birth").notNull(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => family.id, { onDelete: "cascade" }),
    id: id(),
    name: text("name").notNull(),
    timezone: text("timezone").notNull().default("Europe/London"),
    updatedAt: updatedAt(),
  },
  (t) => [unique().on(t.id, t.familyId), index().on(t.familyId)]
);

export const carer = pgTable(
  "carer",
  {
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
    displayName: text("display_name").notNull(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => family.id, { onDelete: "cascade" }),
    id: id(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.familyId)]
);
