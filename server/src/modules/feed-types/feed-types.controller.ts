import { Elysia, t } from 'elysia'
import { requirePermission } from '../../plugins/rbac'
import { getTenantId } from '../../plugins/tenant'
import {
  createFeedType,
  listFeedTypes,
  getFeedType,
  updateFeedType,
  toggleFeedType,
  softDeleteFeedType,
} from './feed-types.service'
import {
  FeedTypeNotFoundError,
  DuplicateFeedTypeCodeError,
  FeedTypeInUseError,
} from './feed-types.errors'

export const feedTypesController = new Elysia({ prefix: '/api/feed-types' })
  .onError(({ error, set }) => {
    if (error instanceof FeedTypeNotFoundError) {
      set.status = 404
      return { error: error.message, code: 'FEED_TYPE_NOT_FOUND' }
    }
    if (error instanceof FeedTypeInUseError) {
      set.status = 409
      return { error: error.message, code: 'FEED_TYPE_IN_USE' }
    }
    if (error instanceof DuplicateFeedTypeCodeError) {
      set.status = 409
      return { error: error.message, code: 'DUPLICATE_FEED_TYPE_CODE' }
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

      const feedType = await createFeedType(ctx.body, currentTenantId, userId)
      return { success: true, feedType }
    },
    {
      beforeHandle: requirePermission('feed-types.create'),
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 100 }),
        code: t.String({ minLength: 1, maxLength: 20 }),
      }),
    },
  )
  .get(
    '/',
    async (ctx) => {
      const currentTenantId = getTenantId(ctx)
      const result = await listFeedTypes(currentTenantId)
      return { feedTypes: result }
    },
    {
      beforeHandle: requirePermission('feed-types.read'),
    },
  )
  .get(
    '/:id',
    async (ctx) => {
      const currentTenantId = getTenantId(ctx)
      const feedType = await getFeedType(parseInt(ctx.params.id, 10), currentTenantId)
      return { feedType }
    },
    {
      beforeHandle: requirePermission('feed-types.read'),
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

      await updateFeedType(parseInt(ctx.params.id, 10), ctx.body, currentTenantId, userId)
      return { success: true }
    },
    {
      beforeHandle: requirePermission('feed-types.update'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
        code: t.Optional(t.String({ minLength: 1, maxLength: 20 })),
      }),
    },
  )
  .put(
    '/:id/toggle',
    async (ctx) => {
      const currentTenantId = getTenantId(ctx)
      if (!ctx.user) {
        throw new Error('MISSING_USER_ID')
      }
      const userId = ctx.user.id

      const result = await toggleFeedType(parseInt(ctx.params.id, 10), currentTenantId, userId)
      return result
    },
    {
      beforeHandle: requirePermission('feed-types.update'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
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

      await softDeleteFeedType(parseInt(ctx.params.id, 10), currentTenantId, userId)
      return { success: true }
    },
    {
      beforeHandle: requirePermission('feed-types.delete'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
    },
  )
