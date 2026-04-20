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
 * Feed brands table — catalog of feed brands/vendors
 * (e.g., Charoen Pokphand, Wonokoyo). Scoped per tenant.
 * `phone` holds the brand sales/contact number (nullable).
 * Implements D-02 from Phase 17 CONTEXT.
 */
export const feedBrands = mysqlTable(
  "feed_brands",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 20 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    isActive: int("is_active").default(1),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    uqFeedBrandsCode: unique("uq_feed_brands_code").on(
      table.tenantId,
      table.code,
    ),
    idxFeedBrandsTenant: index("idx_feed_brands_tenant").on(table.tenantId),
  }),
);

export type FeedBrand = typeof feedBrands.$inferSelect;
export type NewFeedBrand = typeof feedBrands.$inferInsert;
