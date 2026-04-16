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
import { getCycleSummary } from '../recordings/recordings.summary'
import {
  CycleNotFoundError,
  CycleCapacityExceededError,
  InvalidCycleStatusTransitionError,
  CycleNotInTenantPlasmaError,
  CycleHasRecordingsError,
} from './cycle.errors'

function getTenantId(store: Record<string, unknown>, headers: Record<string, string>, deriveTenantId?: number | null): number {
  const storeTenantId = (store as Record<string, unknown>).tenantId as number | undefined
  const headerTenantId = parseInt(headers['x-tenant-id'] || '0', 10)
  return storeTenantId ?? deriveTenantId ?? headerTenantId
}

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
    async ({ body, store, cookie, headers, tenantId }) => {
      const currentTenantId = getTenantId(store, headers, tenantId)
      if (!currentTenantId || currentTenantId === 0) {
        return { error: 'Tenant ID is required', code: 'MISSING_TENANT_ID' }
      }
      const sessionId = cookie.auth_session?.value as string | undefined
      const userId = sessionId || 'system'

      const cycle = await createCycle(body, currentTenantId, userId)
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
    async ({ query, store, headers, tenantId }) => {
      const currentTenantId = getTenantId(store, headers, tenantId)
      if (!currentTenantId || currentTenantId === 0) {
        return { error: 'Tenant ID is required', code: 'MISSING_TENANT_ID' }
      }
      const plasmaId = query.plasmaId ? parseInt(query.plasmaId, 10) : undefined
      const status = query.status as string | undefined

      const result = await listCycles(currentTenantId, plasmaId, status)
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
    async ({ params, store, headers, tenantId }) => {
      const currentTenantId = getTenantId(store, headers, tenantId)
      if (!currentTenantId || currentTenantId === 0) {
        return { error: 'Tenant ID is required', code: 'MISSING_TENANT_ID' }
      }
      const cycle = await getCycle(parseInt(params.id, 10), currentTenantId)
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
    async ({ params, body, store, cookie, headers, tenantId }) => {
      const currentTenantId = getTenantId(store, headers, tenantId)
      if (!currentTenantId || currentTenantId === 0) {
        return { error: 'Tenant ID is required', code: 'MISSING_TENANT_ID' }
      }
      const sessionId = cookie.auth_session?.value as string | undefined
      const userId = sessionId || 'system'

      await updateCycle(parseInt(params.id, 10), body, currentTenantId, userId)
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
    async ({ params, store, cookie, headers, tenantId }) => {
      const currentTenantId = getTenantId(store, headers, tenantId)
      if (!currentTenantId || currentTenantId === 0) {
        return { error: 'Tenant ID is required', code: 'MISSING_TENANT_ID' }
      }
      const sessionId = cookie.auth_session?.value as string | undefined
      const userId = sessionId || 'system'

      await softDeleteCycle(parseInt(params.id, 10), currentTenantId, userId)
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
    async ({ params, body, store, cookie, headers, tenantId }) => {
      const currentTenantId = getTenantId(store, headers, tenantId)
      if (!currentTenantId || currentTenantId === 0) {
        return { error: 'Tenant ID is required', code: 'MISSING_TENANT_ID' }
      }
      const sessionId = cookie.auth_session?.value as string | undefined
      const userId = sessionId || 'system'

      await completeCycle(parseInt(params.id, 10), body, currentTenantId, userId)
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
    async ({ params, body, store, cookie, headers, tenantId }) => {
      const currentTenantId = getTenantId(store, headers, tenantId)
      if (!currentTenantId || currentTenantId === 0) {
        return { error: 'Tenant ID is required', code: 'MISSING_TENANT_ID' }
      }
      const sessionId = cookie.auth_session?.value as string | undefined
      const userId = sessionId || 'system'

      await failCycle(parseInt(params.id, 10), body, currentTenantId, userId)
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
  .get(
    '/:id/summary',
    async ({ params, store, headers, tenantId }) => {
      const currentTenantId = getTenantId(store, headers, tenantId)
      if (!currentTenantId || currentTenantId === 0) {
        return { error: 'Tenant ID is required', code: 'MISSING_TENANT_ID' }
      }
      const summary = await getCycleSummary(parseInt(params.id, 10), currentTenantId)
      return { summary }
    },
    {
      beforeHandle: requirePermission('cycle.read'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
    },
  )
