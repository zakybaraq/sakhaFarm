import { db } from '../../config/database'
import { feedBrands, feedProducts, auditLogs } from '../../db/schema'
import { eq, and, isNull, desc, ne, count } from 'drizzle-orm'
import {
  FeedBrandNotFoundError,
  DuplicateFeedBrandCodeError,
  FeedBrandInUseError,
} from './feed-brands.errors'

export async function createFeedBrand(
  input: { name: string; code: string; phone?: string },
  tenantId: number,
  userId: string,
) {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(feedBrands)
      .where(
        and(
          eq(feedBrands.code, input.code),
          eq(feedBrands.tenantId, tenantId),
          isNull(feedBrands.deletedAt),
        ),
      )

    if (existing.length > 0) {
      throw new DuplicateFeedBrandCodeError(input.code)
    }

    const result = await tx.insert(feedBrands).values({
      name: input.name,
      code: input.code,
      phone: input.phone ?? null,
      tenantId,
    })

    const newId = result[0].insertId

    try {
      await tx.insert(auditLogs).values({
        userId,
        action: 'create',
        resource: 'feed_brand',
        resourceId: String(newId),
        newValue: JSON.stringify(input),
      })
    } catch {
      // Fire-and-forget audit logging
    }

    const created = await tx.select().from(feedBrands).where(eq(feedBrands.id, newId)).limit(1)
    return created[0]
  })
}

export async function listFeedBrands(tenantId: number) {
  return db
    .select()
    .from(feedBrands)
    .where(and(eq(feedBrands.tenantId, tenantId), isNull(feedBrands.deletedAt)))
    .orderBy(desc(feedBrands.createdAt))
}

export async function getFeedBrand(id: number, tenantId: number) {
  const result = await db
    .select()
    .from(feedBrands)
    .where(and(eq(feedBrands.id, id), eq(feedBrands.tenantId, tenantId), isNull(feedBrands.deletedAt)))
    .limit(1)

  if (result.length === 0) {
    throw new FeedBrandNotFoundError(id)
  }

  return result[0]
}

export async function updateFeedBrand(
  id: number,
  input: { name?: string; code?: string; phone?: string },
  tenantId: number,
  userId: string,
) {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(feedBrands)
      .where(and(eq(feedBrands.id, id), eq(feedBrands.tenantId, tenantId), isNull(feedBrands.deletedAt)))
      .limit(1)

    if (existing.length === 0) {
      throw new FeedBrandNotFoundError(id)
    }

    if (input.code) {
      const duplicate = await tx
        .select()
        .from(feedBrands)
        .where(
          and(
            eq(feedBrands.code, input.code),
            ne(feedBrands.id, id),
            eq(feedBrands.tenantId, tenantId),
            isNull(feedBrands.deletedAt),
          ),
        )

      if (duplicate.length > 0) {
        throw new DuplicateFeedBrandCodeError(input.code)
      }
    }

    const updateData: Record<string, unknown> = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.code !== undefined) updateData.code = input.code
    if (input.phone !== undefined) updateData.phone = input.phone

    await tx.update(feedBrands).set(updateData).where(and(eq(feedBrands.id, id), eq(feedBrands.tenantId, tenantId)))

    try {
      await tx.insert(auditLogs).values({
        userId,
        action: 'update',
        resource: 'feed_brand',
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

export async function toggleFeedBrand(id: number, tenantId: number, userId: string) {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(feedBrands)
      .where(and(eq(feedBrands.id, id), eq(feedBrands.tenantId, tenantId), isNull(feedBrands.deletedAt)))
      .limit(1)

    if (existing.length === 0) {
      throw new FeedBrandNotFoundError(id)
    }

    const newIsActive = existing[0].isActive === 1 ? 0 : 1

    await tx
      .update(feedBrands)
      .set({ isActive: newIsActive })
      .where(and(eq(feedBrands.id, id), eq(feedBrands.tenantId, tenantId)))

    try {
      await tx.insert(auditLogs).values({
        userId,
        action: 'update',
        resource: 'feed_brand',
        resourceId: String(id),
        newValue: JSON.stringify({ isActive: newIsActive }),
      })
    } catch {
      // Fire-and-forget audit logging
    }

    return { success: true, isActive: newIsActive }
  })
}

export async function softDeleteFeedBrand(id: number, tenantId: number, userId: string) {
  const existing = await db
    .select()
    .from(feedBrands)
    .where(and(eq(feedBrands.id, id), eq(feedBrands.tenantId, tenantId), isNull(feedBrands.deletedAt)))
    .limit(1)

  if (existing.length === 0) {
    throw new FeedBrandNotFoundError(id)
  }

  const productCheck = await db
    .select({ count: count() })
    .from(feedProducts)
    .where(and(eq(feedProducts.brandId, id), isNull(feedProducts.deletedAt)))

  if (productCheck[0].count > 0) {
    throw new FeedBrandInUseError(id, productCheck[0].count)
  }

  await db
    .update(feedBrands)
    .set({ deletedAt: new Date() })
    .where(and(eq(feedBrands.id, id), eq(feedBrands.tenantId, tenantId)))

  try {
    await db.insert(auditLogs).values({
      userId,
      action: 'delete',
      resource: 'feed_brand',
      resourceId: String(id),
    })
  } catch {
    // Fire-and-forget audit logging
  }

  return { success: true }
}
