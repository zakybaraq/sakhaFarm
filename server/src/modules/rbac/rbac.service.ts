import { db } from '../../config/database'
import { roles, permissions, rolePermissions, users } from '../../db/schema'
import { eq, and, eq as drizzleEq } from 'drizzle-orm'
import { RoleHasUsersError, DefaultRoleError, PermissionAssignmentError } from './rbac.errors'

/**
 * Creates a new role scoped to a tenant.
 *
 * @param name - Role name (must be unique per tenant)
 * @param description - Human-readable description
 * @param tenantId - Tenant ID (null for system-level roles)
 * @returns Created role record
 */
export async function createRole(name: string, description: string, tenantId: number | null) {
  const result = await db.insert(roles).values({
    name,
    description,
    tenantId,
    isDefault: 0,
  })

  return { name, description, tenantId, id: result[0].insertId }
}

/**
 * Lists all roles for a given tenant.
 *
 * @param tenantId - Tenant ID to filter by (null returns system-level roles)
 * @returns Array of role records
 */
export async function listRoles(tenantId: number | null) {
  if (tenantId !== null) {
    return await db.select().from(roles).where(eq(roles.tenantId, tenantId))
  }
  return await db.select().from(roles)
}

/**
 * Gets a single role by ID.
 *
 * @param id - Role ID
 * @returns Role record or undefined if not found
 */
export async function getRole(id: number) {
  const result = await db.select().from(roles).where(eq(roles.id, id)).limit(1)
  return result[0]
}

/**
 * Updates role name and description.
 *
 * @param id - Role ID
 * @param name - New role name
 * @param description - New description
 * @returns Updated role record
 */
export async function updateRole(id: number, name: string, description: string) {
  await db.update(roles)
    .set({ name, description })
    .where(eq(roles.id, id))

  const result = await db.select().from(roles).where(eq(roles.id, id)).limit(1)
  return result[0]
}

/**
 * Soft-deletes a role by setting isDefault to -1.
 *
 * Prevents deletion if role has active users or is a default role.
 *
 * @param id - Role ID to delete
 * @throws RoleHasUsersError if role has active users
 * @throws DefaultRoleError if role is a default/system role
 */
export async function deleteRole(id: number) {
  const role = await getRole(id)
  if (!role) {
    throw new Error('Role not found')
  }

  if (role.isDefault === 1) {
    throw new DefaultRoleError(role.name)
  }

  const activeUsers = await db
    .select({ count: users.id })
    .from(users)
    .where(and(eq(users.roleId, id), eq(users.isActive, 1)))

  if (activeUsers.length > 0) {
    throw new RoleHasUsersError(role.name, activeUsers.length)
  }

  await db.update(roles)
    .set({ isDefault: -1 })
    .where(eq(roles.id, id))

  return { id, deleted: true }
}

/**
 * Creates a new permission entry.
 *
 * Permissions are append-only — no delete operation is provided.
 *
 * @param name - Permission name (e.g., "flock.create")
 * @param description - Human-readable description
 * @param category - Category grouping (e.g., "flock", "feed")
 * @returns Created permission record
 */
export async function createPermission(name: string, description: string, category: string) {
  const result = await db.insert(permissions).values({
    name,
    description,
    category,
  })

  return { name, description, category, id: result[0].insertId }
}

/**
 * Lists all permissions, optionally filtered by category.
 *
 * @param category - Optional category filter
 * @returns Array of permission records
 */
export async function listPermissions(category?: string) {
  if (category) {
    return await db.select().from(permissions).where(eq(permissions.category, category))
  }
  return await db.select().from(permissions)
}

/**
 * Gets a single permission by ID.
 *
 * @param id - Permission ID
 * @returns Permission record or undefined if not found
 */
export async function getPermission(id: number) {
  const result = await db.select().from(permissions).where(eq(permissions.id, id)).limit(1)
  return result[0]
}

/**
 * Updates permission name and description.
 *
 * @param id - Permission ID
 * @param name - New permission name
 * @param description - New description
 * @returns Updated permission record
 */
export async function updatePermission(id: number, name: string, description: string) {
  await db.update(permissions)
    .set({ name, description })
    .where(eq(permissions.id, id))

  const result = await db.select().from(permissions).where(eq(permissions.id, id)).limit(1)
  return result[0]
}

/**
 * Assigns a permission to a role with a specified action.
 *
 * @param roleId - Role ID
 * @param permissionId - Permission ID
 * @param action - Action type (e.g., "allow", "deny")
 * @throws PermissionAssignmentError if role or permission not found, or already assigned
 */
export async function assignPermission(roleId: number, permissionId: number, action: string) {
  const role = await getRole(roleId)
  if (!role) {
    throw new PermissionAssignmentError(`Role ${roleId} not found`)
  }

  const permission = await getPermission(permissionId)
  if (!permission) {
    throw new PermissionAssignmentError(`Permission ${permissionId} not found`)
  }

  const existing = await db
    .select()
    .from(rolePermissions)
    .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)))
    .limit(1)

  if (existing.length > 0) {
    throw new PermissionAssignmentError(`Permission ${permission.name} already assigned to role ${role.name}`)
  }

  await db.insert(rolePermissions).values({
    roleId,
    permissionId,
    action,
  })

  return { roleId, permissionId, action }
}

/**
 * Removes a permission assignment from a role.
 *
 * @param roleId - Role ID
 * @param permissionId - Permission ID
 * @throws PermissionAssignmentError if assignment not found
 */
export async function removePermission(roleId: number, permissionId: number) {
  const existing = await db
    .select()
    .from(rolePermissions)
    .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)))
    .limit(1)

  if (existing.length === 0) {
    throw new PermissionAssignmentError('Permission assignment not found')
  }

  await db
    .delete(rolePermissions)
    .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)))

  return { roleId, permissionId, removed: true }
}

/**
 * Lists all permissions assigned to a role, joined with permission details.
 *
 * @param roleId - Role ID
 * @returns Array of permission assignments with permission metadata
 */
export async function getRolePermissions(roleId: number) {
  const role = await getRole(roleId)
  if (!role) {
    throw new Error('Role not found')
  }

  return await db
    .select({
      id: rolePermissions.id,
      action: rolePermissions.action,
      permissionId: permissions.id,
      permissionName: permissions.name,
      permissionDescription: permissions.description,
      permissionCategory: permissions.category,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId))
}
