import {
  mysqlTable,
  varchar,
  text,
  int,
  timestamp,
  index,
} from 'drizzle-orm/mysql-core'
import { units } from './units'

/**
 * Plasmas table — individual farming areas within a unit,
 * tracking farmer details, capacity, and contact info.
 */
export const plasmas = mysqlTable(
  'plasmas',
  {
    id: int('id').autoincrement().primaryKey(),
    unitId: int('unit_id').notNull().references(() => units.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    farmerName: varchar('farmer_name', { length: 100 }),
    address: text('address'),
    phone: varchar('phone', { length: 20 }),
    capacity: int('capacity'),
    isActive: int('is_active').default(1),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    idxPlasmasUnit: index('idx_plasmas_unit').on(table.unitId),
  })
)

export type Plasma = typeof plasmas.$inferSelect
export type NewPlasma = typeof plasmas.$inferInsert
