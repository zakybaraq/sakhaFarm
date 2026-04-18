/**
 * API client for feed inventory management.
 *
 * Provides real-time feed stock levels per plasma for daily monitoring.
 * Used to track current inventory and trigger low-stock alerts.
 */

import { apiClient } from './client';

/** Feed stock record for one plasma and feed product combination. */
export interface FeedStockItem {
  id: number;
  plasmaId: number;
  feedProductId: number;
  plasmaName: string;
  feedProductName: string;
  totalZak: number;
  totalKg: number;
  isLow: boolean;
}

/** Feed stock list response. */
export interface FeedStockResponse {
  stocks: FeedStockItem[];
  stock?: FeedStockItem;
}

/**
 * Get feed stock levels with optional filters.
 * Shows current inventory per plasma — isLow flag indicates stock below threshold.
 * Used in dashboard cards and low-stock alert notifications.
 *
 * @param params - Optional filters (plasma, feed product)
 * @returns Feed stock items matching filters
 * @throws ApiError if request fails
 */
export function getFeedStock(params?: {
  plasmaId?: number;
  feedProductId?: number;
}): Promise<FeedStockResponse> {
  const queryParams = new URLSearchParams();
  if (params?.plasmaId) queryParams.set('plasmaId', String(params.plasmaId));
  if (params?.feedProductId) queryParams.set('feedProductId', String(params.feedProductId));
  const query = queryParams.toString();
  return apiClient<FeedStockResponse>(`/feed/stock${query ? `?${query}` : ''}`);
}
