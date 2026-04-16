import { Elysia, t } from 'elysia'
import { requirePermission } from '../../plugins/rbac'
import {
  createCycle,
  listCycles,
  getCycle,
  updateCycle,
  softDeleteCycle,
  completeCycle,
  failCycle,
} from './cycle.service'
import {
  CycleNotFoundError,
  CycleCapacityExceededError,
  InvalidCycleStatusTransitionError,
  CycleNotInTenantPlasmaError,
  CycleHasRecordingsError,
} from './cycle.errors'

export const cycleController = new Elysia({ prefix: '/api/cycles' })
  .onError(({ error }) => {
    if (error instanceof CycleNotFoundError) {
      return { error: error.message, code: 'CYCLE_NOT_FOUND' }
    }
    if (error instanceof CycleCapacityExceededError) {
      return { error: error.message, code: 'CYCLE_CAPACITY_EXCEEDED' }
    }
    if (error instanceof InvalidCycleStatusTransitionError) {
      return { error: error.message, code: 'INVALID_STATUS_TRANSITION' }
    }
    if (error instanceof CycleNotInTenantPlasmaError) {
      return { error: error.message, code: 'CYCLE_NOT_IN_TENANT_PLASMA' }
    }
    if (error instanceof CycleHasRecordingsError) {
      return { error: error.message, code: 'CYCLE_HAS_RECORDINGS' }
    }
  })
  .post(
    '/',
    async ({ body, store, cookie }) => {
      const tenantId = (store as Record<string, unknown>).tenantId as number
      const sessionId = cookie.auth_session?.value as string | undefined
      const userId = sessionId || 'system'

      const cycle = await createCycle(body, tenantId, userId)
      return { success: true, cycle }
    },
    {
      beforeHandle: requirePermission('cycle.create'),
      body: t.Object({
        plasmaId: t.Number(),
        docType: t.String({ minLength: 1, maxLength: 50 }),
        chickInDate: t.String(),
        initialPopulation: t.Number({ minimum: 1 }),
      }),
    },
  )
  .get(
    '/',
    async ({ query, store }) => {
      const tenantId = (store as Record<string, unknown>).tenantId as number
      const plasmaId = query.plasmaId ? parseInt(query.plasmaId, 10) : undefined
      const status = query.status as string | undefined

      const result = await listCycles(tenantId, plasmaId, status)
      return { cycles: result }
    },
    {
      beforeHandle: requirePermission('cycle.read'),
      query: t.Object({
        plasmaId: t.Optional(t.String({ format: 'integer' })),
        status: t.Optional(t.Enum({ active: 'active', completed: 'completed', failed: 'failed' })),
      }),
    },
  )
  .get(
    '/:id',
    async ({ params, store }) => {
      const tenantId = (store as Record<string, unknown>).tenantId as number
      const cycle = await getCycle(parseInt(params.id, 10), tenantId)
      return { cycle }
    },
    {
      beforeHandle: requirePermission('cycle.read'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
    },
  )
  .put(
    '/:id',
    async ({ params, body, store, cookie }) => {
      const tenantId = (store as Record<string, unknown>).tenantId as number
      const sessionId = cookie.auth_session?.value as string | undefined
      const userId = sessionId || 'system'

      await updateCycle(parseInt(params.id, 10), body, tenantId, userId)
      return { success: true }
    },
    {
      beforeHandle: requirePermission('cycle.update'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
      body: t.Object({
        docType: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
        chickInDate: t.Optional(t.String()),
        initialPopulation: t.Optional(t.Number({ minimum: 1 })),
      }),
    },
  )
  .delete(
    '/:id',
    async ({ params, store, cookie }) => {
      const tenantId = (store as Record<string, unknown>).tenantId as number
      const sessionId = cookie.auth_session?.value as string | undefined
      const userId = sessionId || 'system'

      await softDeleteCycle(parseInt(params.id, 10), tenantId, userId)
      return { success: true }
    },
    {
      beforeHandle: requirePermission('cycle.delete'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
    },
  )
  .post(
    '/:id/complete',
    async ({ params, body, store, cookie }) => {
      const tenantId = (store as Record<string, unknown>).tenantId as number
      const sessionId = cookie.auth_session?.value as string | undefined
      const userId = sessionId || 'system'

      await completeCycle(parseInt(params.id, 10), body, tenantId, userId)
      return { success: true }
    },
    {
      beforeHandle: requirePermission('cycle.complete'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
      body: t.Object({
        harvestDate: t.String(),
        finalPopulation: t.Number({ minimum: 0 }),
      }),
    },
  )
  .post(
    '/:id/fail',
    async ({ params, body, store, cookie }) => {
      const tenantId = (store as Record<string, unknown>).tenantId as number
      const sessionId = cookie.auth_session?.value as string | undefined
      const userId = sessionId || 'system'

      await failCycle(parseInt(params.id, 10), body, tenantId, userId)
      return { success: true }
    },
    {
      beforeHandle: requirePermission('cycle.fail'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
      body: t.Object({
        harvestDate: t.String(),
        notes: t.Optional(t.String()),
      }),
    },
  )
