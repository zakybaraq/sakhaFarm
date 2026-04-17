import { Elysia } from 'elysia'
import { db } from '../config/database'
import { tenants } from '../db/schema'
import { eq } from 'drizzle-orm'
import { SUPER_ADMIN_ROLE_ID } from '../lib/constants'

export const tenantPlugin = new Elysia({ name: 'tenant-plugin' })
  .derive({ as: 'global' }, async (ctx) => {
    const request = ctx.request as Request
    const user = ctx.user as any

    let tenantId: number | null = null

    const urlStr = request.url
    const queryStart = urlStr.indexOf('?')
    
    if (queryStart !== -1) {
      const queryString = urlStr.substring(queryStart + 1)
      const params = new URLSearchParams(queryString)
      const tenantIdParam = params.get('tenantId')
      if (tenantIdParam) {
        tenantId = parseInt(tenantIdParam, 10)
        if (isNaN(tenantId)) tenantId = null
      }
    }

    if (!tenantId) {
      const headerValue = request.headers.get('x-tenant-id')
      if (headerValue) {
        tenantId = parseInt(headerValue, 10)
        if (isNaN(tenantId)) tenantId = null
      }
    }

    if (!tenantId && user?.roleId === SUPER_ADMIN_ROLE_ID) {
      return { tenantId: user.tenantId || 1 }
    }

    if (!tenantId) {
      return { tenantId: null }
    }

    if (user && user.roleId === SUPER_ADMIN_ROLE_ID) {
      return { tenantId }
    }

    if (user && tenantId !== user.tenantId) {
      return { tenantId: null, tenantError: 'Tenant access denied' }
    }

    const tenant = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1)
    if (tenant.length === 0) {
      return { tenantId: null, tenantError: 'Tenant not found' }
    }
    if (tenant[0].isActive !== 1) {
      return { tenantId: null, tenantError: 'Tenant is inactive' }
    }

    return { tenantId }
  })

export function getTenantId(ctx: any): number {
  const tenantId = ctx.tenantId as number | undefined
  if (tenantId && tenantId > 0) {
    return tenantId
  }
  throw new Error('MISSING_TENANT_ID')
}
