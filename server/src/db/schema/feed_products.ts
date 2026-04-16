import {
  mysqlTable,
  serial,
  varchar,
  int,
  timestamp,
  decimal,
  index,
} from 'drizzle-orm/mysql-core'

/**
 * Feed products table — catalog of feed types with nutritional info
 * and phase classification (starter, grower, finisher).
 */
export const feedProducts = mysqlTable(
  'feed_products',
  {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 20 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    phase: varchar('phase', { length: 20 }).notNull(),
    proteinPercent: decimal('protein_percent', { precision: 5, scale: 2 }),
    defaultUnit: varchar('default_unit', { length: 10 }).default('zak'),
    isActive: int('is_active').default(1),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    codeUnique: index('idx_feed_code').on(table.code),
    idxFeedPhase: index('idx_feed_phase').on(table.phase),
  })
)

export type FeedProduct = typeof feedProducts.$inferSelect
export type NewFeedProduct = typeof feedProducts.$inferInsert
