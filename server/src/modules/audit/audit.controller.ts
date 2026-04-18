import { Elysia, t } from 'elysia'
import { requirePermission } from '../../plugins/rbac'
import {
  listAuditLogs,
  getAuditLog,
  countAuditLogs,
  AuditLogNotFoundError,
  AuditQueryTooBroadError,
} from './audit.service'

export const auditController = new Elysia({ prefix: '/api/audit' })
  .onError(({ code, error, set }) => {
    if (error instanceof AuditLogNotFoundError) {
      set.status = 404
      return { error: error.message, code: 'AUDIT_LOG_NOT_FOUND' }
    }
    if (error instanceof AuditQueryTooBroadError) {
      set.status = 400
      return { error: error.message, code: 'QUERY_TOO_BROAD' }
    }
    if (error instanceof Error && error.message.startsWith('Permission denied:')) {
      set.status = 403
      return { error: error.message, code: 'FORBIDDEN' }
    }
  })
  .get(
    '/logs',
    async ({ query, set }) => {
      const {
        userId,
        action,
        resource,
        resourceId,
        startDate,
        endDate,
        limit = '50',
        offset = '0',
      } = query as Record<string, string>

      // Require at least one filter to prevent full-table scans
      if (!userId && !action && !resource && !startDate && !endDate) {
        throw new AuditQueryTooBroadError()
      }

      const filters: {
        userId?: string
        action?: string
        resource?: string
        resourceId?: string
        startDate?: Date
        endDate?: Date
        limit?: number
        offset?: number
      } = {}

      if (userId) filters.userId = userId
      if (action) filters.action = action
      if (resource) filters.resource = resource
      if (resourceId) filters.resourceId = resourceId
      // Parse date filters with validation
      if (startDate) {
        const parsed = new Date(startDate)
        if (isNaN(parsed.getTime())) {
          set.status = 400
          return { error: 'Invalid startDate format — use ISO date or date-time', code: 'INVALID_DATE' }
        }
        filters.startDate = parsed
      }
      if (endDate) {
        const parsed = new Date(endDate)
        if (isNaN(parsed.getTime())) {
          set.status = 400
          return { error: 'Invalid endDate format — use ISO date or date-time', code: 'INVALID_DATE' }
        }
        filters.endDate = parsed
      }
      filters.limit = parseInt(limit, 10)
      filters.offset = parseInt(offset, 10)

      const [logs, total] = await Promise.all([
        listAuditLogs(filters),
        countAuditLogs(filters),
      ])

      return { logs, total, limit: filters.limit, offset: filters.offset }
    },
    {
      beforeHandle: requirePermission('audit.read'),
      query: t.Object({
        userId: t.Optional(t.String()),
        action: t.Optional(t.String()),
        resource: t.Optional(t.String()),
        resourceId: t.Optional(t.String()),
        startDate: t.Optional(t.String({ format: 'date-time' })),
        endDate: t.Optional(t.String({ format: 'date-time' })),
        limit: t.Optional(t.String({ format: 'integer' })),
        offset: t.Optional(t.String({ format: 'integer' })),
      }),
    },
  )
  .get(
    '/logs/:id',
    async ({ params, set }) => {
      const id = parseInt(params.id, 10)
      const log = await getAuditLog(id)

      if (!log) {
        throw new AuditLogNotFoundError(id)
      }

      return { log }
    },
    {
      beforeHandle: requirePermission('audit.read'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
    },
  )
