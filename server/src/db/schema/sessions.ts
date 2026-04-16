import {
  mysqlTable,
  varchar,
  timestamp,
  json,
  index,
} from 'drizzle-orm/mysql-core'

/**
 * Sessions table — stores session data for authentication,
 * keyed by session ID with JSON payload and expiration.
 */
export const sessions = mysqlTable(
  'sessions',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    data: json('data').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    idxSessionsExpires: index('idx_sessions_expires').on(table.expiresAt),
  })
)

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
