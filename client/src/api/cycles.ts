import { apiClient } from './client'

export interface Cycle {
  id: number
  plasmaId: number
  cycleNumber: number
  docType: string
  chickInDate: string
  initialPopulation: number
  status: string
  createdAt: string
  updatedAt: string
}

export interface CyclesResponse {
  cycles: Cycle[]
}

export function listCycles(): Promise<CyclesResponse> {
  return apiClient<CyclesResponse>('/cycles')
}

export function listActiveCycles(tenantId: number): Promise<CyclesResponse> {
  return apiClient<CyclesResponse>(`/cycles?status=active&tenantId=${tenantId}`)
}

export function createCycle(data: {
  plasmaId: number
  docType: string
  chickInDate: string
  initialPopulation: number
}): Promise<{ success: boolean; cycle: Cycle }> {
  return apiClient<{ success: boolean; cycle: Cycle }>('/cycles', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateCycle(id: number, data: {
  docType?: string
  chickInDate?: string
  initialPopulation?: number
  status?: string
  isDeleted?: boolean
}): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/cycles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteCycle(id: number): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/cycles/${id}`, {
    method: 'DELETE',
  })
}