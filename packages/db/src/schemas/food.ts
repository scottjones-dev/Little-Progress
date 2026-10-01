import { index, pgTable, text, unique } from "drizzle-orm/pg-core";

import { organization } from "./auth";
import { createdAt, id } from "./columns";

export const food = pgTable(
  "food",
  {
    category: text("category"),
    createdAt: createdAt(),
    familyId: text("family_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    id: id(),
    name: text("name").notNull(),
  },
  (t) => [unique().on(t.familyId, t.name), index().on(t.familyId)]
);
