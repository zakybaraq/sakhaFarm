import { apiClient } from './client'
import type { Permission } from '../types'

export interface Role {
  id: number
  name: string
  description: string
  tenantId: number | null
  createdAt: string
  updatedAt: string
}

export interface RolesResponse {
  roles: Role[]
}

export function listRoles(tenantId: number): Promise<RolesResponse> {
  return apiClient<RolesResponse>(`/rbac/roles?tenantId=${tenantId}`)
}

export function getRole(id: number): Promise<{ role: Role }> {
  return apiClient<{ role: Role }>(`/rbac/roles/${id}`)
}

export function createRole(data: { name: string; description: string }): Promise<{ success: boolean; role: Role }> {
  return apiClient<{ success: boolean; role: Role }>('/rbac/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateRole(id: number, data: { name?: string; description?: string }): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/rbac/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteRole(id: number): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/rbac/roles/${id}`, {
    method: 'DELETE',
  })
}

export function getUserPermissions(): Promise<{ permissions: Permission[] }> {
  return apiClient<{ permissions: Permission[] }>('/auth/permissions')
}