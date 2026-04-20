/**
 * API client for role-based access control (RBAC) endpoints.
 *
 * Handles role CRUD and permission assignment for multi-tenant RBAC.
 * Permissions are fetched once at login and cached in memory for the session.
 */

import { apiClient } from "./client";
import type { Permission } from "../types";

/** RBAC role with metadata for role management UI. */
export interface Role {
  id: number;
  name: string;
  description: string;
  tenantId: number | null;
  createdAt: string;
  updatedAt: string;
}

/** API response containing roles list. */
export interface RolesResponse {
  roles: Role[];
}

/**
 * List all roles for a tenant.
 * Used in role management page to populate role dropdowns and assignment UI.
 *
 * @param tenantId - Tenant ID to scope roles to
 * @returns List of roles (empty array if no roles exist)
 * @throws ApiError if tenant not found or request fails
 */
export function listRoles(tenantId: number): Promise<RolesResponse> {
  return apiClient<RolesResponse>(`/rbac/roles?tenantId=${tenantId}`);
}

/**
 * Get a single role by ID.
 * Used when editing a role to populate the edit form.
 *
 * @param roleId - Role ID to fetch
 * @returns Role object with all fields
 * @throws ApiError if role not found
 */
export function getRole(id: number): Promise<{ role: Role }> {
  return apiClient<{ role: Role }>(`/rbac/roles/${id}`);
}

/**
 * Create a new role.
 * New roles start with no permissions — use separate permission assignment endpoint.
 *
 * @param data - Role name and description
 * @returns Created role with server-assigned ID
 * @throws ApiError if role name already exists in tenant
 */
export function createRole(data: {
  name: string;
  description: string;
}): Promise<{ success: boolean; role: Role }> {
  return apiClient<{ success: boolean; role: Role }>("/rbac/roles", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing role.
 * Only provided fields are updated — omitted fields remain unchanged.
 *
 * @param roleId - Role ID to update
 * @param data - Fields to update (name and/or description)
 * @throws ApiError if role not found or name conflicts
 */
export function updateRole(
  id: number,
  data: { name?: string; description?: string },
): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/rbac/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a role permanently.
 * Users with this role lose access — warn before deletion.
 *
 * @param roleId - Role ID to delete
 * @throws ApiError if role not found or assigned to users
 */
export function deleteRole(id: number): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/rbac/roles/${id}`, {
    method: "DELETE",
  });
}

/**
 * Fetch current user's permission set.
 * Called once at app initialization to cache permissions.
 * Permissions are used throughout UI to show/hide actions based on RBAC.
 *
 * @returns List of_permission objects (resource + action pairs)
 * @throws ApiError if session invalid
 */
export function getUserPermissions(): Promise<{ permissions: Permission[] }> {
  return apiClient<{ permissions: Permission[] }>("/auth/permissions");
}

export interface RbacPermission {
  id: number;
  name: string;
  description: string;
  category: string;
}

export interface PermissionsResponse {
  permissions: RbacPermission[];
}

export function listPermissions(): Promise<PermissionsResponse> {
  return apiClient<PermissionsResponse>("/rbac/permissions");
}

export interface RolePermission {
  id: number;
  name: string;
  action: string;
  category: string;
}

export function getRolePermissions(
  roleId: number,
): Promise<{ permissions: RolePermission[] }> {
  return apiClient<{ permissions: RolePermission[] }>(
    `/rbac/roles/${roleId}/permissions`,
  );
}

export function assignPermissionToRole(
  roleId: number,
  permissionId: number,
  action: "assign" | "remove",
): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/rbac/roles/${roleId}/permissions`, {
    method: "POST",
    body: JSON.stringify({ permissionId, action }),
  });
}
