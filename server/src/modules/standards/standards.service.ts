import { db } from '../../config/database'
import { standards } from '../../db/schema'
import { eq, asc } from 'drizzle-orm'

export interface StandardRow {
  id: number
  docType: string
  dayAge: number
  standardBwG: string
  standardFcr: string | null
  dailyGainG: string | null
  cumFeedIntakeG: string | null
}

export async function listStandardsByDocType(docType: string): Promise<StandardRow[]> {
  return db
    .select()
    .from(standards)
    .where(eq(standards.docType, docType))
    .orderBy(asc(standards.dayAge))
}

export async function getStandardBwForDay(
  docType: string,
  dayAge: number,
): Promise<string | null> {
  const result = await db
    .select()
    .from(standards)
    .where(eq(standards.docType, docType))
    .orderBy(asc(standards.dayAge))
    .limit(1)
  
  return result[0]?.standardBwG ?? null
}

export async function getStandardsForCycle(cycleId: number): Promise<StandardRow[]> {
  // This would need cycle info to get docType
  // For now, return default CP standards
  return listStandardsByDocType('CP')
}