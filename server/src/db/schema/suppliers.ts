import {
  mysqlTable,
  varchar,
  text,
  int,
  timestamp,
  uniqueIndex,
  primaryKey,
  unique,
  index,
} from "drizzle-orm/mysql-core";
import { tenants } from "./tenants";

/**
 * Suppliers table — catalog of suppliers/vendors for farm supplies
 * (feed, vitamins, medicines). Scoped per tenant.
 * Implements D-01 from Phase 18 CONTEXT.
 */
export const suppliers = mysqlTable(
  "suppliers",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 20 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    contactPerson: varchar("contact_person", { length: 100 }),
    phone: varchar("phone", { length: 20 }).notNull(),
    address: text("address"),
    category: varchar("category", { length: 20 }).notNull(), // feed/vitamin/medicine/other
    isActive: int("is_active").default(1),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    uqSuppliersCode: unique("uq_suppliers_code").on(table.tenantId, table.code),
    idxSuppliersTenant: index("idx_suppliers_tenant").on(table.tenantId),
  }),
);

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
