import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  decimal,
  index,
  unique,
} from "drizzle-orm/mysql-core";
import { tenants } from "./tenants";
import { feedTypes } from "./feed_types";
import { feedBrands } from "./feed_brands";

/**
 * Feed products table — catalog of feed products with nutritional info.
 * Linked to feed_types (category, e.g., Starter/Grower/Finisher)
 * and feed_brands (manufacturer/vendor) via nullable FKs.
 * Scoped to tenants for multi-tenancy isolation.
 */
export const feedProducts = mysqlTable(
  "feed_products",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 20 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    typeId: int("type_id").references(() => feedTypes.id),
    brandId: int("brand_id").references(() => feedBrands.id),
    proteinPercent: decimal("protein_percent", { precision: 5, scale: 2 }),
    defaultUnit: varchar("default_unit", { length: 10 }).default("zak"),
    zakKgConversion: decimal("zak_kg_conversion", {
      precision: 10,
      scale: 2,
    }).default("50"),
    isActive: int("is_active").default(1),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    feedCodeUnique: unique("uq_feed_products_code").on(
      table.tenantId,
      table.code,
    ),
    idxFeedTenant: index("idx_feed_products_tenant").on(table.tenantId),
  }),
);

export type FeedProduct = typeof feedProducts.$inferSelect;
export type NewFeedProduct = typeof feedProducts.$inferInsert;
