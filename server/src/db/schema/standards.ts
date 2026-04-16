import {
  mysqlTable,
  serial,
  varchar,
  int,
  timestamp,
  decimal,
  index,
  unique,
} from 'drizzle-orm/mysql-core'

/**
 * Standards table — growth performance benchmarks by doc type and day age,
 * used to compare actual cycle performance against expected standards.
 */
export const standards = mysqlTable(
  'standards',
  {
    id: int('id').autoincrement().primaryKey(),
    docType: varchar('doc_type', { length: 50 }).notNull(),
    dayAge: int('day_age').notNull(),
    standardBwG: decimal('standard_bw_g', { precision: 10, scale: 3 }).notNull(),
    standardFcr: decimal('standard_fcr', { precision: 5, scale: 3 }),
    dailyGainG: decimal('daily_gain_g', { precision: 10, scale: 3 }),
    cumFeedIntakeG: decimal('cum_feed_intake_g', { precision: 10, scale: 3 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    docTypeDayUnique: unique('uq_doc_type_day_age').on(table.docType, table.dayAge),
    idxStandardsDoc: index('idx_standards_doc').on(table.docType),
    idxStandardsDay: index('idx_standards_day').on(table.dayAge),
  })
)

export type Standard = typeof standards.$inferSelect
export type NewStandard = typeof standards.$inferInsert
