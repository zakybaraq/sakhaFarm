import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  index,
} from 'drizzle-orm/mysql-core'
import { roles } from './roles'
import { tenants } from './tenants'

/**
 * Users table — authenticated users belonging to a tenant and role.
 *
 * Adapted for Lucia Auth v3:
 * - `id` is varchar(16) — Lucia generates IDs via `generateIdFromEntropySize(10)`
 * - `passwordHash` stores the Argon2id hash (Lucia v3 does NOT use a keys table)
 * - All FK references from other tables must also be varchar(16)
 */
export const users = mysqlTable(
  'users',
  {
    id: varchar('id', { length: 16 }).primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    roleId: int('role_id').notNull().references(() => roles.id, { onDelete: 'restrict' }),
    tenantId: int('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    isActive: int('is_active').default(1),
    isLocked: int('is_locked').default(0),
    forcePasswordChange: int('force_password_change').default(0),
    lastLoginAt: timestamp('last_login_at'),
    failedLoginAttempts: int('failed_login_attempts').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    emailUnique: index('idx_users_email').on(table.email),
    idxUsersTenant: index('idx_users_tenant').on(table.tenantId),
    idxUsersRole: index('idx_users_role').on(table.roleId),
  })
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
