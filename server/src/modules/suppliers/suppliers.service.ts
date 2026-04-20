import { db } from "../../config/database";
import { suppliers, type NewSupplier, type Supplier } from "../../db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { SupplierNotFoundError, SupplierCodeExistsError } from "./errors";
import { feedSuratJalan } from "../../db/schema/feed_surat_jalan";

/**
 * List suppliers with optional filters.
 */
export async function listSuppliers(
  tenantId: number,
  filters?: { category?: string; isActive?: boolean },
) {
  const conditions = [
    eq(suppliers.tenantId, tenantId),
    isNull(suppliers.deletedAt),
  ];

  if (filters?.category) {
    conditions.push(eq(suppliers.category, filters.category));
  }

  if (filters?.isActive !== undefined) {
    conditions.push(eq(suppliers.isActive, filters.isActive ? 1 : 0));
  }

  const result = await db
    .select()
    .from(suppliers)
    .where(and(...conditions))
    .orderBy(suppliers.name);

  return result;
}

/**
 * Get a single supplier by ID.
 */
export async function getSupplier(id: number, tenantId: number) {
  const result = await db
    .select()
    .from(suppliers)
    .where(
      and(
        eq(suppliers.id, id),
        eq(suppliers.tenantId, tenantId),
        isNull(suppliers.deletedAt),
      ),
    );

  if (result.length === 0) {
    throw new SupplierNotFoundError(id);
  }

  return result[0];
}

/**
 * Create a new supplier.
 */
export async function createSupplier(
  data: Omit<
    NewSupplier,
    "tenantId" | "isActive" | "deletedAt" | "createdAt" | "updatedAt"
  >,
  tenantId: number,
  userId: string,
) {
  // Check for duplicate code
  const existing = await db
    .select()
    .from(suppliers)
    .where(
      and(
        eq(suppliers.tenantId, tenantId),
        eq(suppliers.code, data.code),
        isNull(suppliers.deletedAt),
      ),
    );

  if (existing.length > 0) {
    throw new SupplierCodeExistsError(data.code);
  }

  await db.insert(suppliers).values({
    ...data,
    tenantId,
    isActive: 1,
  });

  // Fetch the created supplier
  const created = await db
    .select()
    .from(suppliers)
    .where(
      and(eq(suppliers.tenantId, tenantId), eq(suppliers.code, data.code)),
    );

  return created[0];
}

/**
 * Update an existing supplier.
 */
export async function updateSupplier(
  id: number,
  data: Partial<Supplier>,
  tenantId: number,
) {
  // Check supplier exists
  await getSupplier(id, tenantId);

  // Check for duplicate code if being changed
  if (data.code) {
    const existing = await db
      .select()
      .from(suppliers)
      .where(
        and(
          eq(suppliers.tenantId, tenantId),
          eq(suppliers.code, data.code),
          isNull(suppliers.deletedAt),
        ),
      );

    if (existing.length > 0 && existing[0].id !== id) {
      throw new SupplierCodeExistsError(data.code);
    }
  }

  await db
    .update(suppliers)
    .set({
      ...data,
      updatedAt: sql`NOW()`,
    })
    .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)));

  return getSupplier(id, tenantId);
}

/**
 * Toggle supplier active status.
 */
export async function toggleSupplier(id: number, tenantId: number) {
  const supplier = await getSupplier(id, tenantId);

  const newStatus = supplier.isActive === 1 ? 0 : 1;

  await db
    .update(suppliers)
    .set({
      isActive: newStatus,
      updatedAt: sql`NOW()`,
    })
    .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)));

  return getSupplier(id, tenantId);
}

/**
 * Soft delete a supplier.
 * Checks if supplier is linked to any Surat Jalan before deleting.
 */
export async function deleteSupplier(id: number, tenantId: number) {
  const supplier = await getSupplier(id, tenantId);

  // Check if supplier is linked to any Surat Jalan
  const linked = await db
    .select()
    .from(feedSuratJalan)
    .where(and(eq(feedSuratJalan.supplierId, id)));

  if (linked.length > 0) {
    // Soft delete - just mark as inactive instead of deleting
    await db
      .update(suppliers)
      .set({
        isActive: 0,
        deletedAt: sql`NOW()`,
      })
      .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)));

    return {
      success: true,
      message: "Supplier marked as inactive (linked to Surat Jalan)",
    };
  }

  // Hard delete since no links
  await db
    .update(suppliers)
    .set({
      deletedAt: sql`NOW()`,
    })
    .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)));

  return { success: true };
}
