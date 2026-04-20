import { Elysia, t } from 'elysia'
import { requirePermission } from '../../plugins/rbac'
import { getTenantId } from '../../plugins/tenant'
import {
  createUnit,
  listUnits,
  getUnit,
  updateUnit,
  softDeleteUnit,
} from './unit.service'
import {
  UnitNotFoundError,
  UnitHasActivePlasmasError,
  DuplicateUnitCodeError,
} from './unit.errors'

export const unitController = new Elysia({ prefix: '/api/units' })
  .onError(({ error, set }) => {
    if (error instanceof UnitNotFoundError) {
      set.status = 404
      return { error: error.message, code: 'UNIT_NOT_FOUND' }
    }
    if (error instanceof UnitHasActivePlasmasError) {
      set.status = 409
      return { error: error.message, code: 'UNIT_HAS_ACTIVE_PLASMAS' }
    }
    if (error instanceof DuplicateUnitCodeError) {
      set.status = 409
      return { error: error.message, code: 'DUPLICATE_UNIT_CODE' }
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

      const unit = await createUnit(ctx.body, currentTenantId, userId)
      return { success: true, unit }
    },
    {
      beforeHandle: requirePermission('unit.create'),
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 100 }),
        code: t.String({ minLength: 1, maxLength: 20 }),
        location: t.Optional(t.String({ maxLength: 255 })),
      }),
    },
  )
  .get(
    '/',
    async (ctx) => {
      const currentTenantId = getTenantId(ctx)
      const result = await listUnits(currentTenantId)
      return { units: result }
    },
    {
      beforeHandle: requirePermission('unit.read'),
    },
  )
  .get(
    '/:id',
    async (ctx) => {
      const currentTenantId = getTenantId(ctx)
      const unit = await getUnit(parseInt(ctx.params.id, 10), currentTenantId)
      return { unit }
    },
    {
      beforeHandle: requirePermission('unit.read'),
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

      await updateUnit(parseInt(ctx.params.id, 10), ctx.body, currentTenantId, userId)
      return { success: true }
    },
    {
      beforeHandle: requirePermission('unit.update'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
        code: t.Optional(t.String({ minLength: 1, maxLength: 20 })),
        location: t.Optional(t.String({ maxLength: 255 })),
        isActive: t.Optional(t.Number()),
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

      await softDeleteUnit(parseInt(ctx.params.id, 10), currentTenantId, userId)
      return { success: true }
    },
    {
      beforeHandle: requirePermission('unit.delete'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
    },
  )