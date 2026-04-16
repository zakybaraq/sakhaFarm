import { Elysia } from 'elysia'
import { db } from '../config/database'
import { rolePermissions, permissions } from '../db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Creates a permission guard that checks if the current user has the specified permission.
 *
 * Super Admin (roleId === 1) bypasses all permission checks.
 *
 * @param requiredPermission - Permission string in format "resource.action" (e.g., "flock.create")
 * @returns Elysia resolve function that checks permission
 * @throws Error if user lacks the required permission
 */
export function requirePermission(requiredPermission: string) {
  return async ({ user }: { user: any }) => {
    if (user && user.roleId === 1) {
      return { permitted: true }
    }

    if (!user) {
      throw new Error('Authentication required')
    }

    const [resource, action] = requiredPermission.split('.')

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
      throw new Error(`Permission denied: ${requiredPermission}`)
    }

    return { permitted: true }
  }
}

export const rbacPlugin = new Elysia({ name: 'rbac-plugin' })
