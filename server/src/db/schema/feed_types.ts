import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  index,
  unique,
} from "drizzle-orm/mysql-core";
import { tenants } from "./tenants";

/**
 * Feed types table — catalog of feed product categories
 * (e.g., Starter, Grower, Finisher). Scoped per tenant.
 * Implements D-01 from Phase 17 CONTEXT.
 */
export const feedTypes = mysqlTable(
  "feed_types",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 20 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    isActive: int("is_active").default(1),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    uqFeedTypesCode: unique("uq_feed_types_code").on(
      table.tenantId,
      table.code,
    ),
    idxFeedTypesTenant: index("idx_feed_types_tenant").on(table.tenantId),
  }),
);

export type FeedType = typeof feedTypes.$inferSelect;
export type NewFeedType = typeof feedTypes.$inferInsert;
