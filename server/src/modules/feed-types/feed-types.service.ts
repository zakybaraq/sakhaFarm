import { db } from '../../config/database'
import { feedTypes, feedProducts, auditLogs } from '../../db/schema'
import { eq, and, isNull, desc, ne, count } from 'drizzle-orm'
import {
  FeedTypeNotFoundError,
  DuplicateFeedTypeCodeError,
  FeedTypeInUseError,
} from './feed-types.errors'

/**
 * Creates a new feed type with tenant scoping and audit logging.
 *
 * @param input - Feed type creation data (name, code)
 * @param tenantId - Current tenant ID from middleware
 * @param userId - User ID from session for audit trail
 * @returns The created feed type record
 * @throws DuplicateFeedTypeCodeError if code already exists for this tenant
 */
export async function createFeedType(
  input: { name: string; code: string },
  tenantId: number,
  userId: string,
) {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(feedTypes)
      .where(
        and(
          eq(feedTypes.code, input.code),
          eq(feedTypes.tenantId, tenantId),
          isNull(feedTypes.deletedAt),
        ),
      )

    if (existing.length > 0) {
      throw new DuplicateFeedTypeCodeError(input.code)
    }

    const result = await tx.insert(feedTypes).values({
      name: input.name,
      code: input.code,
      tenantId,
    })

    const newId = result[0].insertId

    try {
      await tx.insert(auditLogs).values({
        userId,
        action: 'create',
        resource: 'feed_type',
        resourceId: String(newId),
        newValue: JSON.stringify(input),
      })
    } catch {
      // Fire-and-forget audit logging
    }

    const created = await tx.select().from(feedTypes).where(eq(feedTypes.id, newId)).limit(1)
    return created[0]
  })
}

/**
 * Lists all non-deleted feed types for a given tenant.
 *
 * @param tenantId - Current tenant ID from middleware
 * @returns Array of feed types ordered by creation date descending
 */
export async function listFeedTypes(tenantId: number) {
  return db
    .select()
    .from(feedTypes)
    .where(and(eq(feedTypes.tenantId, tenantId), isNull(feedTypes.deletedAt)))
    .orderBy(desc(feedTypes.createdAt))
}

/**
 * Retrieves a single feed type by ID with tenant scoping.
 *
 * @param id - Feed type ID to retrieve
 * @param tenantId - Current tenant ID from middleware
 * @returns The feed type record
 * @throws FeedTypeNotFoundError if feed type doesn't exist or is soft-deleted
 */
export async function getFeedType(id: number, tenantId: number) {
  const result = await db
    .select()
    .from(feedTypes)
    .where(and(eq(feedTypes.id, id), eq(feedTypes.tenantId, tenantId), isNull(feedTypes.deletedAt)))
    .limit(1)

  if (result.length === 0) {
    throw new FeedTypeNotFoundError(id)
  }

  return result[0]
}

/**
 * Updates a feed type's name or code with tenant scoping.
 *
 * @param id - Feed type ID to update
 * @param input - Fields to update (name, code)
 * @param tenantId - Current tenant ID from middleware
 * @param userId - User ID from session for audit trail
 * @returns Success indicator
 * @throws FeedTypeNotFoundError if feed type doesn't exist
 * @throws DuplicateFeedTypeCodeError if new code conflicts with existing feed type
 */
export async function updateFeedType(
  id: number,
  input: { name?: string; code?: string },
  tenantId: number,
  userId: string,
) {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(feedTypes)
      .where(and(eq(feedTypes.id, id), eq(feedTypes.tenantId, tenantId), isNull(feedTypes.deletedAt)))
      .limit(1)

    if (existing.length === 0) {
      throw new FeedTypeNotFoundError(id)
    }

    if (input.code) {
      const duplicate = await tx
        .select()
        .from(feedTypes)
        .where(
          and(
            eq(feedTypes.code, input.code),
            ne(feedTypes.id, id),
            eq(feedTypes.tenantId, tenantId),
            isNull(feedTypes.deletedAt),
          ),
        )

      if (duplicate.length > 0) {
        throw new DuplicateFeedTypeCodeError(input.code)
      }
    }

    const updateData: Record<string, unknown> = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.code !== undefined) updateData.code = input.code

    await tx.update(feedTypes).set(updateData).where(and(eq(feedTypes.id, id), eq(feedTypes.tenantId, tenantId)))

    try {
      await tx.insert(auditLogs).values({
        userId,
        action: 'update',
        resource: 'feed_type',
        resourceId: String(id),
        oldValue: JSON.stringify(existing[0]),
        newValue: JSON.stringify(updateData),
      })
    } catch {
      // Fire-and-forget audit logging
    }

    return { success: true }
  })
}

/**
 * Toggles a feed type's active status.
 *
 * @param id - Feed type ID to toggle
 * @param tenantId - Current tenant ID from middleware
 * @param userId - User ID from session for audit trail
 * @returns Success indicator with new active status
 * @throws FeedTypeNotFoundError if feed type doesn't exist
 */
export async function toggleFeedType(id: number, tenantId: number, userId: string) {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(feedTypes)
      .where(and(eq(feedTypes.id, id), eq(feedTypes.tenantId, tenantId), isNull(feedTypes.deletedAt)))
      .limit(1)

    if (existing.length === 0) {
      throw new FeedTypeNotFoundError(id)
    }

    const newIsActive = existing[0].isActive === 1 ? 0 : 1

    await tx
      .update(feedTypes)
      .set({ isActive: newIsActive })
      .where(and(eq(feedTypes.id, id), eq(feedTypes.tenantId, tenantId)))

    try {
      await tx.insert(auditLogs).values({
        userId,
        action: 'update',
        resource: 'feed_type',
        resourceId: String(id),
        newValue: JSON.stringify({ isActive: newIsActive }),
      })
    } catch {
      // Fire-and-forget audit logging
    }

    return { success: true, isActive: newIsActive }
  })
}

/**
 * Soft-deletes a feed type by setting deletedAt timestamp.
 *
 * @param id - Feed type ID to soft-delete
 * @param tenantId - Current tenant ID from middleware
 * @param userId - User ID from session for audit trail
 * @returns Success indicator
 * @throws FeedTypeNotFoundError if feed type doesn't exist
 * @throws FeedTypeInUseError if feed type is referenced by feed products
 */
export async function softDeleteFeedType(id: number, tenantId: number, userId: string) {
  const existing = await db
    .select()
    .from(feedTypes)
    .where(and(eq(feedTypes.id, id), eq(feedTypes.tenantId, tenantId), isNull(feedTypes.deletedAt)))
    .limit(1)

  if (existing.length === 0) {
    throw new FeedTypeNotFoundError(id)
  }

  const productCheck = await db
    .select({ count: count() })
    .from(feedProducts)
    .where(and(eq(feedProducts.typeId, id), isNull(feedProducts.deletedAt)))

  if (productCheck[0].count > 0) {
    throw new FeedTypeInUseError(id, productCheck[0].count)
  }

  await db
    .update(feedTypes)
    .set({ deletedAt: new Date() })
    .where(and(eq(feedTypes.id, id), eq(feedTypes.tenantId, tenantId)))

  try {
    await db.insert(auditLogs).values({
      userId,
      action: 'delete',
      resource: 'feed_type',
      resourceId: String(id),
    })
  } catch {
    // Fire-and-forget audit logging
  }

  return { success: true }
}
