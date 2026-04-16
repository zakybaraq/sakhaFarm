import {
  mysqlTable,
  serial,
  int,
  timestamp,
  decimal,
  index,
  unique,
} from 'drizzle-orm/mysql-core'
import { plasmas } from './plasmas'
import { feedProducts } from './feed_products'

/**
 * Feed stock table — tracks feed inventory per plasma and feed product,
 * maintaining opening, in, out, and closing stock balances.
 */
export const feedStock = mysqlTable(
  'feed_stock',
  {
    id: int('id').autoincrement().primaryKey(),
    plasmaId: int('plasma_id').notNull().references(() => plasmas.id, { onDelete: 'cascade' }),
    feedProductId: int('feed_product_id').notNull().references(() => feedProducts.id, { onDelete: 'restrict' }),
    openingStockKg: decimal('opening_stock_kg', { precision: 10, scale: 3 }).default('0'),
    totalInKg: decimal('total_in_kg', { precision: 10, scale: 3 }).default('0'),
    totalOutKg: decimal('total_out_kg', { precision: 10, scale: 3 }).default('0'),
    closingStockKg: decimal('closing_stock_kg', { precision: 10, scale: 3 }).default('0'),
    lastUpdatedAt: timestamp('last_updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    plasmaFeedUnique: unique('uq_plasma_feed_product').on(table.plasmaId, table.feedProductId),
    idxStockPlasma: index('idx_stock_plasma').on(table.plasmaId),
    idxStockFeed: index('idx_stock_feed').on(table.feedProductId),
  })
)

export type FeedStock = typeof feedStock.$inferSelect
export type NewFeedStock = typeof feedStock.$inferInsert
