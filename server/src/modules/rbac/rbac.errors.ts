/**
 * RBAC-specific error classes for role and permission management.
 *
 * These errors are thrown when RBAC operations fail due to business rule violations,
 * such as attempting to delete a role with active users or modifying default roles.
 */

/**
 * Thrown when attempting to delete a role that has active users assigned.
 *
 * @param roleName - Name of the role that cannot be deleted
 * @param userCount - Number of active users assigned to this role
 */
export class RoleHasUsersError extends Error {
  constructor(roleName: string, userCount: number) {
    super(`Cannot delete role "${roleName}": ${userCount} active user(s) assigned`)
    this.name = 'RoleHasUsersError'
  }
}

/**
 * Thrown when attempting to modify or delete a default/system role.
 *
 * Default roles (Super Admin, Admin Unit, Admin Plasma, Viewer) are protected
 * and cannot be deleted. Their names can be updated but not removed.
 *
 * @param roleName - Name of the protected role
 */
export class DefaultRoleError extends Error {
  constructor(roleName: string) {
    super(`Cannot modify default role "${roleName}": system-protected`)
    this.name = 'DefaultRoleError'
  }
}

/**
 * Thrown when a permission assignment is invalid.
 *
 * @param message - Description of the validation failure
 */
export class PermissionAssignmentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PermissionAssignmentError'
  }
}
