import { apiClient } from './client'

export interface User {
  id: string
  email: string
  name: string
  roleId: number
  tenantId: number
  status: 'active' | 'inactive'
  createdAt: string
}

export interface UsersResponse {
  users: User[]
}

export function listUsers(filters?: {
  name?: string
  email?: string
  roleId?: number
  tenantId?: number
  status?: 'active' | 'inactive'
}): Promise<UsersResponse> {
  const params = new URLSearchParams()
  if (filters?.name) params.set('name', filters.name)
  if (filters?.email) params.set('email', filters.email)
  if (filters?.roleId) params.set('roleId', String(filters.roleId))
  if (filters?.tenantId) params.set('tenantId', String(filters.tenantId))
  if (filters?.status) params.set('status', filters.status)
  const query = params.toString()
  return apiClient<UsersResponse>(`/users${query ? `?${query}` : ''}`)
}

export function getUser(id: string): Promise<{ user: User }> {
  return apiClient<{ user: User }>(`/users/${id}`)
}

export function createUser(data: {
  email: string
  password: string
  name: string
  roleId: number
  tenantId: number
}): Promise<{ success: boolean; user: User }> {
  return apiClient<{ success: boolean; user: User }>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateUser(id: string, data: {
  name?: string
  email?: string
  roleId?: number
}): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deactivateUser(id: string): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/users/${id}/deactivate`, {
    method: 'PATCH',
  })
}

export function activateUser(id: string): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/users/${id}/activate`, {
    method: 'PATCH',
  })
}

export function resetPassword(id: string): Promise<{ success: boolean; tempPassword: string }> {
  return apiClient<{ success: boolean; tempPassword: string }>(`/users/${id}/reset-password`, {
    method: 'POST',
  })
}