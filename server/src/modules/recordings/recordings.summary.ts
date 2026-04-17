import { db } from '../../config/database'
import { dailyRecordings, cycles as cyclesTable, standards } from '../../db/schema'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { plasmas as plasmasTable } from '../../db/schema/plasmas'
import { units as unitsTable } from '../../db/schema/units'
import { CycleNotFoundError } from './recordings.errors'

export interface CycleSummary {
  cycle: {
    id: number
    docType: string
    chickInDate: string
    initialPopulation: number
    status: string
    harvestDate: string | null
  }
  recordings: Array<{
    id: number
    recordingDate: string
    dayAge: number
    dead: number
    culled: number
    remainingPopulation: number
    bodyWeightG: string | null
    feedConsumedKg: string | null
  }>
  cumulativeMetrics: {
    totalDead: number
    totalCulled: number
    totalFeedKg: number
    cumulativeMortality: number
    deplesi: number
    survivalRate: number
    averageBodyWeight: number | null
    runningFCR: number | null
  }
  deviation?: {
    grams: number
    percent: number
    status: 'above_standard' | 'on_standard' | 'below_standard'
    standardBwG?: number
    actualBwG: number
  }
  ip?: number
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

function calculateRunningFCR(totalFeedKg: number, totalWeightGainKg: number): number | null {
  if (totalWeightGainKg <= 0) return null
  return totalFeedKg / totalWeightGainKg
}

function calculateIP(
  survivalRate: number,
  actualBw: number,
  standardBw: number,
  actualFcr: number,
  standardFcr: number,
): number {
  const bwAchievement = standardBw > 0 ? (actualBw / standardBw) * 100 : 0
  const fcrAchievement = actualFcr > 0 ? (standardFcr / actualFcr) * 100 : 0
  
  const ip = (survivalRate * 0.4) + (bwAchievement * 0.3) + (fcrAchievement * 0.3)
  return Math.round(ip * 100) / 100
}

export async function getCycleSummary(cycleId: number, tenantId: number): Promise<CycleSummary> {
  const cycleResult = await db
    .select({
      id: cyclesTable.id,
      docType: cyclesTable.docType,
      chickInDate: cyclesTable.chickInDate,
      initialPopulation: cyclesTable.initialPopulation,
      status: cyclesTable.status,
      harvestDate: cyclesTable.harvestDate,
      finalPopulation: cyclesTable.finalPopulation,
      totalFeedKg: cyclesTable.totalFeedKg,
    })
    .from(cyclesTable)
    .innerJoin(plasmasTable, eq(cyclesTable.plasmaId, plasmasTable.id))
    .innerJoin(unitsTable, eq(plasmasTable.unitId, unitsTable.id))
    .where(and(eq(cyclesTable.id, cycleId), eq(unitsTable.tenantId, tenantId), isNull(cyclesTable.deletedAt)))
    .limit(1)

  if (cycleResult.length === 0) {
    throw new CycleNotFoundError(cycleId)
  }

  const cycle = cycleResult[0]

  const recordingsResult = await db
    .select({
      id: dailyRecordings.id,
      recordingDate: dailyRecordings.recordingDate,
      dayAge: dailyRecordings.dayAge,
      dead: dailyRecordings.dead,
      culled: dailyRecordings.culled,
      remainingPopulation: dailyRecordings.remainingPopulation,
      bodyWeightG: dailyRecordings.bodyWeightG,
      feedConsumedKg: dailyRecordings.feedConsumedKg,
    })
    .from(dailyRecordings)
    .where(and(eq(dailyRecordings.cycleId, cycleId), isNull(dailyRecordings.deletedAt)))
    .orderBy(desc(dailyRecordings.recordingDate))

  const totalDead = recordingsResult.reduce((sum, r) => sum + (r.dead ?? 0), 0)
  const totalCulled = recordingsResult.reduce((sum, r) => sum + (r.culled ?? 0), 0)
  const totalFeedKg = recordingsResult.reduce(
    (sum, r) => sum + parseFloat(r.feedConsumedKg || '0'),
    0
  )

  const cumulativeMortality = cycle.initialPopulation > 0
    ? (totalDead + totalCulled) / cycle.initialPopulation * 100
    : 0

  const latestRecording = recordingsResult[0]
  const remainingPopulation = latestRecording?.remainingPopulation ?? cycle.initialPopulation
  
  const deplesi = cycle.initialPopulation > 0
    ? (cycle.initialPopulation - remainingPopulation) / cycle.initialPopulation * 100
    : 0

  const survivalRate = cycle.initialPopulation > 0
    ? (remainingPopulation / cycle.initialPopulation) * 100
    : 0

  let averageBodyWeight: number | null = null
  if (recordingsResult.length > 0) {
    const weightsWithValue = recordingsResult.filter(r => r.bodyWeightG != null)
    if (weightsWithValue.length > 0) {
      const sumWeight = weightsWithValue.reduce((sum, r) => sum + parseFloat(r.bodyWeightG || '0'), 0)
      averageBodyWeight = Math.round((sumWeight / weightsWithValue.length) * 100) / 100
    }
  }

  const initialWeightKg = 0.04
  const latestWeightKg = latestRecording?.bodyWeightG 
    ? parseFloat(latestRecording.bodyWeightG) / 1000 
    : null
  const totalWeightGainKg = latestWeightKg 
    ? latestWeightKg - initialWeightKg 
    : null

  let runningFCR: number | null = null
  if (totalWeightGainKg !== null && totalWeightGainKg > 0 && recordingsResult.length > 0) {
    const lastDayAge = latestRecording?.dayAge ?? 0
    if (lastDayAge >= 7) {
      runningFCR = calculateRunningFCR(totalFeedKg, totalWeightGainKg)
      if (runningFCR !== null) {
        runningFCR = Math.round(runningFCR * 100) / 100
      }
    }
  }

  let deviation: CycleSummary['deviation'] | undefined
  if (latestRecording?.bodyWeightG) {
    const actualBw = parseFloat(latestRecording.bodyWeightG)
    const std = await fetchStandard(cycle.docType, latestRecording.dayAge)
    if (std) {
      const grams = actualBw - std.standardBwG
      const percent = ((actualBw - std.standardBwG) / std.standardBwG) * 100
      let status: 'above_standard' | 'on_standard' | 'below_standard' = 'on_standard'
      if (grams > 10) status = 'above_standard'
      else if (grams < -10) status = 'below_standard'

      deviation = {
        grams: Math.round(grams * 100) / 100,
        percent: Math.round(percent * 100) / 100,
        status,
        standardBwG: std.standardBwG,
        actualBwG: actualBw,
      }
    }
  }

  let ip: number | undefined
  if (cycle.status === 'completed' && latestRecording?.bodyWeightG) {
    const actualBw = parseFloat(latestRecording.bodyWeightG)
    const actualFcr = runningFCR ?? 0

    const std = await fetchStandard(cycle.docType, latestRecording.dayAge)
    const standardFcr = std?.standardFcr ?? 0

    ip = calculateIP(
      survivalRate,
      actualBw,
      std?.standardBwG ?? 0,
      actualFcr,
      standardFcr
    )
  }

  return {
    cycle: {
      id: cycle.id,
      docType: cycle.docType,
      chickInDate: cycle.chickInDate instanceof Date ? cycle.chickInDate.toISOString().split('T')[0] : String(cycle.chickInDate),
      initialPopulation: cycle.initialPopulation,
      status: cycle.status,
      harvestDate: cycle.harvestDate instanceof Date ? cycle.harvestDate.toISOString().split('T')[0] : (cycle.harvestDate ? String(cycle.harvestDate) : null),
    },
    recordings: recordingsResult.map(r => ({
      id: r.id,
      recordingDate: r.recordingDate instanceof Date ? r.recordingDate.toISOString().split('T')[0] : String(r.recordingDate),
      dayAge: r.dayAge,
      dead: r.dead ?? 0,
      culled: r.culled ?? 0,
      remainingPopulation: r.remainingPopulation,
      bodyWeightG: r.bodyWeightG,
      feedConsumedKg: r.feedConsumedKg,
    })),
    cumulativeMetrics: {
      totalDead,
      totalCulled,
      totalFeedKg: Math.round(totalFeedKg * 100) / 100,
      cumulativeMortality: Math.round(cumulativeMortality * 100) / 100,
      deplesi: Math.round(deplesi * 100) / 100,
      survivalRate: Math.round(survivalRate * 100) / 100,
      averageBodyWeight,
      runningFCR,
    },
    deviation,
    ip,
  }
}