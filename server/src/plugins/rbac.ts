import { Elysia } from 'elysia'
import { db } from '../config/database'
import { rolePermissions, permissions, users } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { SUPER_ADMIN_ROLE_ID } from '../lib/constants'

export function requirePermission(requiredPermission: string) {
  return async (ctx: any) => {
    const user = ctx.user

    if (!user) {
      ctx.set.status = 401
      return { error: 'Authentication required' }
    }

    if (user.isActive !== 1) {
      ctx.set.status = 403
      return { error: 'Account is deactivated', code: 'FORBIDDEN' }
    }

    if (user.roleId === SUPER_ADMIN_ROLE_ID) {
      return
    }

    const result = await db
      .select({ action: rolePermissions.action })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(rolePermissions.roleId, user.roleId),
          eq(permissions.name, requiredPermission),
          eq(rolePermissions.action, 'allow')
        )
      )
      .limit(1)

    if (result.length === 0) {
      ctx.set.status = 403
      return { error: `Permission denied: ${requiredPermission}`, code: 'FORBIDDEN' }
    }
  }
}

export const rbacPlugin = new Elysia({ name: 'rbac-plugin' })
