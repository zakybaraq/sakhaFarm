import {
  mysqlTable,
  serial,
  varchar,
  int,
  timestamp,
  date,
  decimal,
  index,
} from 'drizzle-orm/mysql-core'
import { plasmas } from './plasmas'

/**
 * Cycles table — tracks a single farming cycle (chick-in to harvest)
 * within a plasma, including population, feed, and status.
 */
export const cycles = mysqlTable(
  'cycles',
  {
    id: int('id').autoincrement().primaryKey(),
    plasmaId: int('plasma_id').notNull().references(() => plasmas.id, { onDelete: 'cascade' }),
    cycleNumber: int('cycle_number').notNull(),
    docType: varchar('doc_type', { length: 50 }).notNull(),
    chickInDate: date('chick_in_date').notNull(),
    initialPopulation: int('initial_population').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    harvestDate: date('harvest_date'),
    finalPopulation: int('final_population'),
    totalFeedKg: decimal('total_feed_kg', { precision: 10, scale: 3 }).default('0'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    idxCyclesPlasma: index('idx_cycles_plasma').on(table.plasmaId),
    idxCyclesStatus: index('idx_cycles_status').on(table.status),
    idxCyclesChickIn: index('idx_cycles_chick_in').on(table.chickInDate),
  })
)

export type Cycle = typeof cycles.$inferSelect
export type NewCycle = typeof cycles.$inferInsert
