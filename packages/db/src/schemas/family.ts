import {
  boolean,
  date,
  index,
  pgTable,
  text,
  unique,
} from "drizzle-orm/pg-core";

import { organization } from "./auth";
import { createdAt, id, updatedAt } from "./columns";

// A family is a Better Auth organization (see ./auth.ts). Its carer PIN hash, PIN version
// and join code live on the organization row as additional fields.

export const child = pgTable(
  "child",
  {
    createdAt: createdAt(),
    dateOfBirth: date("date_of_birth").notNull(),
    familyId: text("family_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
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
    familyId: text("family_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    id: id(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.familyId)]
);
