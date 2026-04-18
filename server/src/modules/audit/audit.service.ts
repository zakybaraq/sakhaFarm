import { db } from '../../config/database'
import { auditLogs } from '../../db/schema'
import { desc, eq, and, gt, lt, gte, lte, isNull, like, count } from 'drizzle-orm'
import { AuditLogNotFoundError } from './audit.errors'

/**
 * Query audit logs with optional filters.
 *
 * @param filters - Optional filter criteria
 * @returns Array of audit log entries sorted by createdAt descending
 */
export async function listAuditLogs(filters?: {
  userId?: string
  action?: string
  resource?: string
  resourceId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const query = db.select().from(auditLogs)

  // Apply filters
  const conditions = []
  if (filters?.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId))
  }
  if (filters?.action) {
    conditions.push(eq(auditLogs.action, filters.action))
  }
  if (filters?.resource) {
    conditions.push(eq(auditLogs.resource, filters.resource))
  }
  if (filters?.resourceId) {
    conditions.push(eq(auditLogs.resourceId, filters.resourceId))
  }
  if (filters?.startDate) {
    conditions.push(gte(auditLogs.createdAt, filters.startDate))
  }
  if (filters?.endDate) {
    conditions.push(lte(auditLogs.createdAt, filters.endDate))
  }

  if (conditions.length > 0) {
    query.where(and(...conditions))
  }

  // Sort by newest first
  query.orderBy(desc(auditLogs.createdAt))

  // Pagination
  const limitVal = filters?.limit ?? 50
  const offsetVal = filters?.offset ?? 0
  query.limit(limitVal).offset(offsetVal)

  return query
}

/**
 * Get a single audit log entry by ID.
 */
export async function getAuditLog(id: number) {
  const result = await db.select().from(auditLogs).where(eq(auditLogs.id, id)).limit(1)
  return result[0] ?? null
}

/**
 * Count audit logs matching optional filters.
 */
export async function countAuditLogs(filters?: {
  userId?: string
  action?: string
  resource?: string
  startDate?: Date
  endDate?: Date
}) {
  const countQuery = db.select({ count: count() }).from(auditLogs)

  const conditions = []
  if (filters?.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId))
  }
  if (filters?.action) {
    conditions.push(eq(auditLogs.action, filters.action))
  }
  if (filters?.resource) {
    conditions.push(eq(auditLogs.resource, filters.resource))
  }
  if (filters?.startDate) {
    conditions.push(gte(auditLogs.createdAt, filters.startDate))
  }
  if (filters?.endDate) {
    conditions.push(lte(auditLogs.createdAt, filters.endDate))
  }

  if (conditions.length > 0) {
    countQuery.where(and(...conditions))
  }

  const result = await countQuery
  return Number(result[0]?.count ?? 0)
}
