import { db } from '../../config/database'
import { feedProducts, feedStock, feedMovements, feedSuratJalan, auditLogs } from '../../db/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'
import { feedProducts as feedProductsTable } from '../../db/schema/feed_products'
import { feedStock as feedStockTable } from '../../db/schema/feed_stock'
import { feedMovements as feedMovementsTable } from '../../db/schema/feed_movements'
import { feedSuratJalan as feedSuratJalanTable } from '../../db/schema/feed_surat_jalan'
import { plasmas as plasmasTable } from '../../db/schema/plasmas'
import { units as unitsTable } from '../../db/schema/units'
import {
  FeedProductNotFoundError,
  DuplicateFeedCodeError,
  InvalidSuratJalanError,
  FeedStockNotFoundError,
  NegativeStockError,
  PlasmaNotInTenantError,
} from './feed.errors'

interface CreateFeedProductInput {
  code: string
  name: string
  phase: string
  proteinPercent?: number
  defaultUnit?: string
  zakKgConversion?: number
}

interface UpdateFeedProductInput {
  name?: string
  phase?: string
  proteinPercent?: number
  defaultUnit?: string
  zakKgConversion?: number
}

interface CreateSuratJalanInput {
  plasmaId: number
  feedProductId: number
  suratJalanNumber: string
  vendor: string
  deliveryDate: string
  vehicleNumber?: string
  driverName?: string
  totalZak: number
  totalKg: number
  notes?: string
}

async function verifyPlasmaInTenant(plasmaId: number, tenantId: number): Promise<void> {
  const result = await db
    .select({ id: plasmasTable.id })
    .from(plasmasTable)
    .innerJoin(unitsTable, eq(plasmasTable.unitId, unitsTable.id))
    .where(and(eq(plasmasTable.id, plasmaId), eq(unitsTable.tenantId, tenantId), isNull(plasmasTable.deletedAt)))
    .limit(1)

  if (result.length === 0) {
    throw new PlasmaNotInTenantError(plasmaId)
  }
}

export async function createFeedProduct(
  input: CreateFeedProductInput,
  tenantId: number,
  userId: string,
) {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: feedProductsTable.id })
      .from(feedProductsTable)
      .where(and(eq(feedProductsTable.code, input.code), eq(feedProductsTable.tenantId, tenantId)))
      .limit(1)

    if (existing.length > 0) {
      throw new DuplicateFeedCodeError(input.code)
    }

    try {
      const result = await tx.insert(feedProductsTable).values({
        tenantId,
        code: input.code,
        name: input.name,
        phase: input.phase,
        proteinPercent: input.proteinPercent?.toString() ?? null,
        defaultUnit: input.defaultUnit ?? 'zak',
        zakKgConversion: input.zakKgConversion?.toString() ?? '50',
      })

      const newId = result[0].insertId

      try {
        await tx.insert(auditLogs).values({
          userId,
          action: 'create',
          resource: 'feed_product',
          resourceId: String(newId),
          newValue: JSON.stringify(input),
        })
      } catch {
        // Fire-and-forget audit logging
      }

      return { id: newId, ...input }
    } catch (error: any) {
      if (error?.errno === 1062 || error?.code === 'ER_DUP_ENTRY') {
        throw new DuplicateFeedCodeError(input.code)
      }
      throw error
    }
  })
}

export async function listFeedProducts(tenantId: number) {
  const products = await db
    .select()
    .from(feedProductsTable)
    .where(and(eq(feedProductsTable.tenantId, tenantId), isNull(feedProductsTable.deletedAt)))

  return products
}

export async function getFeedProduct(id: number, tenantId: number) {
  const result = await db
    .select()
    .from(feedProductsTable)
    .where(and(eq(feedProductsTable.id, id), eq(feedProductsTable.tenantId, tenantId), isNull(feedProductsTable.deletedAt)))
    .limit(1)

  if (result.length === 0) {
    throw new FeedProductNotFoundError(id)
  }

  return result[0]
}

export async function updateFeedProduct(
  id: number,
  input: UpdateFeedProductInput,
  tenantId: number,
  userId: string,
) {
  const existing = await db
    .select()
    .from(feedProductsTable)
    .where(and(eq(feedProductsTable.id, id), eq(feedProductsTable.tenantId, tenantId), isNull(feedProductsTable.deletedAt)))
    .limit(1)

  if (existing.length === 0) {
    throw new FeedProductNotFoundError(id)
  }

  const updateData: Record<string, unknown> = {}
  if (input.name !== undefined) updateData.name = input.name
  if (input.phase !== undefined) updateData.phase = input.phase
  if (input.proteinPercent !== undefined) updateData.proteinPercent = input.proteinPercent.toString()
  if (input.defaultUnit !== undefined) updateData.defaultUnit = input.defaultUnit
  if (input.zakKgConversion !== undefined) updateData.zakKgConversion = input.zakKgConversion.toString()

  await db.update(feedProductsTable).set(updateData).where(eq(feedProductsTable.id, id))

  try {
    await db.insert(auditLogs).values({
      userId,
      action: 'update',
      resource: 'feed_product',
      resourceId: String(id),
      oldValue: JSON.stringify(existing[0]),
      newValue: JSON.stringify(input),
    })
  } catch {
    // Fire-and-forget audit logging
  }

  return { success: true }
}

export async function softDeleteFeedProduct(
  id: number,
  tenantId: number,
  userId: string,
) {
  const existing = await db
    .select()
    .from(feedProductsTable)
    .where(and(eq(feedProductsTable.id, id), eq(feedProductsTable.tenantId, tenantId), isNull(feedProductsTable.deletedAt)))
    .limit(1)

  if (existing.length === 0) {
    throw new FeedProductNotFoundError(id)
  }

  await db
    .update(feedProductsTable)
    .set({ deletedAt: new Date(), isActive: 0 })
    .where(eq(feedProductsTable.id, id))

  try {
    await db.insert(auditLogs).values({
      userId,
      action: 'delete',
      resource: 'feed_product',
      resourceId: String(id),
      oldValue: JSON.stringify(existing[0]),
    })
  } catch {
    // Fire-and-forget audit logging
  }

  return { success: true }
}

export async function createSuratJalan(
  input: CreateSuratJalanInput,
  tenantId: number,
  userId: string,
) {
  await verifyPlasmaInTenant(input.plasmaId, tenantId)

  return db.transaction(async (tx) => {
    const existingSJ = await tx
      .select({ id: feedSuratJalanTable.id })
      .from(feedSuratJalanTable)
      .where(eq(feedSuratJalanTable.suratJalanNumber, input.suratJalanNumber))
      .limit(1)

    if (existingSJ.length > 0) {
      throw new InvalidSuratJalanError(input.suratJalanNumber)
    }

    const product = await tx
      .select({ zakKgConversion: feedProductsTable.zakKgConversion })
      .from(feedProductsTable)
      .where(and(eq(feedProductsTable.id, input.feedProductId), eq(feedProductsTable.tenantId, tenantId), isNull(feedProductsTable.deletedAt)))
      .limit(1)

    if (product.length === 0) {
      throw new FeedProductNotFoundError(input.feedProductId)
    }

    try {
      const sjResult = await tx.insert(feedSuratJalanTable).values({
        plasmaId: input.plasmaId,
        feedProductId: input.feedProductId,
        suratJalanNumber: input.suratJalanNumber,
        vendor: input.vendor,
        deliveryDate: input.deliveryDate,
        vehicleNumber: input.vehicleNumber ?? null,
        driverName: input.driverName ?? null,
        totalZak: input.totalZak.toString(),
        totalKg: input.totalKg.toString(),
        notes: input.notes ?? null,
        createdBy: userId,
      })

      const suratJalanId = sjResult[0].insertId

      await tx.insert(feedMovementsTable).values({
        plasmaId: input.plasmaId,
        feedProductId: input.feedProductId,
        movementType: 'in',
        quantityKg: input.totalKg.toString(),
        quantityZak: input.totalZak.toString(),
        referenceType: 'surat_jalan',
        referenceId: suratJalanId,
        notes: input.notes ?? null,
        createdBy: userId,
      })

      const existingStock = await tx
        .select()
        .from(feedStockTable)
        .where(
          and(
            eq(feedStockTable.plasmaId, input.plasmaId),
            eq(feedStockTable.feedProductId, input.feedProductId),
          ),
        )
        .limit(1)

      if (existingStock.length === 0) {
        await tx.insert(feedStockTable).values({
          plasmaId: input.plasmaId,
          feedProductId: input.feedProductId,
          openingStockKg: '0',
          totalInKg: input.totalKg.toString(),
          totalOutKg: '0',
          closingStockKg: input.totalKg.toString(),
        })
      } else {
        await tx
          .update(feedStockTable)
          .set({
            totalInKg: sql`${feedStockTable.totalInKg} + ${input.totalKg}`,
            closingStockKg: sql`${feedStockTable.closingStockKg} + ${input.totalKg}`,
            lastUpdatedAt: new Date(),
          })
          .where(eq(feedStockTable.id, existingStock[0].id))
      }
    } catch (error: any) {
      if (error?.errno === 1062 || error?.code === 'ER_DUP_ENTRY') {
        throw new InvalidSuratJalanError(input.suratJalanNumber)
      }
      throw error
    }
  })

  try {
    await db.insert(auditLogs).values({
      userId,
      action: 'create',
      resource: 'surat_jalan',
      newValue: JSON.stringify(input),
    })
  } catch {
    // Fire-and-forget audit logging
  }

  return { success: true }
}

// --- Stock Query ---

interface StockInfo {
  plasmaId: number
  feedProductId: number
  openingStockKg: string
  totalInKg: string
  totalOutKg: string
  closingStockKg: string
  closingStockZak: string
  productName?: string
  zakKgConversion?: string
}

export async function getStockForPlasmaFeed(
  plasmaId: number,
  feedProductId: number,
  tenantId: number,
): Promise<StockInfo> {
  await verifyPlasmaInTenant(plasmaId, tenantId)

  const stockRows = await db
    .select()
    .from(feedStockTable)
    .where(
      and(
        eq(feedStockTable.plasmaId, plasmaId),
        eq(feedStockTable.feedProductId, feedProductId),
      ),
    )
    .limit(1)

  if (stockRows.length === 0) {
    throw new FeedStockNotFoundError(plasmaId, feedProductId)
  }

  const stock = stockRows[0]
  const productRows = await db
    .select({ zakKgConversion: feedProductsTable.zakKgConversion, name: feedProductsTable.name })
    .from(feedProductsTable)
    .where(and(eq(feedProductsTable.id, feedProductId), eq(feedProductsTable.tenantId, tenantId), isNull(feedProductsTable.deletedAt)))
    .limit(1)

  const zakKgConversion = productRows.length > 0 ? productRows[0].zakKgConversion : '50'
  const productName = productRows.length > 0 ? productRows[0].name : undefined
  const closingKg = parseFloat(stock.closingStockKg || '0')
  const conversion = parseFloat(zakKgConversion || '50')
  const closingZak = conversion > 0 ? closingKg / conversion : 0

  return {
    plasmaId: stock.plasmaId,
    feedProductId: stock.feedProductId,
    openingStockKg: stock.openingStockKg || '0',
    totalInKg: stock.totalInKg || '0',
    totalOutKg: stock.totalOutKg || '0',
    closingStockKg: stock.closingStockKg || '0',
    closingStockZak: closingZak.toFixed(3),
    productName,
    zakKgConversion,
  }
}

export async function getAllStock(
  tenantId: number,
  plasmaId?: number,
  feedProductId?: number,
): Promise<StockInfo[]> {
  const conditions = [eq(unitsTable.tenantId, tenantId)]
  if (plasmaId) {
    conditions.push(eq(feedStockTable.plasmaId, plasmaId))
  }
  if (feedProductId) {
    conditions.push(eq(feedStockTable.feedProductId, feedProductId))
  }

  const stockRows = await db
    .select({
      id: feedStockTable.id,
      plasmaId: feedStockTable.plasmaId,
      feedProductId: feedStockTable.feedProductId,
      openingStockKg: feedStockTable.openingStockKg,
      totalInKg: feedStockTable.totalInKg,
      totalOutKg: feedStockTable.totalOutKg,
      closingStockKg: feedStockTable.closingStockKg,
    })
    .from(feedStockTable)
    .innerJoin(plasmasTable, eq(feedStockTable.plasmaId, plasmasTable.id))
    .innerJoin(unitsTable, eq(plasmasTable.unitId, unitsTable.id))
    .where(and(...conditions))

  const products = await db
    .select({ id: feedProductsTable.id, name: feedProductsTable.name, zakKgConversion: feedProductsTable.zakKgConversion })
    .from(feedProductsTable)
    .where(and(eq(feedProductsTable.tenantId, tenantId), isNull(feedProductsTable.deletedAt)))

  const productMap = new Map(products.map((p) => [p.id, p]))

  return stockRows.map((stock) => {
    const product = productMap.get(stock.feedProductId)
    const zakKgConversion = product?.zakKgConversion ?? '50'
    const productName = product?.name
    const closingKg = parseFloat(stock.closingStockKg || '0')
    const conversion = parseFloat(zakKgConversion || '50')
    const closingZak = conversion > 0 ? closingKg / conversion : 0

    return {
      plasmaId: stock.plasmaId,
      feedProductId: stock.feedProductId,
      openingStockKg: stock.openingStockKg || '0',
      totalInKg: stock.totalInKg || '0',
      totalOutKg: stock.totalOutKg || '0',
      closingStockKg: stock.closingStockKg || '0',
      closingStockZak: closingZak.toFixed(3),
      productName,
      zakKgConversion,
    }
  })
}

// --- Feed Consumption ---

interface RecordConsumptionInput {
  plasmaId: number
  feedProductId: number
  recordingId?: number
  consumptionKg: number
  consumptionZak?: number
  notes?: string
}

export async function recordFeedConsumption(
  input: RecordConsumptionInput,
  tenantId: number,
  userId: string,
) {
  await verifyPlasmaInTenant(input.plasmaId, tenantId)

  return db.transaction(async (tx) => {
    const productRows = await tx
      .select({ zakKgConversion: feedProductsTable.zakKgConversion })
      .from(feedProductsTable)
      .where(
        and(
          eq(feedProductsTable.id, input.feedProductId),
          eq(feedProductsTable.tenantId, tenantId),
          isNull(feedProductsTable.deletedAt),
        ),
      )
      .limit(1)

    if (productRows.length === 0) {
      throw new FeedProductNotFoundError(input.feedProductId)
    }

    const zakKgConversion = parseFloat(productRows[0].zakKgConversion || '50')
    const consumptionZak = input.consumptionZak ?? input.consumptionKg / zakKgConversion

    const stockRows = await tx
      .select()
      .from(feedStockTable)
      .where(
        and(
          eq(feedStockTable.plasmaId, input.plasmaId),
          eq(feedStockTable.feedProductId, input.feedProductId),
        ),
      )
      .limit(1)
      .for('update')

    if (stockRows.length === 0) {
      throw new FeedStockNotFoundError(input.plasmaId, input.feedProductId)
    }

    const currentStock = stockRows[0]
    const currentOutKg = parseFloat(currentStock.totalOutKg || '0')
    const currentInKg = parseFloat(currentStock.totalInKg || '0')
    const openingKg = parseFloat(currentStock.openingStockKg || '0')
    const newOutKg = currentOutKg + input.consumptionKg
    const closingKg = openingKg + currentInKg - newOutKg

    if (closingKg < 0) {
      throw new NegativeStockError(
        (openingKg + currentInKg - currentOutKg).toFixed(3),
        input.consumptionKg.toFixed(3),
      )
    }

    await tx.insert(feedMovementsTable).values({
      plasmaId: input.plasmaId,
      feedProductId: input.feedProductId,
      movementType: 'out',
      quantityKg: input.consumptionKg.toString(),
      quantityZak: consumptionZak.toString(),
      referenceType: input.recordingId ? 'recording' : null,
      referenceId: input.recordingId ?? null,
      notes: input.notes ?? null,
      createdBy: userId,
    })

    await tx
      .update(feedStockTable)
      .set({
        totalOutKg: sql`${feedStockTable.totalOutKg} + ${input.consumptionKg}`,
        closingStockKg: sql`${feedStockTable.closingStockKg} - ${input.consumptionKg}`,
        lastUpdatedAt: new Date(),
      })
      .where(eq(feedStockTable.id, currentStock.id))

    const finalClosingKg = closingKg

    try {
      await tx.insert(auditLogs).values({
        userId,
        action: 'consume',
        resource: 'feed_stock',
        resourceId: String(currentStock.id),
        newValue: JSON.stringify({
          plasmaId: input.plasmaId,
          feedProductId: input.feedProductId,
          consumptionKg: input.consumptionKg,
          consumptionZak,
          closingStockKg: finalClosingKg.toFixed(3),
        }),
      })
    } catch {
      // Fire-and-forget audit logging
    }

    return {
      success: true,
      consumption: {
        plasmaId: input.plasmaId,
        feedProductId: input.feedProductId,
        consumptionKg: input.consumptionKg,
        consumptionZak: parseFloat(consumptionZak.toFixed(3)),
        closingStockKg: finalClosingKg.toFixed(3),
      },
    }
  })
}