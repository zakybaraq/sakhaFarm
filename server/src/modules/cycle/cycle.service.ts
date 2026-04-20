import { db } from "../../config/database";
import {
  cycles,
  plasmas,
  units,
  auditLogs,
  dailyRecordings,
} from "../../db/schema";
import { eq, and, isNull, desc, count, max } from "drizzle-orm";
import {
  CycleNotFoundError,
  CycleCapacityExceededError,
  InvalidCycleStatusTransitionError,
  CycleNotInTenantPlasmaError,
  CycleHasRecordingsError,
  InvalidDocTypeError,
} from "./cycle.errors";

const VALID_DOC_TYPES = [
  "CP",
  "Cobb",
  "Ross",
  "Patriot",
  "Ayam Unggul",
  "MBU",
] as const;

/**
 * Creates a new cycle (Chick-In) with auto-numbering, capacity validation, and DOC type check.
 *
 * @param input - Cycle creation data (plasmaId, docType, chickInDate, initialPopulation)
 * @param tenantId - Current tenant ID from middleware
 * @param userId - User ID from session for audit trail
 * @returns The created cycle record with auto-assigned cycleNumber
 * @throws Error if DOC type is invalid
 * @throws CycleNotInTenantPlasmaError if plasma not in tenant
 * @throws CycleCapacityExceededError if initialPopulation exceeds plasma capacity
 */
export async function createCycle(
  input: {
    plasmaId: number;
    docType: string;
    chickInDate: string;
    initialPopulation: number;
  },
  tenantId: number,
  userId: string,
) {
  if (
    !VALID_DOC_TYPES.includes(input.docType as (typeof VALID_DOC_TYPES)[number])
  ) {
    throw new InvalidDocTypeError(input.docType, [...VALID_DOC_TYPES]);
  }

  return db.transaction(async (tx) => {
    const plasma = await tx
      .select()
      .from(plasmas)
      .leftJoin(units, eq(plasmas.unitId, units.id))
      .where(
        and(
          eq(plasmas.id, input.plasmaId),
          eq(units.tenantId, tenantId),
          isNull(plasmas.deletedAt),
        ),
      )
      .limit(1);

    if (plasma.length === 0) {
      throw new CycleNotInTenantPlasmaError(input.plasmaId);
    }

    const plasmaCapacity = plasma[0].plasmas.capacity ?? 0;
    if (input.initialPopulation > plasmaCapacity) {
      throw new CycleCapacityExceededError(
        input.initialPopulation,
        plasmaCapacity,
      );
    }

    const cycleNumberResult = await tx
      .select({ max: max(cycles.cycleNumber) })
      .from(cycles)
      .where(eq(cycles.plasmaId, input.plasmaId));

    const cycleNumber = (cycleNumberResult[0]?.max ?? 0) + 1;

    const result = await tx.insert(cycles).values({
      plasmaId: input.plasmaId,
      cycleNumber,
      docType: input.docType,
      chickInDate: new Date(input.chickInDate),
      initialPopulation: input.initialPopulation,
      status: "active",
      totalFeedKg: "0",
    });

    const newId = result[0].insertId;

    try {
      await tx.insert(auditLogs).values({
        userId,
        action: "create",
        resource: "cycle",
        resourceId: String(newId),
        newValue: JSON.stringify({ ...input, cycleNumber, status: "active" }),
      });
    } catch {
      // Fire-and-forget audit logging
    }

    return {
      id: newId,
      plasmaId: input.plasmaId,
      cycleNumber,
      docType: input.docType,
      chickInDate: input.chickInDate,
      initialPopulation: input.initialPopulation,
      status: "active",
      totalFeedKg: "0",
    };
  });
}

/**
 * Lists all non-deleted cycles for a tenant, optionally filtered by plasma or status.
 *
 * @param tenantId - Current tenant ID from middleware
 * @param plasmaId - Optional plasma ID filter
 * @param status - Optional status filter (active, completed, failed)
 * @returns Array of cycles with plasma and unit names, ordered by chickInDate descending
 */
export async function listCycles(
  tenantId: number,
  plasmaId?: number,
  status?: string,
) {
  const conditions = [eq(units.tenantId, tenantId), isNull(cycles.deletedAt)];
  if (plasmaId !== undefined) conditions.push(eq(cycles.plasmaId, plasmaId));
  if (status !== undefined) conditions.push(eq(cycles.status, status));

  return db
    .select({
      id: cycles.id,
      plasmaId: cycles.plasmaId,
      cycleNumber: cycles.cycleNumber,
      docType: cycles.docType,
      chickInDate: cycles.chickInDate,
      initialPopulation: cycles.initialPopulation,
      status: cycles.status,
      harvestDate: cycles.harvestDate,
      finalPopulation: cycles.finalPopulation,
      totalFeedKg: cycles.totalFeedKg,
      createdAt: cycles.createdAt,
      updatedAt: cycles.updatedAt,
      plasmaName: plasmas.name,
      unitName: units.name,
    })
    .from(cycles)
    .leftJoin(plasmas, eq(cycles.plasmaId, plasmas.id))
    .leftJoin(units, eq(plasmas.unitId, units.id))
    .where(and(...conditions))
    .orderBy(desc(cycles.chickInDate));
}

/**
 * Retrieves a single cycle by ID with tenant scoping.
 *
 * @param id - Cycle ID to retrieve
 * @param tenantId - Current tenant ID from middleware
 * @returns The cycle record with plasma and unit names
 * @throws CycleNotFoundError if cycle doesn't exist or is soft-deleted
 */
export async function getCycle(id: number, tenantId: number) {
  const result = await db
    .select({
      id: cycles.id,
      plasmaId: cycles.plasmaId,
      cycleNumber: cycles.cycleNumber,
      docType: cycles.docType,
      chickInDate: cycles.chickInDate,
      initialPopulation: cycles.initialPopulation,
      status: cycles.status,
      harvestDate: cycles.harvestDate,
      finalPopulation: cycles.finalPopulation,
      totalFeedKg: cycles.totalFeedKg,
      createdAt: cycles.createdAt,
      updatedAt: cycles.updatedAt,
      plasmaName: plasmas.name,
      unitName: units.name,
      capacity: plasmas.capacity,
    })
    .from(cycles)
    .leftJoin(plasmas, eq(cycles.plasmaId, plasmas.id))
    .leftJoin(units, eq(plasmas.unitId, units.id))
    .where(
      and(
        eq(cycles.id, id),
        eq(units.tenantId, tenantId),
        isNull(cycles.deletedAt),
      ),
    )
    .limit(1);

  if (result.length === 0) {
    throw new CycleNotFoundError(id);
  }

  return result[0];
}

/**
 * Updates an active cycle's DOC type, chick-in date, or initial population.
 *
 * @param id - Cycle ID to update
 * @param input - Fields to update (docType, chickInDate, initialPopulation)
 * @param tenantId - Current tenant ID from middleware
 * @param userId - User ID from session for audit trail
 * @returns Success indicator
 * @throws CycleNotFoundError if cycle doesn't exist
 * @throws InvalidCycleStatusTransitionError if cycle is not active
 * @throws CycleCapacityExceededError if new population exceeds capacity
 */
export async function updateCycle(
  id: number,
  input: {
    docType?: string;
    chickInDate?: string;
    initialPopulation?: number;
    status?: string;
  },
  tenantId: number,
  userId: string,
) {
  const existing = await getCycle(id, tenantId);

  if (existing.status !== "active") {
    throw new InvalidCycleStatusTransitionError(existing.status, "update");
  }

  if (
    input.docType &&
    !VALID_DOC_TYPES.includes(input.docType as (typeof VALID_DOC_TYPES)[number])
  ) {
    throw new InvalidDocTypeError(input.docType, [...VALID_DOC_TYPES]);
  }

  if (input.initialPopulation !== undefined && existing.capacity != null) {
    if (input.initialPopulation > existing.capacity) {
      throw new CycleCapacityExceededError(
        input.initialPopulation,
        existing.capacity,
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (input.docType !== undefined) updateData.docType = input.docType;
  if (input.chickInDate !== undefined)
    updateData.chickInDate = new Date(input.chickInDate);
  if (input.initialPopulation !== undefined)
    updateData.initialPopulation = input.initialPopulation;
  if (input.status !== undefined)
    updateData.status = input.status.toLowerCase();

  await db.update(cycles).set(updateData).where(eq(cycles.id, id));

  try {
    await db.insert(auditLogs).values({
      userId,
      action: "update",
      resource: "cycle",
      resourceId: String(id),
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(input),
    });
  } catch {
    // Fire-and-forget audit logging
  }

  return { success: true };
}

/**
 * Soft-deletes a cycle by setting deletedAt timestamp.
 * Blocked if daily recordings exist for this cycle.
 *
 * @param id - Cycle ID to soft-delete
 * @param tenantId - Current tenant ID from middleware
 * @param userId - User ID from session for audit trail
 * @returns Success indicator
 * @throws CycleNotFoundError if cycle doesn't exist
 * @throws CycleHasRecordingsError if daily recordings exist
 */
export async function softDeleteCycle(
  id: number,
  tenantId: number,
  userId: string,
) {
  await getCycle(id, tenantId);

  const recordingCheck = await db
    .select({ count: count() })
    .from(dailyRecordings)
    .where(eq(dailyRecordings.cycleId, id));

  if (recordingCheck[0].count > 0) {
    throw new CycleHasRecordingsError(id, recordingCheck[0].count);
  }

  await db
    .update(cycles)
    .set({ deletedAt: new Date() })
    .where(eq(cycles.id, id));

  try {
    await db.insert(auditLogs).values({
      userId,
      action: "delete",
      resource: "cycle",
      resourceId: String(id),
    });
  } catch {
    // Fire-and-forget audit logging
  }

  return { success: true };
}

/**
 * Transitions an active cycle to completed status.
 *
 * @param id - Cycle ID to complete
 * @param input - Completion data (harvestDate, finalPopulation)
 * @param tenantId - Current tenant ID from middleware
 * @param userId - User ID from session for audit trail
 * @returns Success indicator
 * @throws CycleNotFoundError if cycle doesn't exist
 * @throws InvalidCycleStatusTransitionError if cycle is not active
 */
export async function completeCycle(
  id: number,
  input: { harvestDate: string; finalPopulation: number },
  tenantId: number,
  userId: string,
) {
  const existing = await getCycle(id, tenantId);

  if (existing.status !== "active") {
    throw new InvalidCycleStatusTransitionError(existing.status, "completed");
  }

  await db
    .update(cycles)
    .set({
      status: "completed",
      harvestDate: new Date(input.harvestDate),
      finalPopulation: input.finalPopulation,
    })
    .where(eq(cycles.id, id));

  try {
    await db.insert(auditLogs).values({
      userId,
      action: "complete",
      resource: "cycle",
      resourceId: String(id),
      newValue: JSON.stringify({
        status: "completed",
        harvestDate: input.harvestDate,
        finalPopulation: input.finalPopulation,
      }),
    });
  } catch {
    // Fire-and-forget audit logging
  }

  return { success: true };
}

/**
 * Transitions an active cycle to failed status.
 *
 * @param id - Cycle ID to fail
 * @param input - Failure data (harvestDate, optional notes)
 * @param tenantId - Current tenant ID from middleware
 * @param userId - User ID from session for audit trail
 * @returns Success indicator
 * @throws CycleNotFoundError if cycle doesn't exist
 * @throws InvalidCycleStatusTransitionError if cycle is not active
 */
export async function failCycle(
  id: number,
  input: { harvestDate: string; notes?: string },
  tenantId: number,
  userId: string,
) {
  const existing = await getCycle(id, tenantId);

  if (existing.status !== "active") {
    throw new InvalidCycleStatusTransitionError(existing.status, "failed");
  }

  await db
    .update(cycles)
    .set({
      status: "failed",
      harvestDate: new Date(input.harvestDate),
      notes: input.notes ?? null,
    })
    .where(eq(cycles.id, id));

  try {
    await db.insert(auditLogs).values({
      userId,
      action: "fail",
      resource: "cycle",
      resourceId: String(id),
      newValue: JSON.stringify({
        status: "failed",
        harvestDate: input.harvestDate,
        notes: input.notes ?? null,
      }),
    });
  } catch {
    // Fire-and-forget audit logging
  }

  return { success: true };
}
