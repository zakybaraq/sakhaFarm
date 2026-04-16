import { db } from '../../config/database'
import { dailyRecordings, cycles, standards, auditLogs } from '../../db/schema'
import { eq, and, isNull, desc, sum, count, max, lte, gte } from 'drizzle-orm'
import { cycles as cyclesTable } from '../../db/schema/cycles'
import {
  RecordingNotFoundError,
  CycleNotActiveError,
  FutureDateError,
  DuplicateRecordingDateError,
} from './recordings.errors'

interface CreateRecordingInput {
  cycleId: number
  recordingDate: string
  dead?: number
  culled?: number
  remainingPopulation: number
  bodyWeightG?: number
  feedConsumedKg?: number
  notes?: string
}

interface UpdateRecordingInput {
  recordingDate?: string
  dead?: number
  culled?: number
  remainingPopulation?: number
  bodyWeightG?: number
  feedConsumedKg?: number
  notes?: string
}

interface StandardDeviation {
  grams: number
  percent: number
  status: 'above_standard' | 'on_standard' | 'below_standard'
  standardBwG?: number
  actualBwG: number
}

interface RecordingWithMetrics {
  id: number
  cycleId: number
  recordingDate: string
  dayAge: number
  dead: number
  culled: number
  remainingPopulation: number
  bodyWeightG: string | null
  feedConsumedKg: string | null
  notes: string | null
  cumulativeMortality: number
  deplesi: number
  survivalRate: number
  deviation?: StandardDeviation
}

function calculateDayAge(chickInDate: Date, recordingDate: string): number {
  const chickIn = new Date(chickInDate)
  const recording = new Date(recordingDate)
  const diffTime = recording.getTime() - chickIn.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

function calculateCumulativeMortality(
  totalDead: number,
  totalCulled: number,
  initialPopulation: number,
): number {
  return (totalDead + totalCulled) / initialPopulation * 100
}

function calculateDeplesi(
  initialPopulation: number,
  remainingPopulation: number,
): number {
  return (initialPopulation - remainingPopulation) / initialPopulation * 100
}

function calculateSurvivalRate(
  initialPopulation: number,
  remainingPopulation: number,
): number {
  return remainingPopulation / initialPopulation * 100
}

async function fetchStandard(
  docType: string,
  dayAge: number,
): Promise<{ standardBwG: number; standardFcr: number } | null> {
  const result = await db
    .select({
      standardBwG: standards.standardBwG,
      standardFcr: standards.standardFcr,
    })
    .from(standards)
    .where(and(eq(standards.docType, docType), eq(standards.dayAge, dayAge)))
    .limit(1)

  if (result.length === 0) return null

  return {
    standardBwG: parseFloat(result[0].standardBwG),
    standardFcr: result[0].standardFcr ? parseFloat(result[0].standardFcr) : 0,
  }
}

function calculateDeviation(
  actualBwG: number,
  standardBwG: number,
): StandardDeviation {
  const grams = actualBwG - standardBwG
  const percent = ((actualBwG - standardBwG) / standardBwG) * 100
  let status: 'above_standard' | 'on_standard' | 'below_standard' = 'on_standard'
  if (grams > 10) status = 'above_standard'
  else if (grams < -10) status = 'below_standard'

  return { grams, percent, status, standardBwG, actualBwG }
}

export async function createRecording(
  input: CreateRecordingInput,
  tenantId: number,
  userId: string,
) {
  const cycleResult = await db
    .select({
      id: cyclesTable.id,
      docType: cyclesTable.docType,
      chickInDate: cyclesTable.chickInDate,
      initialPopulation: cyclesTable.initialPopulation,
      status: cyclesTable.status,
    })
    .from(cyclesTable)
    .where(and(eq(cyclesTable.id, input.cycleId), isNull(cyclesTable.deletedAt)))
    .limit(1)

  if (cycleResult.length === 0) {
    throw new RecordingNotFoundError(input.cycleId)
  }

  const cycle = cycleResult[0]

  if (cycle.status !== 'active') {
    throw new CycleNotActiveError(input.cycleId, cycle.status)
  }

  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const recordingDateObj = new Date(input.recordingDate)
  if (recordingDateObj > today) {
    throw new FutureDateError(input.recordingDate)
  }

  const existingRecording = await db
    .select({ id: dailyRecordings.id })
    .from(dailyRecordings)
    .where(
      and(
        eq(dailyRecordings.cycleId, input.cycleId),
        eq(dailyRecordings.recordingDate, input.recordingDate),
        isNull(dailyRecordings.deletedAt),
      ),
    )
    .limit(1)

  if (existingRecording.length > 0) {
    throw new DuplicateRecordingDateError(input.cycleId, input.recordingDate)
  }

  const dayAge = calculateDayAge(cycle.chickInDate, input.recordingDate)

  const result = await db.insert(dailyRecordings).values({
    cycleId: input.cycleId,
    recordingDate: input.recordingDate,
    dayAge,
    dead: input.dead ?? 0,
    culled: input.culled ?? 0,
    remainingPopulation: input.remainingPopulation,
    bodyWeightG: input.bodyWeightG?.toString() ?? null,
    feedConsumedKg: input.feedConsumedKg?.toString() ?? '0',
    notes: input.notes ?? null,
  })

  const newId = result[0].insertId

  // Get cumulative dead and culled from ALL recordings up to current date (inclusive)
  const cumulativeStats = await db
    .select({
      totalDead: sum(dailyRecordings.dead),
      totalCulled: sum(dailyRecordings.culled),
    })
    .from(dailyRecordings)
    .where(
      and(
        eq(dailyRecordings.cycleId, input.cycleId),
        lte(dailyRecordings.recordingDate, input.recordingDate),
        isNull(dailyRecordings.deletedAt),
      ),
    )

  const totalDead = parseInt(cumulativeStats[0]?.totalDead || '0', 10)
  const totalCulled = parseInt(cumulativeStats[0]?.totalCulled || '0', 10)
  const cumulativeMortality = calculateCumulativeMortality(
    totalDead,
    totalCulled,
    cycle.initialPopulation,
  )
  const deplesi = calculateDeplesi(cycle.initialPopulation, input.remainingPopulation)
  const survivalRate = calculateSurvivalRate(
    cycle.initialPopulation,
    input.remainingPopulation,
  )

  let deviation: StandardDeviation | undefined
  if (input.bodyWeightG != null) {
    const std = await fetchStandard(cycle.docType, dayAge)
    if (std) {
      deviation = calculateDeviation(input.bodyWeightG, std.standardBwG)
    }
  }

  try {
    await db.insert(auditLogs).values({
      userId,
      action: 'create',
      resource: 'recording',
      resourceId: String(newId),
      newValue: JSON.stringify(input),
    })
  } catch {
    // Fire-and-forget audit logging
  }

  return {
    id: newId,
    cycleId: input.cycleId,
    recordingDate: input.recordingDate,
    dayAge,
    dead: input.dead ?? 0,
    culled: input.culled ?? 0,
    remainingPopulation: input.remainingPopulation,
    bodyWeightG: input.bodyWeightG?.toString() ?? null,
    feedConsumedKg: input.feedConsumedKg?.toString() ?? '0',
    notes: input.notes ?? null,
    cumulativeMortality: Math.round(cumulativeMortality * 100) / 100,
    deplesi: Math.round(deplesi * 100) / 100,
    survivalRate: Math.round(survivalRate * 100) / 100,
    deviation,
  }
}

export async function listRecordings(cycleId: number, tenantId: number) {
  const recordings = await db
    .select({
      id: dailyRecordings.id,
      cycleId: dailyRecordings.cycleId,
      recordingDate: dailyRecordings.recordingDate,
      dayAge: dailyRecordings.dayAge,
      dead: dailyRecordings.dead,
      culled: dailyRecordings.culled,
      remainingPopulation: dailyRecordings.remainingPopulation,
      bodyWeightG: dailyRecordings.bodyWeightG,
      feedConsumedKg: dailyRecordings.feedConsumedKg,
      notes: dailyRecordings.notes,
    })
    .from(dailyRecordings)
    .leftJoin(cyclesTable, eq(dailyRecordings.cycleId, cyclesTable.id))
    .where(
      and(
        eq(dailyRecordings.cycleId, cycleId),
        isNull(dailyRecordings.deletedAt),
      ),
    )
    .orderBy(desc(dailyRecordings.recordingDate))

  return recordings
}

export async function getRecording(id: number, tenantId: number) {
  const result = await db
    .select({
      id: dailyRecordings.id,
      cycleId: dailyRecordings.cycleId,
      recordingDate: dailyRecordings.recordingDate,
      dayAge: dailyRecordings.dayAge,
      dead: dailyRecordings.dead,
      culled: dailyRecordings.culled,
      remainingPopulation: dailyRecordings.remainingPopulation,
      bodyWeightG: dailyRecordings.bodyWeightG,
      feedConsumedKg: dailyRecordings.feedConsumedKg,
      notes: dailyRecordings.notes,
      initialPopulation: cyclesTable.initialPopulation,
      docType: cyclesTable.docType,
      chickInDate: cyclesTable.chickInDate,
    })
    .from(dailyRecordings)
    .leftJoin(cyclesTable, eq(dailyRecordings.cycleId, cyclesTable.id))
    .where(and(eq(dailyRecordings.id, id), isNull(dailyRecordings.deletedAt)))
    .limit(1)

  if (result.length === 0) {
    throw new RecordingNotFoundError(id)
  }

  const rec = result[0]

  // Get cumulative dead and culled from ALL recordings up to current recording date (inclusive)
  const cumulativeStats = await db
    .select({
      totalDead: sum(dailyRecordings.dead),
      totalCulled: sum(dailyRecordings.culled),
    })
    .from(dailyRecordings)
    .where(
      and(
        eq(dailyRecordings.cycleId, rec.cycleId),
        lte(dailyRecordings.recordingDate, rec.recordingDate),
        isNull(dailyRecordings.deletedAt),
      ),
    )

  const totalDead = parseInt(cumulativeStats[0]?.totalDead || '0', 10)
  const totalCulled = parseInt(cumulativeStats[0]?.totalCulled || '0', 10)
  const cumulativeMortality = calculateCumulativeMortality(
    totalDead,
    totalCulled,
    rec.initialPopulation,
  )
  const deplesi = calculateDeplesi(rec.initialPopulation, rec.remainingPopulation)
  const survivalRate = calculateSurvivalRate(
    rec.initialPopulation,
    rec.remainingPopulation,
  )

  let deviation: StandardDeviation | undefined
  if (rec.bodyWeightG != null) {
    const actualBw = parseFloat(rec.bodyWeightG)
    const std = await fetchStandard(rec.docType, rec.dayAge)
    if (std) {
      deviation = calculateDeviation(actualBw, std.standardBwG)
    }
  }

  return {
    id: rec.id,
    cycleId: rec.cycleId,
    recordingDate: rec.recordingDate,
    dayAge: rec.dayAge,
    dead: rec.dead,
    culled: rec.culled,
    remainingPopulation: rec.remainingPopulation,
    bodyWeightG: rec.bodyWeightG,
    feedConsumedKg: rec.feedConsumedKg,
    notes: rec.notes,
    cumulativeMortality: Math.round(cumulativeMortality * 100) / 100,
    deplesi: Math.round(deplesi * 100) / 100,
    survivalRate: Math.round(survivalRate * 100) / 100,
    deviation,
  }
}

export async function updateRecording(
  id: number,
  input: UpdateRecordingInput,
  tenantId: number,
  userId: string,
) {
  const existing = await db
    .select({ id: dailyRecordings.id })
    .from(dailyRecordings)
    .where(and(eq(dailyRecordings.id, id), isNull(dailyRecordings.deletedAt)))
    .limit(1)

  if (existing.length === 0) {
    throw new RecordingNotFoundError(id)
  }

  const updateData: Record<string, unknown> = {}
  if (input.recordingDate !== undefined) updateData.recordingDate = input.recordingDate
  if (input.dead !== undefined) updateData.dead = input.dead
  if (input.culled !== undefined) updateData.culled = input.culled
  if (input.remainingPopulation !== undefined)
    updateData.remainingPopulation = input.remainingPopulation
  if (input.bodyWeightG !== undefined) updateData.bodyWeightG = input.bodyWeightG.toString()
  if (input.feedConsumedKg !== undefined)
    updateData.feedConsumedKg = input.feedConsumedKg.toString()
  if (input.notes !== undefined) updateData.notes = input.notes

  await db.update(dailyRecordings).set(updateData).where(eq(dailyRecordings.id, id))

  try {
    await db.insert(auditLogs).values({
      userId,
      action: 'update',
      resource: 'recording',
      resourceId: String(id),
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(input),
    })
  } catch {
    // Fire-and-forget audit logging
  }

  return { success: true }
}

export async function softDeleteRecording(
  id: number,
  tenantId: number,
  userId: string,
) {
  const existing = await db
    .select({ id: dailyRecordings.id })
    .from(dailyRecordings)
    .where(and(eq(dailyRecordings.id, id), isNull(dailyRecordings.deletedAt)))
    .limit(1)

  if (existing.length === 0) {
    throw new RecordingNotFoundError(id)
  }

  await db
    .update(dailyRecordings)
    .set({ deletedAt: new Date() })
    .where(eq(dailyRecordings.id, id))

  try {
    await db.insert(auditLogs).values({
      userId,
      action: 'delete',
      resource: 'recording',
      resourceId: String(id),
    })
  } catch {
    // Fire-and-forget audit logging
  }

  return { success: true }
}