import { db } from '../../config/database'
import { dailyRecordings, cycles as cyclesTable, auditLogs } from '../../db/schema'
import { eq, and, isNull } from 'drizzle-orm'

export interface BulkImportRow {
  date: string
  dead: number
  culled: number
  remaining_population: number
  body_weight_g: number
  feed_consumed_kg: number
  notes?: string
}

export interface BulkImportResult {
  success: boolean
  created: number
  errors: Array<{ row: number; error: string }>
}

export function parseCSV(csvContent: string): BulkImportRow[] {
  const lines = csvContent.trim().split('\n')
  
  if (lines.length < 2) {
    throw new Error('CSV must contain at least a header row and one data row')
  }

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
  const requiredColumns = ['date', 'dead', 'culled', 'remaining_population', 'body_weight_g', 'feed_consumed_kg']
  
  const columnIndex: Record<string, number> = {}
  for (const col of requiredColumns) {
    const idx = headers.indexOf(col)
    if (idx === -1) {
      throw new Error(`Missing required column: ${col}`)
    }
    columnIndex[col] = idx
  }

  const notesIdx = headers.indexOf('notes')

  const rows: BulkImportRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = line.split(',').map(v => v.trim())
    
    if (values.length < requiredColumns.length) {
      throw new Error(`Row ${i + 1}: Not enough columns (expected ${requiredColumns.length}, got ${values.length})`)
    }

    rows.push({
      date: values[columnIndex.date],
      dead: parseInt(values[columnIndex.dead], 10) || 0,
      culled: parseInt(values[columnIndex.culled], 10) || 0,
      remaining_population: parseInt(values[columnIndex.remaining_population], 10) || 0,
      body_weight_g: parseFloat(values[columnIndex.body_weight_g]) || 0,
      feed_consumed_kg: parseFloat(values[columnIndex.feed_consumed_kg]) || 0,
      notes: notesIdx !== -1 ? values[notesIdx] : undefined,
    })
  }

  return rows
}

export async function validateRow(
  row: BulkImportRow,
  cycleId: number,
  tenantId: number,
): Promise<string | null> {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(row.date)) {
    return `Invalid date format: ${row.date} (expected YYYY-MM-DD)`
  }

  const dateObj = new Date(row.date)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  if (dateObj > today) {
    return `Future date not allowed: ${row.date}`
  }

  if (row.dead < 0 || row.culled < 0 || row.remaining_population < 0) {
    return 'Dead, culled, and remaining_population must be non-negative'
  }

  if (row.body_weight_g < 0 || row.feed_consumed_kg < 0) {
    return 'body_weight_g and feed_consumed_kg must be non-negative'
  }

  const cycleResult = await db
    .select({
      id: cyclesTable.id,
      status: cyclesTable.status,
    })
    .from(cyclesTable)
    .where(and(eq(cyclesTable.id, cycleId), isNull(cyclesTable.deletedAt)))
    .limit(1)

  if (cycleResult.length === 0) {
    return `Cycle with ID ${cycleId} not found`
  }

  if (cycleResult[0].status !== 'active') {
    return `Cycle ${cycleId} is not active (status: ${cycleResult[0].status})`
  }

  const existingRecording = await db
    .select({ id: dailyRecordings.id })
    .from(dailyRecordings)
    .where(
      and(
        eq(dailyRecordings.cycleId, cycleId),
        eq(dailyRecordings.recordingDate, row.date as any),
        isNull(dailyRecordings.deletedAt),
      ),
    )
    .limit(1)

  if (existingRecording.length > 0) {
    return `Recording for date ${row.date} already exists in this cycle`
  }

  return null
}

export async function importBulk(
  csvContent: string,
  cycleId: number,
  tenantId: number,
  userId: string,
): Promise<BulkImportResult> {
  const lines = csvContent.trim().split('\n')
  if (lines.length - 1 > 1000) {
    return {
      success: false,
      created: 0,
      errors: [{ row: 0, error: 'Maximum 1000 rows allowed per import' }],
    }
  }

  let rows: BulkImportRow[]
  try {
    rows = parseCSV(csvContent)
  } catch (e) {
    return {
      success: false,
      created: 0,
      errors: [{ row: 0, error: e instanceof Error ? e.message : 'Failed to parse CSV' }],
    }
  }

  const errors: Array<{ row: number; error: string }> = []
  let created = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    const validationError = await validateRow(row, cycleId, tenantId)
    if (validationError) {
      errors.push({ row: i + 1, error: validationError })
      continue
    }

    const cycleResult = await db
      .select({ chickInDate: cyclesTable.chickInDate })
      .from(cyclesTable)
      .where(eq(cyclesTable.id, cycleId))
      .limit(1)

    const chickInDate = new Date(cycleResult[0].chickInDate)
    const recordingDate = new Date(row.date)
    const dayAge = Math.floor(
      (recordingDate.getTime() - chickInDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    try {
      await db.insert(dailyRecordings).values({
        cycleId,
        recordingDate: row.date as any,
        dayAge,
        dead: row.dead,
        culled: row.culled,
        remainingPopulation: row.remaining_population,
        bodyWeightG: row.body_weight_g.toString(),
        feedConsumedKg: row.feed_consumed_kg.toString(),
        notes: row.notes ?? null,
      })
      created++

      try {
        await db.insert(auditLogs).values({
          userId,
          action: 'create',
          resource: 'recording',
          resourceId: `bulk-import-${cycleId}-${row.date}`,
          newValue: JSON.stringify({ cycleId, ...row }),
        })
      } catch {}
    } catch (e) {
      errors.push({
        row: i + 1,
        error: e instanceof Error ? e.message : 'Failed to insert recording',
      })
    }
  }

  return {
    success: true,
    created,
    errors,
  }
}