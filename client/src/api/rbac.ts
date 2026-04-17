/**
 * RBAC API function to fetch the current user's permissions.
 *
 * Uses /api/auth/permissions (NOT /api/rbac/permissions) because
 * the rbac endpoint requires rbac.read permission which regular
 * users don't have. The /auth/permissions endpoint returns the
 * authenticated user's own permissions based on their roleId.
 */

import { apiClient } from './client'
import type { Permission } from '../types'

/**
 * Fetches the current user's permissions from /api/auth/permissions.
 * Permission names (e.g., 'units.read', 'cycles.read') map directly
 * to sidebar menu item visibility.
 *
 * @returns Object with permissions array
 */
export function getUserPermissions(): Promise<{ permissions: Permission[] }> {
  return apiClient<{ permissions: Permission[] }>('/auth/permissions')
}