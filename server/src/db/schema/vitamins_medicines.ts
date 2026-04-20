import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  index,
  unique,
  text,
  date,
  decimal,
} from "drizzle-orm/mysql-core";
import { tenants } from "./tenants";
import { suppliers } from "./suppliers";

/**
 * Vitamins and medicines master data table.
 * Stores pharmaceutical items with category classification (vitamin/medicine).
 * Tenant-scoped with soft delete support.
 */
export const vitaminsMedicines = mysqlTable(
  "vitamins_medicines",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 20 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    category: varchar("category", { length: 20 }).notNull(), // 'vitamin' | 'medicine'
    unitOfMeasure: varchar("unit_of_measure", { length: 50 }).notNull(),
    manufacturer: varchar("manufacturer", { length: 100 }),
    strength: varchar("strength", { length: 50 }), // e.g., "500mg", "5%"
    phone: varchar("phone", { length: 20 }), // contact number (optional)
    supplierId: int("supplier_id").references(() => suppliers.id, {
      onDelete: "set null", // keep item if supplier deleted
    }),
    isActive: int("is_active").default(1),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    uqVitaminsMedicinesCode: unique("uq_vitamins_medicines_code").on(
      table.tenantId,
      table.code,
    ),
    idxVitaminsMedicinesTenant: index("idx_vitamins_medicines_tenant").on(
      table.tenantId,
    ),
    idxVitaminsMedicinesCategory: index("idx_vitamins_medicines_category").on(
      table.category,
    ),
    idxVitaminsMedicinesSupplier: index("idx_vitamins_medicines_supplier").on(
      table.supplierId,
    ),
  }),
);

export type VitaminMedicine = typeof vitaminsMedicines.$inferSelect;
export type NewVitaminMedicine = typeof vitaminsMedicines.$inferInsert;

/**
 * Pharmaceutical stock per plasma unit.
 * Tracks opening stock, in/out totals, and closing stock.
 */
export const pharmaceuticalStock = mysqlTable(
  "pharmaceutical_stock",
  {
    id: int("id").autoincrement().primaryKey(),
    plasmaId: int("plasma_id")
      .notNull()
      .references(() => vitaminsMedicines.id),
    itemId: int("item_id")
      .notNull()
      .references(() => vitaminsMedicines.id),
    openingStock: decimal("opening_stock", { precision: 10, scale: 3 }).default("0"),
    totalIn: decimal("total_in", { precision: 10, scale: 3 }).default("0"),
    totalOut: decimal("total_out", { precision: 10, scale: 3 }).default("0"),
    closingStock: decimal("closing_stock", { precision: 10, scale: 3 }).default("0"),
    lastUpdatedAt: timestamp("last_updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    uqPharmaStockPlasmaItem: unique("uq_pharma_stock_plasma_item").on(
      table.plasmaId,
      table.itemId,
    ),
    idxPharmaStockPlasma: index("idx_pharma_stock_plasma").on(table.plasmaId),
    idxPharmaStockItem: index("idx_pharma_stock_item").on(table.itemId),
  }),
);

export type PharmaceuticalStock = typeof pharmaceuticalStock.$inferSelect;
export type NewPharmaceuticalStock = typeof pharmaceuticalStock.$inferInsert;

/**
 * Pharmaceutical batch tracking with expiry dates.
 * FIFO consumption tracking for pharmaceutical items.
 */
export const pharmaceuticalBatches = mysqlTable(
  "pharmaceutical_batches",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    itemId: int("item_id")
      .notNull()
      .references(() => vitaminsMedicines.id),
    batchNumber: varchar("batch_number", { length: 50 }).notNull(),
    expiryDate: date("expiry_date").notNull(),
    receivedQty: decimal("received_qty", { precision: 10, scale: 3 }).notNull(),
    remainingQty: decimal("remaining_qty", { precision: 10, scale: 3 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    uqPharmaBatchItemBatch: unique("uq_pharma_batch_item_batch").on(
      table.itemId,
      table.batchNumber,
    ),
    idxPharmaBatchTenant: index("idx_pharma_batch_tenant").on(table.tenantId),
    idxPharmaBatchItem: index("idx_pharma_batch_item").on(table.itemId),
    idxPharmaBatchExpiry: index("idx_pharma_batch_expiry").on(table.expiryDate),
  }),
);

export type PharmaceuticalBatch = typeof pharmaceuticalBatches.$inferSelect;
export type NewPharmaceuticalBatch = typeof pharmaceuticalBatches.$inferInsert;
