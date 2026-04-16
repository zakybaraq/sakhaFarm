import {
  mysqlTable,
  serial,
  varchar,
  int,
  timestamp,
  date,
  decimal,
  text,
  index,
  unique,
} from 'drizzle-orm/mysql-core'
import { cycles } from './cycles'

/**
 * Daily recordings table — daily metrics recorded per cycle,
 * including mortality, body weight, and feed consumption.
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
  },
  (table) => ({
    cycleDateUnique: unique('uq_cycle_recording_date').on(table.cycleId, table.recordingDate),
    idxRecordingsCycle: index('idx_recordings_cycle').on(table.cycleId),
    idxRecordingsDate: index('idx_recordings_date').on(table.recordingDate),
  })
)

export type DailyRecording = typeof dailyRecordings.$inferSelect
export type NewDailyRecording = typeof dailyRecordings.$inferInsert
