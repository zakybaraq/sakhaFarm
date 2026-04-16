import { Elysia, t } from 'elysia'
import { requirePermission } from '../../plugins/rbac'
import {
  createRecording,
  listRecordings,
  getRecording,
  updateRecording,
  softDeleteRecording,
} from './recordings.service'
import { importBulk } from './recordings.bulk'
import { getCycleSummary } from './recordings.summary'
import {
  RecordingNotFoundError,
  CycleNotActiveError,
  FutureDateError,
  DuplicateRecordingDateError,
} from './recordings.errors'

function getTenantId(store: Record<string, unknown>, headers: Record<string, string>, deriveTenantId?: number | null): number {
  const storeTenantId = (store as Record<string, unknown>).tenantId as number | undefined
  const headerTenantId = parseInt(headers['x-tenant-id'] || '0', 10)
  return storeTenantId ?? deriveTenantId ?? headerTenantId
}

export const recordingsController = new Elysia({ prefix: '/api/recordings' })
  .onError(({ error, set }) => {
    if (error instanceof RecordingNotFoundError) {
      set.status = 404
      return { error: error.message, code: 'RECORDING_NOT_FOUND' }
    }
    if (error instanceof CycleNotActiveError) {
      set.status = 400
      return { error: error.message, code: 'CYCLE_NOT_ACTIVE' }
    }
    if (error instanceof FutureDateError) {
      set.status = 400
      return { error: error.message, code: 'FUTURE_DATE' }
    }
    if (error instanceof DuplicateRecordingDateError) {
      set.status = 400
      return { error: error.message, code: 'DUPLICATE_RECORDING_DATE' }
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

      const recording = await createRecording(body, currentTenantId, userId)
      return { success: true, recording }
    },
    {
      beforeHandle: requirePermission('recording.create'),
      body: t.Object({
        cycleId: t.Number(),
        recordingDate: t.String({ format: 'date' }),
        dead: t.Optional(t.Number({ minimum: 0 })),
        culled: t.Optional(t.Number({ minimum: 0 })),
        remainingPopulation: t.Number({ minimum: 0 }),
        bodyWeightG: t.Optional(t.Number({ minimum: 0 })),
        feedConsumedKg: t.Optional(t.Number({ minimum: 0 })),
        notes: t.Optional(t.String()),
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
      const cycleId = query.cycleId ? parseInt(query.cycleId as string, 10) : undefined

      if (!cycleId) {
        return { error: 'cycleId query parameter is required', code: 'MISSING_CYCLE_ID' }
      }

      const recordings = await listRecordings(cycleId, currentTenantId)
      return { recordings }
    },
    {
      beforeHandle: requirePermission('recording.read'),
      query: t.Object({
        cycleId: t.String({ format: 'integer' }),
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
      const recording = await getRecording(parseInt(params.id, 10), currentTenantId)
      return { recording }
    },
    {
      beforeHandle: requirePermission('recording.read'),
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

      await updateRecording(parseInt(params.id, 10), body, currentTenantId, userId)
      return { success: true }
    },
    {
      beforeHandle: requirePermission('recording.update'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
      body: t.Object({
        recordingDate: t.Optional(t.String({ format: 'date' })),
        dead: t.Optional(t.Number({ minimum: 0 })),
        culled: t.Optional(t.Number({ minimum: 0 })),
        remainingPopulation: t.Optional(t.Number({ minimum: 0 })),
        bodyWeightG: t.Optional(t.Number({ minimum: 0 })),
        feedConsumedKg: t.Optional(t.Number({ minimum: 0 })),
        notes: t.Optional(t.String()),
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

      await softDeleteRecording(parseInt(params.id, 10), currentTenantId, userId)
      return { success: true }
    },
    {
      beforeHandle: requirePermission('recording.delete'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
    },
  )
  .post(
    '/bulk',
    async ({ body, store, cookie, headers, tenantId }) => {
      const currentTenantId = getTenantId(store, headers, tenantId)
      if (!currentTenantId || currentTenantId === 0) {
        return { error: 'Tenant ID is required', code: 'MISSING_TENANT_ID' }
      }
      const sessionId = cookie.auth_session?.value as string | undefined
      const userId = sessionId || 'system'

      const result = await importBulk(
        body.csv,
        body.cycleId,
        currentTenantId,
        userId,
      )
      return result
    },
    {
      beforeHandle: requirePermission('recording.create'),
      body: t.Object({
        csv: t.String(),
        cycleId: t.Number(),
      }),
    },
  )