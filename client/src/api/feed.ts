import { apiClient } from './client'

export interface FeedStockItem {
  id: number
  plasmaId: number
  feedProductId: number
  plasmaName: string
  feedProductName: string
  totalZak: number
  totalKg: number
  isLow: boolean
}

export interface FeedStockResponse {
  stocks: FeedStockItem[]
  stock?: FeedStockItem
}

export function getFeedStock(params?: { plasmaId?: number; feedProductId?: number }): Promise<FeedStockResponse> {
  const queryParams = new URLSearchParams()
  if (params?.plasmaId) queryParams.set('plasmaId', String(params.plasmaId))
  if (params?.feedProductId) queryParams.set('feedProductId', String(params.feedProductId))
  const query = queryParams.toString()
  return apiClient<FeedStockResponse>(`/feed/stock${query ? `?${query}` : ''}`)
}