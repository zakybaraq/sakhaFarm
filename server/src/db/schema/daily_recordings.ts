import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  date,
  decimal,
  text,
  index,
} from 'drizzle-orm/mysql-core'
import { cycles } from './cycles'

/**
 * Daily recordings — no unique constraint on (cycleId, recordingDate) because
 * soft-deleted rows would conflict with new entries for the same date.
 * Deduplication is enforced at the application level.
 */
export const dailyRecordings = mysqlTable(
  'daily_recordings',
  {
    id: int('id').autoincrement().primaryKey(),
    cycleId: int('cycle_id').notNull().references(() => cycles.id, { onDelete: 'cascade' }),
    recordingDate: date('recording_date').notNull(),
    dayAge: int('day_age').notNull(),
    dead: int('dead').default(0),
    culled: int('culled').default(0),
    remainingPopulation: int('remaining_population').notNull(),
    bodyWeightG: decimal('body_weight_g', { precision: 10, scale: 3 }),
    feedConsumedKg: decimal('feed_consumed_kg', { precision: 10, scale: 3 }).default('0'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    idxRecordingsCycle: index('idx_recordings_cycle').on(table.cycleId),
    idxRecordingsDate: index('idx_recordings_date').on(table.recordingDate),
  })
)

export type DailyRecording = typeof dailyRecordings.$inferSelect
export type NewDailyRecording = typeof dailyRecordings.$inferInsert
