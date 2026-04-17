import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/mysql-core'

/**
 * Permissions table — individual permission entries grouped by category.
 */
export const permissions = mysqlTable(
  'permissions',
  {
    id: int('id').autoincrement().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    permissionNameUnique: unique('uq_permissions_name').on(table.name),
    idxPermissionsCategory: index('idx_permissions_category').on(table.category),
  })
)

export type Permission = typeof permissions.$inferSelect
export type NewPermission = typeof permissions.$inferInsert
