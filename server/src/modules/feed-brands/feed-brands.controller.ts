import { Elysia, t } from 'elysia'
import { requirePermission } from '../../plugins/rbac'
import { getTenantId } from '../../plugins/tenant'
import {
  createFeedBrand,
  listFeedBrands,
  getFeedBrand,
  updateFeedBrand,
  toggleFeedBrand,
  softDeleteFeedBrand,
} from './feed-brands.service'
import {
  FeedBrandNotFoundError,
  DuplicateFeedBrandCodeError,
  FeedBrandInUseError,
} from './feed-brands.errors'

export const feedBrandsController = new Elysia({ prefix: '/api/feed-brands' })
  .onError(({ error, set }) => {
    if (error instanceof FeedBrandNotFoundError) {
      set.status = 404
      return { error: error.message, code: 'FEED_BRAND_NOT_FOUND' }
    }
    if (error instanceof FeedBrandInUseError) {
      set.status = 409
      return { error: error.message, code: 'FEED_BRAND_IN_USE' }
    }
    if (error instanceof DuplicateFeedBrandCodeError) {
      set.status = 409
      return { error: error.message, code: 'DUPLICATE_FEED_BRAND_CODE' }
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

      const feedBrand = await createFeedBrand(ctx.body, currentTenantId, userId)
      return { success: true, feedBrand }
    },
    {
      beforeHandle: requirePermission('feed-brands.create'),
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 100 }),
        code: t.String({ minLength: 1, maxLength: 20 }),
        phone: t.Optional(t.String({ maxLength: 20 })),
      }),
    },
  )
  .get(
    '/',
    async (ctx) => {
      const currentTenantId = getTenantId(ctx)
      const result = await listFeedBrands(currentTenantId)
      return { feedBrands: result }
    },
    {
      beforeHandle: requirePermission('feed-brands.read'),
    },
  )
  .get(
    '/:id',
    async (ctx) => {
      const currentTenantId = getTenantId(ctx)
      const feedBrand = await getFeedBrand(parseInt(ctx.params.id, 10), currentTenantId)
      return { feedBrand }
    },
    {
      beforeHandle: requirePermission('feed-brands.read'),
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

      await updateFeedBrand(parseInt(ctx.params.id, 10), ctx.body, currentTenantId, userId)
      return { success: true }
    },
    {
      beforeHandle: requirePermission('feed-brands.update'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
        code: t.Optional(t.String({ minLength: 1, maxLength: 20 })),
        phone: t.Optional(t.String({ maxLength: 20 })),
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

      const result = await toggleFeedBrand(parseInt(ctx.params.id, 10), currentTenantId, userId)
      return result
    },
    {
      beforeHandle: requirePermission('feed-brands.update'),
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

      await softDeleteFeedBrand(parseInt(ctx.params.id, 10), currentTenantId, userId)
      return { success: true }
    },
    {
      beforeHandle: requirePermission('feed-brands.delete'),
      params: t.Object({
        id: t.String({ format: 'integer' }),
      }),
    },
  )
