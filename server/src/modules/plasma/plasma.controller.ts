import { Elysia, t } from 'elysia'
import { requirePermission } from '../../plugins/rbac'
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
  .onError(({ error }) => {
    if (error instanceof PlasmaNotFoundError) {
      return { error: error.message, code: 'PLASMA_NOT_FOUND' }
    }
    if (error instanceof PlasmaHasActiveCyclesError) {
      return { error: error.message, code: 'PLASMA_HAS_ACTIVE_CYCLES' }
    }
    if (error instanceof PlasmaNotInTenantUnitError) {
      return { error: error.message, code: 'PLASMA_NOT_IN_TENANT_UNIT' }
    }
  })
  .post(
    '/',
    async ({ body, store, cookie }) => {
      const tenantId = (store as Record<string, unknown>).tenantId as number
      const sessionId = cookie.auth_session?.value as string | undefined
      const userId = sessionId || 'system'

      const plasma = await createPlasma(body, tenantId, userId)
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
    async ({ query, store }) => {
      const tenantId = (store as Record<string, unknown>).tenantId as number
      const unitId = query.unitId ? parseInt(query.unitId, 10) : undefined
      const result = await listPlasmas(tenantId, unitId)
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
    async ({ params, store }) => {
      const tenantId = (store as Record<string, unknown>).tenantId as number
      const plasma = await getPlasma(parseInt(params.id, 10), tenantId)
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
    async ({ params, body, store, cookie }) => {
      const tenantId = (store as Record<string, unknown>).tenantId as number
      const sessionId = cookie.auth_session?.value as string | undefined
      const userId = sessionId || 'system'

      await updatePlasma(parseInt(params.id, 10), body, tenantId, userId)
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
    async ({ params, store, cookie }) => {
      const tenantId = (store as Record<string, unknown>).tenantId as number
      const sessionId = cookie.auth_session?.value as string | undefined
      const userId = sessionId || 'system'

      await softDeletePlasma(parseInt(params.id, 10), tenantId, userId)
      return { success: true }
    },
    {
      beforeHandle: requirePermission('plasma.delete'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
    },
  )
