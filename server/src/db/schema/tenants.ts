import {
  mysqlTable,
  serial,
  varchar,
  int,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/mysql-core'

/**
 * Tenants table — represents organizational entities that own and isolate data.
 * Each tenant has a unique name and slug used for URL-based routing.
 * Acts as the root of the multi-tenant hierarchy.
 */
export const tenants = mysqlTable(
  'tenants',
  {
    /** Auto-incrementing primary key. */
    id: int('id').autoincrement().primaryKey(),
    /** Human-readable tenant name, max 100 characters. */
    name: varchar('name', { length: 100 }).notNull(),
    /** URL-safe slug identifier, max 50 characters. */
    slug: varchar('slug', { length: 50 }).notNull(),
    /** Whether the tenant is active (1) or deactivated (0). */
    isActive: int('is_active').default(1),
    /** Timestamp when the tenant record was created. */
    createdAt: timestamp('created_at').defaultNow(),
    /** Timestamp when the tenant record was last updated. */
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    /** Unique constraint on the tenant name. */
    nameUnique: unique('uq_tenants_name').on(table.name),
    /** Unique constraint on the tenant slug. */
    slugUnique: unique('uq_tenants_slug').on(table.slug),
    /** Index for fast slug lookups. */
    idxTenantsSlug: index('idx_tenants_slug').on(table.slug),
  })
)

/** TypeScript type for SELECT results from the tenants table. */
export type Tenant = typeof tenants.$inferSelect

/** TypeScript type for INSERT operations on the tenants table. */
export type NewTenant = typeof tenants.$inferInsert
