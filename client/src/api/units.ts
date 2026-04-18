import { apiClient } from './client'

export interface Unit {
  id: number
  tenantId: number
  name: string
  code: string
  location: string | null
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface UnitsResponse {
  units: Unit[]
}

export function listUnits(): Promise<UnitsResponse> {
  return apiClient<UnitsResponse>('/units')
}

export function getUnit(id: number): Promise<{ unit: Unit }> {
  return apiClient<{ unit: Unit }>(`/units/${id}`)
}

export function createUnit(data: { name: string; code: string; location?: string }): Promise<{ success: boolean; unit: Unit }> {
  return apiClient<{ success: boolean; unit: Unit }>('/units', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateUnit(id: number, data: { name?: string; code?: string; location?: string; isDeleted?: boolean }): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/units/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteUnit(id: number): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/units/${id}`, {
    method: 'DELETE',
  })
}