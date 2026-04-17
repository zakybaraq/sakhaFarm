import { Elysia, t } from 'elysia'
import { requirePermission } from '../../plugins/rbac'
import { getTenantId } from '../../plugins/tenant'
import {
  createPlasma,
  listPlasmas,
  getPlasma,
  updatePlasma,
  softDeletePlasma,
} from './plasma.service'
import {
  PlasmaNotFoundError,
  PlasmaHasActiveCyclesError,
  PlasmaNotInTenantUnitError,
} from './plasma.errors'

export const plasmaController = new Elysia({ prefix: '/api/plasmas' })
  .onError(({ error, set }) => {
    if (error instanceof PlasmaNotFoundError) {
      set.status = 404
      return { error: error.message, code: 'PLASMA_NOT_FOUND' }
    }
    if (error instanceof PlasmaHasActiveCyclesError) {
      set.status = 409
      return { error: error.message, code: 'PLASMA_HAS_ACTIVE_CYCLES' }
    }
    if (error instanceof PlasmaNotInTenantUnitError) {
      set.status = 409
      return { error: error.message, code: 'PLASMA_NOT_IN_TENANT_UNIT' }
    }
    if (error instanceof Error && error.message === 'MISSING_TENANT_ID') {
      set.status = 401
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

      const plasma = await createPlasma(ctx.body, currentTenantId, userId)
      return { success: true, plasma }
    },
    {
      beforeHandle: requirePermission('plasma.create'),
      body: t.Object({
        unitId: t.Number(),
        name: t.String({ minLength: 1, maxLength: 100 }),
        farmerName: t.Optional(t.String({ maxLength: 100 })),
        address: t.Optional(t.String()),
        phone: t.Optional(t.String({ maxLength: 20 })),
        capacity: t.Optional(t.Number()),
      }),
    },
  )
  .get(
    '/',
    async (ctx) => {
      const currentTenantId = getTenantId(ctx)
      const unitId = ctx.query.unitId ? parseInt(ctx.query.unitId as string, 10) : undefined
      const result = await listPlasmas(currentTenantId, unitId)
      return { plasmas: result }
    },
    {
      beforeHandle: requirePermission('plasma.read'),
      query: t.Object({
        unitId: t.Optional(t.String({ format: 'integer' })),
      }),
    },
  )
  .get(
    '/:id',
    async (ctx) => {
      const currentTenantId = getTenantId(ctx)
      const plasma = await getPlasma(parseInt(ctx.params.id, 10), currentTenantId)
      return { plasma }
    },
    {
      beforeHandle: requirePermission('plasma.read'),
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

      await updatePlasma(parseInt(ctx.params.id, 10), ctx.body, currentTenantId, userId)
      return { success: true }
    },
    {
      beforeHandle: requirePermission('plasma.update'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
        farmerName: t.Optional(t.String({ maxLength: 100 })),
        address: t.Optional(t.String()),
        phone: t.Optional(t.String({ maxLength: 20 })),
        capacity: t.Optional(t.Number()),
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

      await softDeletePlasma(parseInt(ctx.params.id, 10), currentTenantId, userId)
      return { success: true }
    },
    {
      beforeHandle: requirePermission('plasma.delete'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
    },
  )