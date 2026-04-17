import { Elysia, t } from 'elysia'
import { requirePermission } from '../../plugins/rbac'
import { getTenantId } from '../../plugins/tenant'
import {
  getStockResume,
  getPerformanceReport,
  stockResumeToCSV,
  performanceToCSV,
} from './reporting.service'

export const reportingController = new Elysia({ prefix: '/api/reporting' })
  .onError(({ error, set }) => {
    if (error instanceof Error && error.message === 'MISSING_TENANT_ID') {
      set.status = 400
      return { error: 'Tenant ID is required', code: 'MISSING_TENANT_ID' }
    }
  })
  .get(
    '/stock-resume',
    async (ctx) => {
      const currentTenantId = getTenantId(ctx)

      const result = await getStockResume(currentTenantId, {
        unitId: ctx.query.unitId,
        plasmaId: ctx.query.plasmaId,
        feedProductId: ctx.query.feedProductId,
        page: ctx.query.page,
        limit: ctx.query.limit,
      })

      return result
    },
    {
      beforeHandle: requirePermission('reporting.read'),
      query: t.Object({
        unitId: t.Optional(t.Number({ minimum: 1 })),
        plasmaId: t.Optional(t.Number({ minimum: 1 })),
        feedProductId: t.Optional(t.Number({ minimum: 1 })),
        page: t.Optional(t.Number({ minimum: 1 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      }),
    },
  )
  .get(
    '/performance',
    async (ctx) => {
      const currentTenantId = getTenantId(ctx)

      const result = await getPerformanceReport(currentTenantId, {
        cycleId: ctx.query.cycleId,
        unitId: ctx.query.unitId,
        dateFrom: ctx.query.dateFrom,
        dateTo: ctx.query.dateTo,
        page: ctx.query.page,
        limit: ctx.query.limit,
      })

      return result
    },
    {
      beforeHandle: requirePermission('reporting.read'),
      query: t.Object({
        cycleId: t.Optional(t.Number({ minimum: 1 })),
        unitId: t.Optional(t.Number({ minimum: 1 })),
        dateFrom: t.Optional(t.String({ format: 'date' })),
        dateTo: t.Optional(t.String({ format: 'date' })),
        page: t.Optional(t.Number({ minimum: 1 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      }),
    },
  )
  .get(
    '/stock-resume/export',
    async (ctx) => {
      const currentTenantId = getTenantId(ctx)

      const result = await getStockResume(currentTenantId, {
        unitId: ctx.query.unitId,
        plasmaId: ctx.query.plasmaId,
        feedProductId: ctx.query.feedProductId,
        page: 1,
        limit: 10000,
      })

      const csv = stockResumeToCSV(result.data)
      ctx.set.headers['content-type'] = 'text/csv'
      ctx.set.headers['content-disposition'] = 'attachment; filename=stock-resume.csv'
      return csv
    },
    {
      beforeHandle: requirePermission('reporting.export'),
      query: t.Object({
        unitId: t.Optional(t.Number({ minimum: 1 })),
        plasmaId: t.Optional(t.Number({ minimum: 1 })),
        feedProductId: t.Optional(t.Number({ minimum: 1 })),
      }),
    },
  )
  .get(
    '/performance/export',
    async (ctx) => {
      const currentTenantId = getTenantId(ctx)

      const result = await getPerformanceReport(currentTenantId, {
        cycleId: ctx.query.cycleId,
        unitId: ctx.query.unitId,
        dateFrom: ctx.query.dateFrom,
        dateTo: ctx.query.dateTo,
        page: 1,
        limit: 10000,
      })

      const csv = performanceToCSV(result.data)
      ctx.set.headers['content-type'] = 'text/csv'
      ctx.set.headers['content-disposition'] = 'attachment; filename=performance.csv'
      return csv
    },
    {
      beforeHandle: requirePermission('reporting.export'),
      query: t.Object({
        cycleId: t.Optional(t.Number({ minimum: 1 })),
        unitId: t.Optional(t.Number({ minimum: 1 })),
        dateFrom: t.Optional(t.String({ format: 'date' })),
        dateTo: t.Optional(t.String({ format: 'date' })),
      }),
    },
  )