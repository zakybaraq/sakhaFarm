import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  text,
  json,
  index,
} from 'drizzle-orm/mysql-core'
import { users } from './users'

/**
 * Audit logs table — records user actions with before/after values
 * for compliance, debugging, and security auditing.
 *
 * Note: userId is varchar(16) to match Lucia-generated user IDs.
 */
export const auditLogs = mysqlTable(
  'audit_logs',
  {
    id: int('id').autoincrement().primaryKey(),
    userId: varchar('user_id', { length: 16 }).notNull().references(() => users.id, { onDelete: 'restrict' }),
    action: varchar('action', { length: 100 }).notNull(),
    resource: varchar('resource', { length: 100 }),
    resourceId: varchar('resource_id', { length: 100 }),
    oldValue: json('old_value'),
    newValue: json('new_value'),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    idxAuditUser: index('idx_audit_user').on(table.userId),
    idxAuditAction: index('idx_audit_action').on(table.action),
    idxAuditCreatedAt: index('idx_audit_created_at').on(table.createdAt),
    idxAuditResource: index('idx_audit_resource').on(table.resource),
  })
)

export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
