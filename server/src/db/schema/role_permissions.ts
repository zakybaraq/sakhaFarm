import {
  mysqlTable,
  serial,
  varchar,
  int,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/mysql-core'
import { roles } from './roles'
import { permissions } from './permissions'

/**
 * Role permissions junction table — maps roles to permissions with an action.
 */
export const rolePermissions = mysqlTable(
  'role_permissions',
  {
    id: int('id').autoincrement().primaryKey(),
    roleId: int('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: int('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
    action: varchar('action', { length: 10 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    rolePermissionUnique: unique('uq_role_permission').on(table.roleId, table.permissionId),
    idxRpRole: index('idx_rp_role').on(table.roleId),
    idxRpPermission: index('idx_rp_permission').on(table.permissionId),
  })
)

export type RolePermission = typeof rolePermissions.$inferSelect
export type NewRolePermission = typeof rolePermissions.$inferInsert
