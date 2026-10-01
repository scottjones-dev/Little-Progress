import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import {
  entryKinds,
  milestoneCategories,
  nappyTypes,
  preparations,
  reactions,
  settings,
  temperatures,
} from "../vocab";
import { createdAt, id, updatedAt } from "./columns";
import { carer, child, family } from "./family";
import { food } from "./food";

export const entry = pgTable(
  "entry",
  {
    childId: uuid("child_id").notNull(),
    clientId: uuid("client_id").notNull(),
    createdAt: createdAt(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    familyId: uuid("family_id")
      .notNull()
      .references(() => family.id, { onDelete: "cascade" }),
    id: id(),
    kind: text("kind", { enum: entryKinds }).notNull(),
    loggedByCarerId: uuid("logged_by_carer_id").references(() => carer.id),
    loggedByUserId: text("logged_by_user_id"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    timezone: text("timezone").notNull(),
    updatedAt: updatedAt(),
    version: integer("version").notNull().default(1),
  },
  (t) => [
    foreignKey({
      columns: [t.childId, t.familyId],
      foreignColumns: [child.id, child.familyId],
    }).onDelete("cascade"),
    unique().on(t.childId, t.clientId),
    index().on(t.childId, t.occurredAt.desc()),
    index().on(t.childId, t.kind, t.occurredAt),
    check(
      "entry_logged_by_one",
      sql`(${t.loggedByUserId} is not null) <> (${t.loggedByCarerId} is not null)`
    ),
    check(
      "entry_kind_valid",
      sql`${t.kind} in (${sql.join(
        entryKinds.map((k) => sql`${k}`),
        sql`, `
      )})`
    ),
  ]
);

const entryId = () =>
  uuid("entry_id")
    .primaryKey()
    .references(() => entry.id, { onDelete: "cascade" });

export const mealTrial = pgTable(
  "meal_trial",
  {
    amount: text("amount"),
    attemptNumber: integer("attempt_number").notNull().default(1),
    distractions: text("distractions")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    entryId: entryId(),
    fedBy: text("fed_by"),
    foodId: uuid("food_id")
      .notNull()
      .references(() => food.id),
    note: text("note"),
    preparation: text("preparation", { enum: preparations }).notNull(),
    reaction: text("reaction", { enum: reactions }).notNull(),
    setting: text("setting", { enum: settings }),
    temperature: text("temperature", { enum: temperatures }).notNull(),
  },
  (t) => [
    index().on(t.foodId),
    check("meal_trial_attempt_positive", sql`${t.attemptNumber} >= 1`),
  ]
);

export const sleep = pgTable(
  "sleep",
  {
    endedAt: timestamp("ended_at", { withTimezone: true }),
    entryId: entryId(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    check(
      "sleep_end_after_start",
      sql`${t.endedAt} is null or ${t.endedAt} > ${t.startedAt}`
    ),
  ]
);

export const nappy = pgTable("nappy", {
  entryId: entryId(),
  type: text("type", { enum: nappyTypes }).notNull(),
});

export const milk = pgTable("milk", {
  amountMl: integer("amount_ml"),
  durationMinutes: integer("duration_minutes"),
  entryId: entryId(),
  kind: text("kind"),
});

export const milestone = pgTable("milestone", {
  category: text("category", { enum: milestoneCategories }).notNull(),
  entryId: entryId(),
  text: text("text").notNull(),
});
