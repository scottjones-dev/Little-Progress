import { index, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";

import { createdAt, id } from "./columns";
import { family } from "./family";

export const food = pgTable(
  "food",
  {
    category: text("category"),
    createdAt: createdAt(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => family.id, { onDelete: "cascade" }),
    id: id(),
    name: text("name").notNull(),
  },
  (t) => [unique().on(t.familyId, t.name), index().on(t.familyId)]
);
