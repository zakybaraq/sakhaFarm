import { Elysia } from 'elysia'
import { db } from '../config/database'
import { tenants } from '../db/schema'
import { eq } from 'drizzle-orm'

export const tenantPlugin = new Elysia({ name: 'tenant-plugin' })
  .derive({ as: 'global' }, async (ctx) => {
    const { request } = ctx
    const user = (ctx as any).user

    const tenantIdHeader = request.headers.get('X-Tenant-ID')

    if (!tenantIdHeader) {
      return { tenantId: null }
    }

    const tenantId = parseInt(tenantIdHeader, 10)
    if (isNaN(tenantId)) {
      return { tenantId: null, tenantError: 'Invalid tenant ID' }
    }

    if (user && user.roleId === 1) {
      return { tenantId }
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
