import { apiClient } from './client'

export interface PerformanceRecord {
  cycleId: number
  cycleNumber: number
  docType: string
  date: string
  bodyWeight: number
  fcr: number
  sr: number
  deplesi: number
  ip: number | null
}

export interface PerformanceResponse {
  data: PerformanceRecord[]
  total: number
  page: number
  limit: number
}

export interface StockResumeItem {
  feedProductId: number
  feedProductName: string
  unitId: number
  unitName: string
  plasmaId: number
  plasmaName: string
  totalZak: number
  totalKg: number
}

export interface StockResumeResponse {
  data: StockResumeItem[]
  total: number
  page: number
  limit: number
}

export function getPerformance(tenantId: number, params?: { cycleId?: number; unitId?: number; dateFrom?: string; dateTo?: string; page?: number; limit?: number }): Promise<PerformanceResponse> {
  const queryParams = new URLSearchParams({ tenantId: String(tenantId) })
  if (params?.cycleId) queryParams.set('cycleId', String(params.cycleId))
  if (params?.unitId) queryParams.set('unitId', String(params.unitId))
  if (params?.dateFrom) queryParams.set('dateFrom', params.dateFrom)
  if (params?.dateTo) queryParams.set('dateTo', params.dateTo)
  if (params?.page) queryParams.set('page', String(params.page))
  if (params?.limit) queryParams.set('limit', String(params.limit))
  return apiClient<PerformanceResponse>(`/reporting/performance?${queryParams.toString()}`)
}

export function getStockResume(tenantId: number, params?: { unitId?: number; plasmaId?: number; feedProductId?: number; page?: number; limit?: number }): Promise<StockResumeResponse> {
  const queryParams = new URLSearchParams({ tenantId: String(tenantId) })
  if (params?.unitId) queryParams.set('unitId', String(params.unitId))
  if (params?.plasmaId) queryParams.set('plasmaId', String(params.plasmaId))
  if (params?.feedProductId) queryParams.set('feedProductId', String(params.feedProductId))
  if (params?.page) queryParams.set('page', String(params.page))
  if (params?.limit) queryParams.set('limit', String(params.limit))
  return apiClient<StockResumeResponse>(`/reporting/stock-resume?${queryParams.toString()}`)
}