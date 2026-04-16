import {
  mysqlTable,
  varchar,
  timestamp,
  index,
} from 'drizzle-orm/mysql-core'
import { users } from './users'

export const sessions = mysqlTable(
  'sessions',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    userId: varchar('user_id', { length: 16 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => ({
    idxSessionsUser: index('idx_sessions_user').on(table.userId),
    idxSessionsExpires: index('idx_sessions_expires').on(table.expiresAt),
  })
)

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
