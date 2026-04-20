import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  decimal,
  text,
  date,
  index,
  unique,
} from "drizzle-orm/mysql-core";
import { plasmas } from "./plasmas";
import { feedProducts } from "./feed_products";
import { suppliers } from "./suppliers";
import { users } from "./users";

/**
 * Feed Surat Jalan table — records feed delivery documents (Surat Jalan)
 * with vendor, vehicle, and quantity details. Each delivery increases
 * feed stock for a specific plasma.
 * Added supplierId FK per Phase 18 D-02.
 */
export const feedSuratJalan = mysqlTable(
  "feed_surat_jalan",
  {
    id: int("id").autoincrement().primaryKey(),
    plasmaId: int("plasma_id")
      .notNull()
      .references(() => plasmas.id, { onDelete: "cascade" }),
    feedProductId: int("feed_product_id")
      .notNull()
      .references(() => feedProducts.id, { onDelete: "restrict" }),
    suratJalanNumber: varchar("surat_jalan_number", { length: 50 }).notNull(),
    vendor: varchar("vendor", { length: 100 }), // nullable - can be auto-filled from supplier
    supplierId: int("supplier_id").references(() => suppliers.id, {
      onDelete: "set null",
    }),
    deliveryDate: date("delivery_date").notNull(),
    vehicleNumber: varchar("vehicle_number", { length: 20 }),
    driverName: varchar("driver_name", { length: 100 }),
    totalZak: decimal("total_zak", { precision: 10, scale: 3 }).notNull(),
    totalKg: decimal("total_kg", { precision: 10, scale: 3 }).notNull(),
    notes: text("notes"),
    createdBy: varchar("created_by", { length: 16 }).references(
      () => users.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    suratJalanNumberUnique: unique("uq_surat_jalan_number").on(
      table.suratJalanNumber,
    ),
    idxSuratJalanPlasma: index("idx_surat_jalan_plasma").on(table.plasmaId),
  }),
);

export type FeedSuratJalan = typeof feedSuratJalan.$inferSelect;
export type NewFeedSuratJalan = typeof feedSuratJalan.$inferInsert;
