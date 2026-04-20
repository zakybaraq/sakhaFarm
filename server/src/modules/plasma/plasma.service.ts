import { eq, and, isNull, desc, count } from 'drizzle-orm'
import { db } from '../../config/database'
import { plasmas } from '../../db/schema/plasmas'
import { units } from '../../db/schema/units'
import { cycles } from '../../db/schema/cycles'
import { auditLogs } from '../../db/schema/audit_logs'
import {
  PlasmaNotFoundError,
  PlasmaHasActiveCyclesError,
  PlasmaNotInTenantUnitError,
} from './plasma.errors'

/**
 * Creates a new plasma assigned to a unit within the current tenant.
 *
 * Verifies that the target unit belongs to the tenant before inserting,
 * preventing cross-tenant plasma assignment. Writes an audit log entry
 * on a fire-and-forget basis.
 *
 * @param input - Plasma creation data (unitId, name, optional fields)
 * @param tenantId - The current tenant ID for ownership verification
 * @param userId - The user performing the action (for audit logging)
 * @returns The created plasma record
 * @throws {PlasmaNotInTenantUnitError} When the unit does not belong to the tenant
 */
export async function createPlasma(
  input: {
    unitId: number
    name: string
    farmerName?: string
    address?: string
    phone?: string
    capacity?: number
  },
  tenantId: number,
  userId: string,
) {
  const unitCheck = await db
    .select({ id: units.id })
    .from(units)
    .where(
      and(
        eq(units.id, input.unitId),
        eq(units.tenantId, tenantId),
        isNull(units.deletedAt),
      ),
    )
    .limit(1)

  if (unitCheck.length === 0) {
    throw new PlasmaNotInTenantUnitError(input.unitId)
  }

  const result = await db.insert(plasmas).values(input)
  const newId = result[0].insertId as number

  try {
    await db.insert(auditLogs).values({
      userId,
      action: 'create',
      resource: 'plasma',
      resourceId: String(newId),
      newValue: JSON.stringify(input),
    })
  } catch {
    /* fire-and-forget audit per D-02 */
  }

  const created = await db
    .select()
    .from(plasmas)
    .where(eq(plasmas.id, newId))
    .limit(1)

  return created[0]
}

/**
 * Lists all non-deleted plasmas scoped to the current tenant,
 * optionally filtered by a specific unit.
 *
 * Joins with the units table to enforce tenant isolation and
 * includes the unit name in the result.
 *
 * @param tenantId - The current tenant ID for scoping
 * @param unitId - Optional unit ID filter
 * @returns Array of plasma records with unit name
 */
export async function listPlasmas(tenantId: number, unitId?: number) {
  const baseWhere = and(
    eq(units.tenantId, tenantId),
    isNull(plasmas.deletedAt),
    unitId ? eq(plasmas.unitId, unitId) : undefined,
  )

  return db
    .select({
      id: plasmas.id,
      unitId: plasmas.unitId,
      name: plasmas.name,
      farmerName: plasmas.farmerName,
      address: plasmas.address,
      phone: plasmas.phone,
      capacity: plasmas.capacity,
      isActive: plasmas.isActive,
      createdAt: plasmas.createdAt,
      updatedAt: plasmas.updatedAt,
      deletedAt: plasmas.deletedAt,
      unitName: units.name,
    })
    .from(plasmas)
    .leftJoin(units, eq(plasmas.unitId, units.id))
    .where(baseWhere)
    .orderBy(desc(plasmas.createdAt))
}

/**
 * Retrieves a single plasma by ID, scoped to the current tenant.
 *
 * Excludes soft-deleted plasmas and joins with the units table
 * for tenant isolation verification.
 *
 * @param id - The plasma ID to retrieve
 * @param tenantId - The current tenant ID for scoping
 * @returns The plasma record with unit name
 * @throws {PlasmaNotFoundError} When the plasma does not exist or is soft-deleted
 */
export async function getPlasma(id: number, tenantId: number) {
  const result = await db
    .select({
      id: plasmas.id,
      unitId: plasmas.unitId,
      name: plasmas.name,
      farmerName: plasmas.farmerName,
      address: plasmas.address,
      phone: plasmas.phone,
      capacity: plasmas.capacity,
      isActive: plasmas.isActive,
      createdAt: plasmas.createdAt,
      updatedAt: plasmas.updatedAt,
      deletedAt: plasmas.deletedAt,
      unitName: units.name,
    })
    .from(plasmas)
    .leftJoin(units, eq(plasmas.unitId, units.id))
    .where(
      and(
        eq(plasmas.id, id),
        eq(units.tenantId, tenantId),
        isNull(plasmas.deletedAt),
      ),
    )
    .limit(1)

  if (result.length === 0) {
    throw new PlasmaNotFoundError(id)
  }

  return result[0]
}

/**
 * Updates mutable fields of an existing plasma.
 *
 * Only allows updating name, farmerName, address, phone, capacity, and isActive (mapped from boolean to int 0/1).
 * Verifies the plasma exists and belongs to the current tenant before
 * applying changes. Writes an audit log with old and new values.
 *
 * @param id - The plasma ID to update
 * @param input - Fields to update (all optional)
 * @param tenantId - The current tenant ID for scoping
 * @param userId - The user performing the action (for audit logging)
 * @returns `{ success: true }` on successful update
 * @throws {PlasmaNotFoundError} When the plasma does not exist or is soft-deleted
 */
export async function updatePlasma(
  id: number,
  input: {
    name?: string
    farmerName?: string
    address?: string
    phone?: string
    capacity?: number
    isActive?: boolean
  },
  tenantId: number,
  userId: string,
) {
  const existing = await getPlasma(id, tenantId)

  const updateData: Partial<typeof plasmas.$inferInsert> = {}
  if (input.name !== undefined) updateData.name = input.name
  if (input.farmerName !== undefined) updateData.farmerName = input.farmerName
  if (input.address !== undefined) updateData.address = input.address
  if (input.phone !== undefined) updateData.phone = input.phone
  if (input.capacity !== undefined) updateData.capacity = input.capacity
  if (input.isActive !== undefined) updateData.isActive = input.isActive ? 1 : 0

  await db
    .update(plasmas)
    .set(updateData)
    .where(and(eq(plasmas.id, id), eq(plasmas.unitId, existing.unitId)))

  try {
    await db.insert(auditLogs).values({
      userId,
      action: 'update',
      resource: 'plasma',
      resourceId: String(id),
      oldValue: JSON.stringify({
        name: existing.name,
        farmerName: existing.farmerName,
        address: existing.address,
        phone: existing.phone,
        capacity: existing.capacity,
      }),
      newValue: JSON.stringify(input),
    })
  } catch {
    /* fire-and-forget audit per D-02 */
  }

  return { success: true }
}

/**
 * Soft-deletes a plasma by setting its deletedAt timestamp.
 *
 * Blocks deletion if the plasma has any active cycles.
 * Writes an audit log entry on a fire-and-forget basis.
 *
 * @param id - The plasma ID to soft-delete
 * @param tenantId - The current tenant ID for scoping
 * @param userId - The user performing the action (for audit logging)
 * @returns `{ success: true }` on successful soft-delete
 * @throws {PlasmaNotFoundError} When the plasma does not exist or is already soft-deleted
 * @throws {PlasmaHasActiveCyclesError} When the plasma has active cycles
 */
export async function softDeletePlasma(id: number, tenantId: number, userId: string) {
  await getPlasma(id, tenantId)

  const activeCycles = await db
    .select({ count: count() })
    .from(cycles)
    .where(and(eq(cycles.plasmaId, id), eq(cycles.status, 'active'), isNull(cycles.deletedAt)))

  if (activeCycles[0].count > 0) {
    throw new PlasmaHasActiveCyclesError(id, activeCycles[0].count as number)
  }

  await db
    .update(plasmas)
    .set({ deletedAt: new Date() })
    .where(eq(plasmas.id, id))

  try {
    await db.insert(auditLogs).values({
      userId,
      action: 'delete',
      resource: 'plasma',
      resourceId: String(id),
    })
  } catch {
    /* fire-and-forget audit per D-02 */
  }

  return { success: true }
}
