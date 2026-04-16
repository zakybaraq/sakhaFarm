import {
  mysqlTable,
  serial,
  varchar,
  text,
  int,
  timestamp,
  index,
} from 'drizzle-orm/mysql-core'
import { tenants } from './tenants'

/**
 * Roles table — defines permission groups scoped to a tenant.
 * System-level roles may have a null tenant_id.
 */
export const roles = mysqlTable(
  'roles',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 50 }).notNull(),
    description: text('description'),
    isDefault: int('is_default').default(0),
    tenantId: int('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    nameUnique: index('idx_roles_tenant').on(table.tenantId),
  })
)

export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert
