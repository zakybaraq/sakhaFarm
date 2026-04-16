import {
  mysqlTable,
  serial,
  varchar,
  int,
  timestamp,
  decimal,
  text,
  index,
} from 'drizzle-orm/mysql-core'
import { plasmas } from './plasmas'
import { feedProducts } from './feed_products'
import { users } from './users'

/**
 * Feed movements table — records all feed stock movements (in/out)
 * with quantity in both kg and zak, linked to a reference.
 *
 * Note: createdBy is varchar(16) to match Lucia-generated user IDs.
 */
export const feedMovements = mysqlTable(
  'feed_movements',
  {
    id: int('id').autoincrement().primaryKey(),
    plasmaId: int('plasma_id').notNull().references(() => plasmas.id, { onDelete: 'cascade' }),
    feedProductId: int('feed_product_id').notNull().references(() => feedProducts.id, { onDelete: 'restrict' }),
    movementType: varchar('movement_type', { length: 10 }).notNull(),
    quantityKg: decimal('quantity_kg', { precision: 10, scale: 3 }).notNull(),
    quantityZak: decimal('quantity_zak', { precision: 10, scale: 3 }).notNull(),
    referenceType: varchar('reference_type', { length: 30 }),
    referenceId: int('reference_id'),
    notes: text('notes'),
    createdBy: varchar('created_by', { length: 16 }).references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    idxMovementsPlasma: index('idx_movements_plasma').on(table.plasmaId),
    idxMovementsFeed: index('idx_movements_feed').on(table.feedProductId),
    idxMovementsType: index('idx_movements_type').on(table.movementType),
    idxMovementsCreated: index('idx_movements_created').on(table.createdAt),
  })
)

export type FeedMovement = typeof feedMovements.$inferSelect
export type NewFeedMovement = typeof feedMovements.$inferInsert
