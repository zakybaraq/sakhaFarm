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

export function listActiveCycles(tenantId: number): Promise<CyclesResponse> {
  return apiClient<CyclesResponse>(`/cycles?status=active&tenantId=${tenantId}`)
}