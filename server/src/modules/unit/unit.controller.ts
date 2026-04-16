import { Elysia, t } from 'elysia'
import { requirePermission } from '../../plugins/rbac'
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
  .onError(({ error }) => {
    if (error instanceof UnitNotFoundError) {
      return { error: error.message, code: 'UNIT_NOT_FOUND' }
    }
    if (error instanceof UnitHasActivePlasmasError) {
      return { error: error.message, code: 'UNIT_HAS_ACTIVE_PLASMAS' }
    }
    if (error instanceof DuplicateUnitCodeError) {
      return { error: error.message, code: 'DUPLICATE_UNIT_CODE' }
    }
  })
  .post(
    '/',
    async ({ body, store, cookie }) => {
      const tenantId = (store as Record<string, unknown>).tenantId as number
      const sessionId = cookie.auth_session?.value as string | undefined
      const userId = sessionId || 'system'

      const unit = await createUnit(body, tenantId, userId)
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
    async ({ store }) => {
      const tenantId = (store as Record<string, unknown>).tenantId as number
      const result = await listUnits(tenantId)
      return { units: result }
    },
    {
      beforeHandle: requirePermission('unit.read'),
    },
  )
  .get(
    '/:id',
    async ({ params, store }) => {
      const tenantId = (store as Record<string, unknown>).tenantId as number
      const unit = await getUnit(parseInt(params.id, 10), tenantId)
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
    async ({ params, body, store, cookie }) => {
      const tenantId = (store as Record<string, unknown>).tenantId as number
      const sessionId = cookie.auth_session?.value as string | undefined
      const userId = sessionId || 'system'

      await updateUnit(parseInt(params.id, 10), body, tenantId, userId)
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
      }),
    },
  )
  .delete(
    '/:id',
    async ({ params, store, cookie }) => {
      const tenantId = (store as Record<string, unknown>).tenantId as number
      const sessionId = cookie.auth_session?.value as string | undefined
      const userId = sessionId || 'system'

      await softDeleteUnit(parseInt(params.id, 10), tenantId, userId)
      return { success: true }
    },
    {
      beforeHandle: requirePermission('unit.delete'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
    },
  )
