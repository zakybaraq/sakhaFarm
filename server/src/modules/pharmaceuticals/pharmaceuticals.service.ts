import { db } from "../../config/database";
import { vitaminsMedicines, pharmaceuticalStock, pharmaceuticalBatches, type NewVitaminMedicine, type NewPharmaceuticalStock, type NewPharmaceuticalBatch } from "../../db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { PharmaceuticalNotFoundError, DuplicatePharmaceuticalCodeError, PharmaceuticalInUseError, BatchNotFoundError, InsufficientStockError } from "./errors";

/**
 * List vitamins/medicines with optional filters.
 */
export async function listPharmaceuticals(
  tenantId: number,
  filters?: { category?: string; isActive?: boolean },
) {
  const conditions = [
    eq(vitaminsMedicines.tenantId, tenantId),
    isNull(vitaminsMedicines.deletedAt),
  ];

  if (filters?.category) {
    conditions.push(eq(vitaminsMedicines.category, filters.category));
  }

  if (filters?.isActive !== undefined) {
    conditions.push(eq(vitaminsMedicines.isActive, filters.isActive ? 1 : 0));
  }

  const result = await db
    .select()
    .from(vitaminsMedicines)
    .where(and(...conditions));

  return result;
}

/**
 * Get single pharmaceutical item.
 */
export async function getPharmaceutical(id: number, tenantId: number) {
  const result = await db
    .select()
    .from(vitaminsMedicines)
    .where(and(
      eq(vitaminsMedicines.id, id),
      eq(vitaminsMedicines.tenantId, tenantId),
      isNull(vitaminsMedicines.deletedAt),
    ))
    .limit(1);

  if (result.length === 0) {
    throw new PharmaceuticalNotFoundError(id);
  }

  return result[0];
}

/**
 * Create new pharmaceutical item.
 */
export async function createPharmaceutical(data: {
  code: string;
  name: string;
  category: "vitamin" | "medicine";
  unitOfMeasure: string;
  manufacturer?: string;
  strength?: string;
  phone?: string;
  supplierId?: number;
}, tenantId: number, userId: string) {
  const existing = await db
    .select()
    .from(vitaminsMedicines)
    .where(and(
      eq(vitaminsMedicines.tenantId, tenantId),
      eq(vitaminsMedicines.code, data.code),
    ));

  if (existing.length > 0) {
    throw new DuplicatePharmaceuticalCodeError(data.code);
  }

  const result = await db
    .insert(vitaminsMedicines)
    .values({
      tenantId,
      code: data.code,
      name: data.name,
      category: data.category,
      unitOfMeasure: data.unitOfMeasure,
      manufacturer: data.manufacturer,
      strength: data.strength,
      phone: data.phone,
      supplierId: data.supplierId,
    });

  return getPharmaceutical(Number(result.insertId), tenantId);
}

/**
 * Update pharmaceutical item.
 */
export async function updatePharmaceutical(
  id: number,
  data: {
    code?: string;
    name?: string;
    category?: string;
    unitOfMeasure?: string;
    manufacturer?: string;
    strength?: string;
    phone?: string;
    supplierId?: number;
    isActive?: number;
  },
  tenantId: number,
  userId: string,
) {
  await getPharmaceutical(id, tenantId);

  const updateData: Record<string, unknown> = {};
  if (data.code !== undefined) updateData.code = data.code;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.unitOfMeasure !== undefined) updateData.unitOfMeasure = data.unitOfMeasure;
  if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer;
  if (data.strength !== undefined) updateData.strength = data.strength;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.supplierId !== undefined) updateData.supplierId = data.supplierId;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  await db
    .update(vitaminsMedicines)
    .set(updateData)
    .where(and(
      eq(vitaminsMedicines.id, id),
      eq(vitaminsMedicines.tenantId, tenantId),
    ));

  return getPharmaceutical(id, tenantId);
}

/**
 * Toggle pharmaceutical active status.
 */
export async function togglePharmaceutical(id: number, tenantId: number, userId: string) {
  const item = await getPharmaceutical(id, tenantId);
  const newStatus = item.isActive === 1 ? 0 : 1;

  await db
    .update(vitaminsMedicines)
    .set({ isActive: newStatus })
    .where(and(
      eq(vitaminsMedicines.id, id),
      eq(vitaminsMedicines.tenantId, tenantId),
    ));

  return getPharmaceutical(id, tenantId);
}

/**
 * Soft delete pharmaceutical item (check for references first).
 */
export async function deletePharmaceutical(id: number, tenantId: number, userId: string) {
  await getPharmaceutical(id, tenantId);

  const stockRef = await db
    .select()
    .from(pharmaceuticalStock)
    .where(eq(pharmaceuticalStock.itemId, id))
    .limit(1);

  if (stockRef.length > 0) {
    throw new PharmaceuticalInUseError(id, "stock");
  }

  const batchRef = await db
    .select()
    .from(pharmaceuticalBatches)
    .where(eq(pharmaceuticalBatches.itemId, id))
    .limit(1);

  if (batchRef.length > 0) {
    throw new PharmaceuticalInUseError(id, "batches");
  }

  await db
    .update(vitaminsMedicines)
    .set({ deletedAt: new Date(), isActive: 0 })
    .where(and(
      eq(vitaminsMedicines.id, id),
      eq(vitaminsMedicines.tenantId, tenantId),
    ));
}

/**
 * List pharmaceutical stock per plasma.
 */
export async function listPharmaceuticalStock(
  tenantId: number,
  filters?: { plasmaId?: number; itemId?: number; category?: string },
) {
  let query = db
    .select()
    .from(pharmaceuticalStock)
    .innerJoin(vitaminsMedicines, eq(pharmaceuticalStock.itemId, vitaminsMedicines.id));

  const conditions = [eq(vitaminsMedicines.tenantId, tenantId)];
  if (filters?.plasmaId) {
    conditions.push(eq(pharmaceuticalStock.plasmaId, filters.plasmaId));
  }
  if (filters?.itemId) {
    conditions.push(eq(pharmaceuticalStock.itemId, filters.itemId));
  }
  if (filters?.category) {
    conditions.push(eq(vitaminsMedicines.category, filters.category));
  }

  return db.select().from(pharmaceuticalStock).innerJoin(vitaminsMedicines, eq(pharmaceuticalStock.itemId, vitaminsMedicines.id)).where(and(...conditions));
}

/**
 * List pharmaceutical batches by item.
 */
export async function listPharmaceuticalBatches(itemId: number) {
  const result = await db
    .select()
    .from(pharmaceuticalBatches)
    .where(and(
      eq(pharmaceuticalBatches.itemId, itemId),
      sql`${pharmaceuticalBatches.remainingQty} > 0`,
    ))
    .orderBy(pharmaceuticalBatches.expiryDate);

  return result;
}

/**
 * Create pharmaceutical batch.
 */
export async function createPharmaceuticalBatch(data: {
  itemId: number;
  batchNumber: string;
  expiryDate: string;
  receivedQty: string;
}, tenantId: number, userId: string) {
  const item = await getPharmaceutical(data.itemId, tenantId);

  const existing = await db
    .select()
    .from(pharmaceuticalBatches)
    .where(and(
      eq(pharmaceuticalBatches.itemId, data.itemId),
      eq(pharmaceuticalBatches.batchNumber, data.batchNumber),
    ));

  if (existing.length > 0) {
    throw new Error("Batch number already exists for this item");
  }

  const result = await db
    .insert(pharmaceuticalBatches)
    .values({
      tenantId,
      itemId: data.itemId,
      batchNumber: data.batchNumber,
      expiryDate: data.expiryDate,
      receivedQty: data.receivedQty,
      remainingQty: data.receivedQty,
    });

  return result;
}

/**
 * Update pharmaceutical batch.
 */
export async function updatePharmaceuticalBatch(
  id: number,
  data: {
    batchNumber?: string;
    expiryDate?: string;
    remainingQty?: string;
  },
  tenantId: number,
  userId: string,
) {
  const existing = await db
    .select()
    .from(pharmaceuticalBatches)
    .where(and(
      eq(pharmaceuticalBatches.id, id),
      eq(pharmaceuticalBatches.tenantId, tenantId),
    ))
    .limit(1);

  if (existing.length === 0) {
    throw new BatchNotFoundError(id);
  }

  if (existing[0].remainingQty !== existing[0].receivedQty) {
    throw new Error("Can only update unused batches");
  }

  const updateData: Record<string, unknown> = {};
  if (data.batchNumber !== undefined) updateData.batchNumber = data.batchNumber;
  if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate;
  if (data.remainingQty !== undefined) updateData.remainingQty = data.remainingQty;

  await db
    .update(pharmaceuticalBatches)
    .set(updateData)
    .where(eq(pharmaceuticalBatches.id, id));

  return existing[0];
}

/**
 * Delete pharmaceutical batch.
 */
export async function deletePharmaceuticalBatch(id: number, tenantId: number, userId: string) {
  const existing = await db
    .select()
    .from(pharmaceuticalBatches)
    .where(and(
      eq(pharmaceuticalBatches.id, id),
      eq(pharmaceuticalBatches.tenantId, tenantId),
    ))
    .limit(1);

  if (existing.length === 0) {
    throw new BatchNotFoundError(id);
  }

  if (existing[0].remainingQty !== existing[0].receivedQty) {
    throw new Error("Can only delete unused batches");
  }

  await db
    .delete(pharmaceuticalBatches)
    .where(eq(pharmaceuticalBatches.id, id));
}

/**
 * Record pharmaceutical usage (FIFO consumption).
 */
export async function recordPharmaceuticalUsage(data: {
  plasmaId: number;
  itemId: number;
  batchQuantities: { batchId: number; quantity: string }[];
  date: string;
  note?: string;
}, tenantId: number, userId: string) {
  const item = await getPharmaceutical(data.itemId, tenantId);

  let totalQuantity = 0;
  for (const bq of data.batchQuantities) {
    totalQuantity += Number(bq.quantity);
  }

  const stockResult = await db
    .select()
    .from(pharmaceuticalStock)
    .where(and(
      eq(pharmaceuticalStock.plasmaId, data.plasmaId),
      eq(pharmaceuticalStock.itemId, data.itemId),
    ))
    .limit(1);

  let currentStock = 0;
  if (stockResult.length > 0) {
    currentStock = Number(stockResult[0].closingStock);
  }

  if (currentStock < totalQuantity) {
    throw new InsufficientStockError(data.itemId, currentStock, totalQuantity);
  }

  for (const bq of data.batchQuantities) {
    const batch = await db
      .select()
      .from(pharmaceuticalBatches)
      .where(eq(pharmaceuticalBatches.id, bq.batchId))
      .limit(1);

    if (batch.length === 0) {
      throw new BatchNotFoundError(bq.batchId);
    }

    const newRemaining = Number(batch[0].remainingQty) - Number(bq.quantity);
    await db
      .update(pharmaceuticalBatches)
      .set({ remainingQty: String(newRemaining) })
      .where(eq(pharmaceuticalBatches.id, bq.batchId));
  }

  if (stockResult.length > 0) {
    const newTotalOut = Number(stockResult[0].totalOut) + totalQuantity;
    const newClosing = Number(stockResult[0].closingStock) - totalQuantity;
    await db
      .update(pharmaceuticalStock)
      .set({
        totalOut: String(newTotalOut),
        closingStock: String(newClosing),
        lastUpdatedAt: new Date(),
      })
      .where(eq(pharmaceuticalStock.id, stockResult[0].id));
  }

  return { success: true, consumption: { totalQty: String(totalQuantity), closingStock: String(currentStock - totalQuantity) } };
}