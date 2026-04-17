import { Elysia, t } from 'elysia'
import { requirePermission } from '../../plugins/rbac'
import { getTenantId } from '../../plugins/tenant'
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
  CycleNotFoundError,
} from './recordings.errors'

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
    if (error instanceof CycleNotFoundError) {
      set.status = 404
      return { error: error.message, code: 'CYCLE_NOT_FOUND' }
    }
    if (error instanceof Error && error.message === 'MISSING_TENANT_ID') {
      set.status = 400
      return { error: 'Tenant ID is required', code: 'MISSING_TENANT_ID' }
    }
    if (error instanceof Error && error.message === 'MISSING_USER_ID') {
      set.status = 401
      return { error: 'Authentication required', code: 'MISSING_USER_ID' }
    }
  })
  .post(
    '/',
    async (ctx) => {
      const currentTenantId = getTenantId(ctx)
      if (!ctx.user) {
        throw new Error('MISSING_USER_ID')
      }
      const userId = ctx.user.id

      const recording = await createRecording(ctx.body, currentTenantId, userId)
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
    async (ctx) => {
      const currentTenantId = getTenantId(ctx)
      const cycleId = ctx.query.cycleId ? parseInt(ctx.query.cycleId as string, 10) : undefined

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
    async (ctx) => {
      const currentTenantId = getTenantId(ctx)
      const recording = await getRecording(parseInt(ctx.params.id, 10), currentTenantId)
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
    async (ctx) => {
      const currentTenantId = getTenantId(ctx)
      if (!ctx.user) {
        throw new Error('MISSING_USER_ID')
      }
      const userId = ctx.user.id

      await updateRecording(parseInt(ctx.params.id, 10), ctx.body, currentTenantId, userId)
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
    async (ctx) => {
      const currentTenantId = getTenantId(ctx)
      if (!ctx.user) {
        throw new Error('MISSING_USER_ID')
      }
      const userId = ctx.user.id

      await softDeleteRecording(parseInt(ctx.params.id, 10), currentTenantId, userId)
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
    async (ctx) => {
      const currentTenantId = getTenantId(ctx)
      if (!ctx.user) {
        throw new Error('MISSING_USER_ID')
      }
      const userId = ctx.user.id

      const result = await importBulk(
        ctx.body.csv,
        ctx.body.cycleId,
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