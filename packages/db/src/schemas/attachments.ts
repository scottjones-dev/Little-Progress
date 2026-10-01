import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { organization } from "./auth";
import { createdAt, id } from "./columns";
import { entry } from "./entries";
import { carer } from "./family";

export const uploadStatuses = ["pending", "uploaded"] as const;

export const attachment = pgTable(
  "attachment",
  {
    contentType: text("content_type").notNull(),
    createdAt: createdAt(),
    createdByCarerId: uuid("created_by_carer_id").references(() => carer.id),
    createdByUserId: text("created_by_user_id"),
    entryId: uuid("entry_id").references(() => entry.id, {
      onDelete: "cascade",
    }),
    familyId: text("family_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    id: id(),
    key: text("key").notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    status: text("status", { enum: uploadStatuses })
      .notNull()
      .default("pending"),
  },
  (t) => [
    unique().on(t.key),
    index().on(t.familyId),
    index().on(t.entryId),
    check(
      "attachment_created_by_one",
      sql`(${t.createdByUserId} is not null) <> (${t.createdByCarerId} is not null)`
    ),
    check("attachment_size_positive", sql`${t.size} > 0`),
  ]
);
