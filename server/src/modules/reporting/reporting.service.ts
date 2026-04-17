import { db } from '../../config/database'
import { redis } from '../../config/redis'
import { feedStock, feedProducts, dailyRecordings, cycles } from '../../db/schema'
import { feedStock as feedStockTable } from '../../db/schema/feed_stock'
import { feedProducts as feedProductsTable } from '../../db/schema/feed_products'
import { dailyRecordings as dailyRecordingsTable } from '../../db/schema/daily_recordings'
import { cycles as cyclesTable } from '../../db/schema/cycles'
import { plasmas as plasmasTable } from '../../db/schema/plasmas'
import { units as unitsTable } from '../../db/schema/units'
import { eq, and, isNull, sql, desc, gte, lte, inArray } from 'drizzle-orm'

// --- Types ---

export interface StockResumeFilters {
  unitId?: number
  plasmaId?: number
  feedProductId?: number
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface PerformanceFilters {
  cycleId?: number
  unitId?: number
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface StockResumeRow {
  feedProductId: number
  feedProductName: string
  feedProductCode: string
  phase: string
  zakKgConversion: string
  totalOpeningStockKg: string
  totalInKg: string
  totalOutKg: string
  totalClosingStockKg: string
  totalClosingStockZak: string
  plasmas: PlasmaStockRow[]
}

export interface PlasmaStockRow {
  plasmaId: number
  plasmaName: string
  unitId: number
  unitName: string
  openingStockKg: string
  totalInKg: string
  totalOutKg: string
  closingStockKg: string
  closingStockZak: string
}

export interface PerformanceRow {
  date: string
  cycleId: number
  cycleNumber: number
  docType: string
  plasmaId: number
  plasmaName: string
  unitId: number
  unitName: string
  dayAge: number
  avgBodyWeightG: number | null
  feedConsumedKg: number
  fcr: number | null
  deplesiPercent: number
  mortalityPercent: number
  population: number
  cumulativeMortalityPercent: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// --- Cache helpers ---

const STOCK_RESUME_CACHE_TTL = 60 // seconds
const PERFORMANCE_CACHE_TTL = 300 // seconds

function stockResumeCacheKey(tenantId: number, filters: StockResumeFilters): string {
  return `reporting:stock-resume:${tenantId}:${filters.unitId ?? 'all'}:${filters.plasmaId ?? 'all'}:${filters.feedProductId ?? 'all'}:${filters.dateFrom ?? 'na'}:${filters.dateTo ?? 'na'}:${filters.page ?? 1}:${filters.limit ?? 20}`
}

function performanceCacheKey(tenantId: number, filters: PerformanceFilters): string {
  return `reporting:performance:${tenantId}:${filters.cycleId ?? 'all'}:${filters.unitId ?? 'all'}:${filters.dateFrom ?? 'na'}:${filters.dateTo ?? 'na'}:${filters.page ?? 1}:${filters.limit ?? 20}`
}

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key)
    if (cached) return JSON.parse(cached) as T
  } catch {
    // Redis unavailable — skip cache
  }
  return null
}

async function setCache(key: string, value: unknown, ttl: number): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value))
  } catch {
    // Redis unavailable — skip cache
  }
}

// --- Stock Resume ---

export async function getStockResume(
  tenantId: number,
  filters: StockResumeFilters,
): Promise<PaginatedResult<StockResumeRow>> {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 20
  const offset = (page - 1) * limit

  const cacheKey = stockResumeCacheKey(tenantId, filters)
  const cached = await getCached<PaginatedResult<StockResumeRow>>(cacheKey)
  if (cached) return cached

  const conditions = [eq(unitsTable.tenantId, tenantId), isNull(plasmasTable.deletedAt)]
  if (filters.plasmaId) {
    conditions.push(eq(feedStockTable.plasmaId, filters.plasmaId))
  }
  if (filters.feedProductId) {
    conditions.push(eq(feedStockTable.feedProductId, filters.feedProductId))
  }
  if (filters.unitId) {
    conditions.push(eq(plasmasTable.unitId, filters.unitId))
  }

  const whereClause = and(...conditions)

  // Count distinct products for pagination metadata
  const [{ count }] = await db
    .select({ count: sql<number>`count(distinct ${feedStockTable.feedProductId})` })
    .from(feedStockTable)
    .innerJoin(plasmasTable, eq(feedStockTable.plasmaId, plasmasTable.id))
    .innerJoin(unitsTable, eq(plasmasTable.unitId, unitsTable.id))
    .where(whereClause)

  const total = Number(count)
  const totalPages = Math.ceil(total / limit)

  // Get paginated product IDs for this page
  const paginatedProductIds = await db
    .selectDistinct({ feedProductId: feedStockTable.feedProductId })
    .from(feedStockTable)
    .innerJoin(plasmasTable, eq(feedStockTable.plasmaId, plasmasTable.id))
    .innerJoin(unitsTable, eq(plasmasTable.unitId, unitsTable.id))
    .where(whereClause)
    .orderBy(feedStockTable.feedProductId)
    .limit(limit)
    .offset(offset)

  const productIdList = paginatedProductIds.map((r) => r.feedProductId)

  if (productIdList.length === 0) {
    const emptyResult: PaginatedResult<StockResumeRow> = { data: [], total, page, limit, totalPages }
    await setCache(cacheKey, emptyResult, STOCK_RESUME_CACHE_TTL)
    return emptyResult
  }

  // Fetch stock rows only for the paginated products
  const stockRows = await db
    .select({
      id: feedStockTable.id,
      plasmaId: feedStockTable.plasmaId,
      feedProductId: feedStockTable.feedProductId,
      openingStockKg: feedStockTable.openingStockKg,
      totalInKg: feedStockTable.totalInKg,
      totalOutKg: feedStockTable.totalOutKg,
      closingStockKg: feedStockTable.closingStockKg,
      plasmaName: plasmasTable.name,
      unitId: plasmasTable.unitId,
      unitName: unitsTable.name,
    })
    .from(feedStockTable)
    .innerJoin(plasmasTable, eq(feedStockTable.plasmaId, plasmasTable.id))
    .innerJoin(unitsTable, eq(plasmasTable.unitId, unitsTable.id))
    .where(and(...conditions, inArray(feedStockTable.feedProductId, productIdList)))

  const productConditions = [eq(feedProductsTable.tenantId, tenantId), isNull(feedProductsTable.deletedAt)]
  const products = await db
    .select({
      id: feedProductsTable.id,
      name: feedProductsTable.name,
      code: feedProductsTable.code,
      phase: feedProductsTable.phase,
      zakKgConversion: feedProductsTable.zakKgConversion,
    })
    .from(feedProductsTable)
    .where(and(...productConditions))

  const productMap = new Map(products.map((p) => [p.id, p]))

  const groupedByProduct = new Map<number, {
    product: typeof products[0]
    plasmas: (typeof stockRows[0] & { closingStockZak: string })[]
  }>()

  for (const row of stockRows) {
    const product = productMap.get(row.feedProductId)
    if (!product) continue

    const conversion = parseFloat(product.zakKgConversion || '50')
    const closingKg = parseFloat(row.closingStockKg || '0')
    const closingZak = conversion > 0 ? closingKg / conversion : 0

    const plasmaRow = {
      ...row,
      closingStockZak: closingZak.toFixed(3),
    }

    if (!groupedByProduct.has(row.feedProductId)) {
      groupedByProduct.set(row.feedProductId, { product, plasmas: [] })
    }
    groupedByProduct.get(row.feedProductId)!.plasmas.push(plasmaRow)
  }

  const data: StockResumeRow[] = []
  for (const productId of productIdList) {
    const group = groupedByProduct.get(productId)
    if (!group) continue

    const conversion = parseFloat(group.product.zakKgConversion || '50')
    const totalOpeningKg = group.plasmas.reduce((sum, p) => sum + parseFloat(p.openingStockKg || '0'), 0)
    const totalInKg = group.plasmas.reduce((sum, p) => sum + parseFloat(p.totalInKg || '0'), 0)
    const totalOutKg = group.plasmas.reduce((sum, p) => sum + parseFloat(p.totalOutKg || '0'), 0)
    const totalClosingKg = group.plasmas.reduce((sum, p) => sum + parseFloat(p.closingStockKg || '0'), 0)
    const totalClosingZak = conversion > 0 ? totalClosingKg / conversion : 0

    data.push({
      feedProductId: productId,
      feedProductName: group.product.name,
      feedProductCode: group.product.code,
      phase: group.product.phase,
      zakKgConversion: group.product.zakKgConversion || '50',
      totalOpeningStockKg: totalOpeningKg.toFixed(3),
      totalInKg: totalInKg.toFixed(3),
      totalOutKg: totalOutKg.toFixed(3),
      totalClosingStockKg: totalClosingKg.toFixed(3),
      totalClosingStockZak: totalClosingZak.toFixed(3),
      plasmas: group.plasmas.map((p) => ({
        plasmaId: p.plasmaId,
        plasmaName: p.plasmaName,
        unitId: p.unitId,
        unitName: p.unitName,
        openingStockKg: p.openingStockKg || '0',
        totalInKg: p.totalInKg || '0',
        totalOutKg: p.totalOutKg || '0',
        closingStockKg: p.closingStockKg || '0',
        closingStockZak: p.closingStockZak,
      })),
    })
  }

  const result: PaginatedResult<StockResumeRow> = {
    data,
    total,
    page,
    limit,
    totalPages,
  }

  await setCache(cacheKey, result, STOCK_RESUME_CACHE_TTL)
  return result
}

// --- Performance Report ---

export async function getPerformanceReport(
  tenantId: number,
  filters: PerformanceFilters,
): Promise<PaginatedResult<PerformanceRow>> {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 20
  const offset = (page - 1) * limit

  const cacheKey = performanceCacheKey(tenantId, filters)
  const cached = await getCached<PaginatedResult<PerformanceRow>>(cacheKey)
  if (cached) return cached

  const conditions = [
    eq(unitsTable.tenantId, tenantId),
    isNull(cyclesTable.deletedAt),
    isNull(dailyRecordingsTable.deletedAt),
  ]
  if (filters.cycleId) {
    conditions.push(eq(dailyRecordingsTable.cycleId, filters.cycleId))
  }
  if (filters.unitId) {
    conditions.push(eq(plasmasTable.unitId, filters.unitId))
  }
  if (filters.dateFrom) {
    conditions.push(gte(dailyRecordingsTable.recordingDate, filters.dateFrom))
  }
  if (filters.dateTo) {
    conditions.push(lte(dailyRecordingsTable.recordingDate, filters.dateTo))
  }

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(dailyRecordingsTable)
    .innerJoin(cyclesTable, eq(dailyRecordingsTable.cycleId, cyclesTable.id))
    .innerJoin(plasmasTable, eq(cyclesTable.plasmaId, plasmasTable.id))
    .innerJoin(unitsTable, eq(plasmasTable.unitId, unitsTable.id))
    .where(and(...conditions))

  const total = Number(countResult[0]?.count ?? 0)
  const totalPages = Math.ceil(total / limit)

  const recordings = await db
    .select({
      id: dailyRecordingsTable.id,
      recordingDate: dailyRecordingsTable.recordingDate,
      dayAge: dailyRecordingsTable.dayAge,
      dead: dailyRecordingsTable.dead,
      culled: dailyRecordingsTable.culled,
      remainingPopulation: dailyRecordingsTable.remainingPopulation,
      bodyWeightG: dailyRecordingsTable.bodyWeightG,
      feedConsumedKg: dailyRecordingsTable.feedConsumedKg,
      cycleId: cyclesTable.id,
      cycleNumber: cyclesTable.cycleNumber,
      docType: cyclesTable.docType,
      initialPopulation: cyclesTable.initialPopulation,
      plasmaId: plasmasTable.id,
      plasmaName: plasmasTable.name,
      unitId: unitsTable.id,
      unitName: unitsTable.name,
    })
    .from(dailyRecordingsTable)
    .innerJoin(cyclesTable, eq(dailyRecordingsTable.cycleId, cyclesTable.id))
    .innerJoin(plasmasTable, eq(cyclesTable.plasmaId, plasmasTable.id))
    .innerJoin(unitsTable, eq(plasmasTable.unitId, unitsTable.id))
    .where(and(...conditions))
    .orderBy(desc(dailyRecordingsTable.recordingDate))
    .limit(limit)
    .offset(offset)

  const cycleIds = [...new Set(recordings.map((r) => r.cycleId))]

  const cumulativeFeedMap = new Map<number, Map<string, number>>()
  const cumulativeMortalityMap = new Map<number, Map<string, { totalDead: number; totalCulled: number }>>()

  if (cycleIds.length > 0) {
    const feedRows = await db
      .select({
        cycleId: dailyRecordingsTable.cycleId,
        recordingDate: dailyRecordingsTable.recordingDate,
        cumulativeFeed: sql<number>`cast(sum(${dailyRecordingsTable.feedConsumedKg}) over (partition by ${dailyRecordingsTable.cycleId} order by ${dailyRecordingsTable.recordingDate}) as decimal(10,3))`,
      })
      .from(dailyRecordingsTable)
      .where(
        and(
          inArray(dailyRecordingsTable.cycleId, cycleIds),
          isNull(dailyRecordingsTable.deletedAt),
        ),
      )
      .orderBy(dailyRecordingsTable.cycleId, dailyRecordingsTable.recordingDate)

    for (const row of feedRows) {
      if (!cumulativeFeedMap.has(row.cycleId)) {
        cumulativeFeedMap.set(row.cycleId, new Map())
      }
      cumulativeFeedMap.get(row.cycleId)!.set(String(row.recordingDate), Number(row.cumulativeFeed ?? 0))
    }

    const mortalityRows = await db
      .select({
        cycleId: dailyRecordingsTable.cycleId,
        recordingDate: dailyRecordingsTable.recordingDate,
        dead: dailyRecordingsTable.dead,
        culled: dailyRecordingsTable.culled,
      })
      .from(dailyRecordingsTable)
      .where(
        and(
          inArray(dailyRecordingsTable.cycleId, cycleIds),
          isNull(dailyRecordingsTable.deletedAt),
        ),
      )
      .orderBy(dailyRecordingsTable.cycleId, dailyRecordingsTable.recordingDate)

    // Accumulate running totals per cycle
    const runningTotals = new Map<number, { dead: number; culled: number }>()
    for (const row of mortalityRows) {
      const totals = runningTotals.get(row.cycleId) ?? { dead: 0, culled: 0 }
      totals.dead += Number(row.dead ?? 0)
      totals.culled += Number(row.culled ?? 0)
      runningTotals.set(row.cycleId, totals)

      if (!cumulativeMortalityMap.has(row.cycleId)) {
        cumulativeMortalityMap.set(row.cycleId, new Map())
      }
      cumulativeMortalityMap.get(row.cycleId)!.set(String(row.recordingDate), {
        totalDead: totals.dead,
        totalCulled: totals.culled,
      })
    }
  }

  const data: PerformanceRow[] = recordings.map((rec) => {
    const initialPop = rec.initialPopulation
    const remainingPop = rec.remainingPopulation
    const dead = rec.dead ?? 0
    const culled = rec.culled ?? 0

    // Deplesi: (initial - remaining) / initial * 100
    const deplesiPercent = initialPop > 0
      ? Math.round(((initialPop - remainingPop) / initialPop) * 10000) / 100
      : 0

    // Daily mortality: (dead + culled) / initial * 100
    const mortalityPercent = initialPop > 0
      ? Math.round(((dead + culled) / initialPop) * 10000) / 100
      : 0

    const cumData = cumulativeMortalityMap.get(rec.cycleId)?.get(String(rec.recordingDate))
    const cumDead = cumData?.totalDead ?? 0
    const cumCulled = cumData?.totalCulled ?? 0
    const cumulativeMortalityPercent = initialPop > 0
      ? Math.round(((cumDead + cumCulled) / initialPop) * 10000) / 100
      : 0

    // FCR = cumulative feed consumed / total weight gain
    // For DOC: initial weight ≈ 0g, so weight gain ≈ current avg body weight
    // totalWeightGainKg = (avgBodyWeightG / 1000) * remainingPopulation
    const feedConsumedKg = Number(rec.feedConsumedKg ?? 0)
    const avgBodyWeightG = rec.bodyWeightG ? parseFloat(rec.bodyWeightG) : null

    const cumFeedMap = cumulativeFeedMap.get(rec.cycleId)
    const cumulativeFeedKg = cumFeedMap?.get(String(rec.recordingDate)) ?? feedConsumedKg

    let fcr: number | null = null
    if (avgBodyWeightG !== null && avgBodyWeightG > 0 && remainingPop > 0) {
      const totalWeightGainKg = (avgBodyWeightG / 1000) * remainingPop
      if (totalWeightGainKg > 0 && cumulativeFeedKg > 0) {
        fcr = Math.round((cumulativeFeedKg / totalWeightGainKg) * 100) / 100
      }
    }

    return {
      date: String(rec.recordingDate),
      cycleId: rec.cycleId,
      cycleNumber: rec.cycleNumber,
      docType: rec.docType,
      plasmaId: rec.plasmaId,
      plasmaName: rec.plasmaName,
      unitId: rec.unitId,
      unitName: rec.unitName,
      dayAge: rec.dayAge,
      avgBodyWeightG: avgBodyWeightG,
      feedConsumedKg: Math.round(feedConsumedKg * 1000) / 1000,
      fcr,
      deplesiPercent,
      mortalityPercent,
      population: remainingPop,
      cumulativeMortalityPercent,
    }
  })

  const result: PaginatedResult<PerformanceRow> = {
    data,
    total,
    page,
    limit,
    totalPages,
  }

  await setCache(cacheKey, result, PERFORMANCE_CACHE_TTL)
  return result
}

// --- CSV Export Helpers ---

export function stockResumeToCSV(rows: StockResumeRow[]): string {
  const headers = [
    'feed_product_id',
    'feed_product_name',
    'feed_product_code',
    'phase',
    'zak_kg_conversion',
    'total_opening_stock_kg',
    'total_in_kg',
    'total_out_kg',
    'total_closing_stock_kg',
    'total_closing_stock_zak',
    'plasma_id',
    'plasma_name',
    'unit_id',
    'unit_name',
    'plasma_opening_stock_kg',
    'plasma_in_kg',
    'plasma_out_kg',
    'plasma_closing_stock_kg',
    'plasma_closing_stock_zak',
  ]

  const lines: string[] = [headers.join(',')]

  for (const row of rows) {
    for (const plasma of row.plasmas) {
      const line = [
        row.feedProductId,
        csvEscape(row.feedProductName),
        csvEscape(row.feedProductCode),
        csvEscape(row.phase),
        row.zakKgConversion,
        row.totalOpeningStockKg,
        row.totalInKg,
        row.totalOutKg,
        row.totalClosingStockKg,
        row.totalClosingStockZak,
        plasma.plasmaId,
        csvEscape(plasma.plasmaName),
        plasma.unitId,
        csvEscape(plasma.unitName),
        plasma.openingStockKg,
        plasma.totalInKg,
        plasma.totalOutKg,
        plasma.closingStockKg,
        plasma.closingStockZak,
      ]
      lines.push(line.join(','))
    }
  }

  return lines.join('\n')
}

export function performanceToCSV(rows: PerformanceRow[]): string {
  const headers = [
    'date',
    'cycle_id',
    'cycle_number',
    'doc_type',
    'plasma_id',
    'plasma_name',
    'unit_id',
    'unit_name',
    'day_age',
    'avg_body_weight_g',
    'feed_consumed_kg',
    'fcr',
    'deplesi_percent',
    'mortality_percent',
    'population',
    'cumulative_mortality_percent',
  ]

  const lines: string[] = [headers.join(',')]

  for (const row of rows) {
    const line = [
      row.date,
      row.cycleId,
      row.cycleNumber,
      csvEscape(row.docType),
      row.plasmaId,
      csvEscape(row.plasmaName),
      row.unitId,
      csvEscape(row.unitName),
      row.dayAge,
      row.avgBodyWeightG ?? '',
      row.feedConsumedKg,
      row.fcr ?? '',
      row.deplesiPercent,
      row.mortalityPercent,
      row.population,
      row.cumulativeMortalityPercent,
    ]
    lines.push(line.join(','))
  }

  return lines.join('\n')
}

function csvEscape(value: string): string {
  if (!value) return ''
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}