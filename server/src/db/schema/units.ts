import {
  mysqlTable,
  serial,
  varchar,
  int,
  timestamp,
  index,
} from 'drizzle-orm/mysql-core'
import { tenants } from './tenants'

/**
 * Units table — physical farm units (coops, barns) owned by a tenant.
 * Supports soft deletes via deleted_at.
 */
export const units = mysqlTable(
  'units',
  {
    id: serial('id').primaryKey(),
    tenantId: int('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 20 }).notNull(),
    location: varchar('location', { length: 255 }),
    isActive: int('is_active').default(1),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    codeUnique: index('idx_units_code').on(table.code),
    idxUnitsTenant: index('idx_units_tenant').on(table.tenantId),
  })
)

export type Unit = typeof units.$inferSelect
export type NewUnit = typeof units.$inferInsert
