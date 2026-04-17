import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  decimal,
  index,
  unique,
} from 'drizzle-orm/mysql-core'
import { tenants } from './tenants'

/**
 * Feed products table — catalog of feed types with nutritional info
 * and phase classification (starter, grower, finisher).
 * Scoped to tenants for multi-tenancy isolation.
 */
export const feedProducts = mysqlTable(
  'feed_products',
  {
    id: int('id').autoincrement().primaryKey(),
    tenantId: int('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 20 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    phase: varchar('phase', { length: 20 }).notNull(),
    proteinPercent: decimal('protein_percent', { precision: 5, scale: 2 }),
    defaultUnit: varchar('default_unit', { length: 10 }).default('zak'),
    zakKgConversion: decimal('zak_kg_conversion', { precision: 10, scale: 2 }).default('50'),
    isActive: int('is_active').default(1),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    feedCodeUnique: unique('uq_feed_products_code').on(table.tenantId, table.code),
    idxFeedPhase: index('idx_feed_phase').on(table.phase),
    idxFeedTenant: index('idx_feed_products_tenant').on(table.tenantId),
  })
)

export type FeedProduct = typeof feedProducts.$inferSelect
export type NewFeedProduct = typeof feedProducts.$inferInsert
