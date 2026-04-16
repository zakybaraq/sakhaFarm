import { db } from '../../config/database'
import { units, plasmas, auditLogs } from '../../db/schema'
import { eq, and, isNull, desc, ne, count } from 'drizzle-orm'
import {
  UnitNotFoundError,
  UnitHasActivePlasmasError,
  DuplicateUnitCodeError,
} from './unit.errors'

/**
 * Creates a new unit with tenant scoping and audit logging.
 *
 * @param input - Unit creation data (name, code, optional location)
 * @param tenantId - Current tenant ID from middleware
 * @param userId - User ID from session for audit trail
 * @returns The created unit record
 * @throws DuplicateUnitCodeError if code already exists for this tenant
 */
export async function createUnit(
  input: { name: string; code: string; location?: string },
  tenantId: number,
  userId: string,
) {
  const existing = await db
    .select()
    .from(units)
    .where(
      and(
        eq(units.code, input.code),
        eq(units.tenantId, tenantId),
        isNull(units.deletedAt),
      ),
    )

  if (existing.length > 0) {
    throw new DuplicateUnitCodeError(input.code)
  }

  const result = await db.insert(units).values({
    ...input,
    tenantId,
  })

  const newId = result[0].insertId

  try {
    await db.insert(auditLogs).values({
      userId,
      action: 'create',
      resource: 'unit',
      resourceId: String(newId),
      newValue: JSON.stringify(input),
    })
  } catch {
    // Fire-and-forget audit logging
  }

  return { ...input, id: newId, tenantId }
}

/**
 * Lists all non-deleted units for a given tenant.
 *
 * @param tenantId - Current tenant ID from middleware
 * @returns Array of units ordered by creation date descending
 */
export async function listUnits(tenantId: number) {
  return db
    .select()
    .from(units)
    .where(and(eq(units.tenantId, tenantId), isNull(units.deletedAt)))
    .orderBy(desc(units.createdAt))
}

/**
 * Retrieves a single unit by ID with tenant scoping.
 *
 * @param id - Unit ID to retrieve
 * @param tenantId - Current tenant ID from middleware
 * @returns The unit record
 * @throws UnitNotFoundError if unit doesn't exist or is soft-deleted
 */
export async function getUnit(id: number, tenantId: number) {
  const result = await db
    .select()
    .from(units)
    .where(and(eq(units.id, id), eq(units.tenantId, tenantId), isNull(units.deletedAt)))
    .limit(1)

  if (result.length === 0) {
    throw new UnitNotFoundError(id)
  }

  return result[0]
}

/**
 * Updates a unit's name, code, or location with tenant scoping.
 *
 * @param id - Unit ID to update
 * @param input - Fields to update (name, code, location)
 * @param tenantId - Current tenant ID from middleware
 * @param userId - User ID from session for audit trail
 * @returns Success indicator
 * @throws UnitNotFoundError if unit doesn't exist
 * @throws DuplicateUnitCodeError if new code conflicts with existing unit
 */
export async function updateUnit(
  id: number,
  input: { name?: string; code?: string; location?: string },
  tenantId: number,
  userId: string,
) {
  const existing = await db
    .select()
    .from(units)
    .where(and(eq(units.id, id), eq(units.tenantId, tenantId), isNull(units.deletedAt)))
    .limit(1)

  if (existing.length === 0) {
    throw new UnitNotFoundError(id)
  }

  if (input.code) {
    const duplicate = await db
      .select()
      .from(units)
      .where(
        and(
          eq(units.code, input.code),
          ne(units.id, id),
          eq(units.tenantId, tenantId),
          isNull(units.deletedAt),
        ),
      )

    if (duplicate.length > 0) {
      throw new DuplicateUnitCodeError(input.code)
    }
  }

  await db.update(units).set(input).where(and(eq(units.id, id), eq(units.tenantId, tenantId)))

  try {
    await db.insert(auditLogs).values({
      userId,
      action: 'update',
      resource: 'unit',
      resourceId: String(id),
      oldValue: JSON.stringify(existing[0]),
      newValue: JSON.stringify(input),
    })
  } catch {
    // Fire-and-forget audit logging
  }

  return { success: true }
}

/**
 * Soft-deletes a unit by setting deletedAt timestamp.
 *
 * @param id - Unit ID to soft-delete
 * @param tenantId - Current tenant ID from middleware
 * @param userId - User ID from session for audit trail
 * @returns Success indicator
 * @throws UnitNotFoundError if unit doesn't exist
 * @throws UnitHasActivePlasmasError if unit has active plasmas
 */
export async function softDeleteUnit(id: number, tenantId: number, userId: string) {
  const existing = await db
    .select()
    .from(units)
    .where(and(eq(units.id, id), eq(units.tenantId, tenantId), isNull(units.deletedAt)))
    .limit(1)

  if (existing.length === 0) {
    throw new UnitNotFoundError(id)
  }

  const plasmaCheck = await db
    .select({ count: count() })
    .from(plasmas)
    .where(and(eq(plasmas.unitId, id), isNull(plasmas.deletedAt)))

  if (plasmaCheck[0].count > 0) {
    throw new UnitHasActivePlasmasError(id, plasmaCheck[0].count)
  }

  await db
    .update(units)
    .set({ deletedAt: new Date() })
    .where(and(eq(units.id, id), eq(units.tenantId, tenantId)))

  try {
    await db.insert(auditLogs).values({
      userId,
      action: 'delete',
      resource: 'unit',
      resourceId: String(id),
    })
  } catch {
    // Fire-and-forget audit logging
  }

  return { success: true }
}
