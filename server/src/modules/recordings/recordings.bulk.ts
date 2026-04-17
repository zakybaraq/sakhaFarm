import { db } from '../../config/database'
import { dailyRecordings, cycles as cyclesTable, auditLogs } from '../../db/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'
import { plasmas as plasmasTable } from '../../db/schema/plasmas'
import { units as unitsTable } from '../../db/schema/units'

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

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
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

    const values = parseCSVLine(line)
    
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

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
  }
  result.push(current)
  return result
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
    .innerJoin(plasmasTable, eq(cyclesTable.plasmaId, plasmasTable.id))
    .innerJoin(unitsTable, eq(plasmasTable.unitId, unitsTable.id))
    .where(and(eq(cyclesTable.id, cycleId), eq(unitsTable.tenantId, tenantId), isNull(cyclesTable.deletedAt)))
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
        sql`${dailyRecordings.recordingDate} = ${row.date}`,
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

  const cycleResult = await db
    .select({
      id: cyclesTable.id,
      status: cyclesTable.status,
      chickInDate: cyclesTable.chickInDate,
    })
    .from(cyclesTable)
    .innerJoin(plasmasTable, eq(cyclesTable.plasmaId, plasmasTable.id))
    .innerJoin(unitsTable, eq(plasmasTable.unitId, unitsTable.id))
    .where(and(eq(cyclesTable.id, cycleId), eq(unitsTable.tenantId, tenantId), isNull(cyclesTable.deletedAt)))
    .limit(1)

  if (cycleResult.length === 0) {
    return { success: false, created: 0, errors: [{ row: 0, error: `Cycle with ID ${cycleId} not found` }] }
  }

  if (cycleResult[0].status !== 'active') {
    return { success: false, created: 0, errors: [{ row: 0, error: `Cycle ${cycleId} is not active (status: ${cycleResult[0].status})` }] }
  }

  const cycle = cycleResult[0]
  const chickInDate = new Date(cycle.chickInDate)

  const errors: Array<{ row: number; error: string }> = []
  const validRows: Array<{ row: BulkImportRow; rowIndex: number; dayAge: number }> = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const validationError = await validateRow(row, cycleId, tenantId)
    if (validationError) {
      errors.push({ row: i + 1, error: validationError })
      continue
    }

    const recordingDate = new Date(row.date)
    const dayAge = Math.floor(
      (recordingDate.getTime() - chickInDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    validRows.push({ row, rowIndex: i, dayAge })
  }

  if (validRows.length === 0) {
    return { success: errors.length === 0, created: 0, errors }
  }

  let created = 0
  await db.transaction(async (tx) => {
    for (const { row, rowIndex, dayAge } of validRows) {
      try {
        await tx.insert(dailyRecordings).values({
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
      } catch (e) {
        errors.push({
          row: rowIndex + 1,
          error: e instanceof Error ? e.message : 'Failed to insert recording',
        })
      }
    }
  })

  for (const { row } of validRows) {
    try {
      await db.insert(auditLogs).values({
        userId,
        action: 'create',
        resource: 'recording',
        resourceId: `bulk-import-${cycleId}-${row.date}`,
        newValue: JSON.stringify({ cycleId, ...row }),
      })
    } catch {}
  }

  return {
    success: errors.length === 0,
    created,
    errors,
  }
}