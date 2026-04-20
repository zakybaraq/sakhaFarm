/**
 * API client for reporting and analytics endpoints.
 *
 * Provides data for performance tracking and stock monitoring dashboards.
 * Used by management to analyze growth metrics and feed consumption.
 */

import { apiClient } from './client';

/** Performance record for one cycle on one date. */
export interface PerformanceRecord {
  cycleId: number;
  cycleNumber: number;
  docType: string;
  date: string;
  bodyWeight: number;
  fcr: number;
  sr: number;
  deplesi: number;
  ip: number | null;
}

/** Paginated performance data response. */
export interface PerformanceResponse {
  data: PerformanceRecord[];
  total: number;
  page: number;
  limit: number;
}

/** Stock summary item for one feed product in one plasma. */
export interface StockResumeItem {
  feedProductId: number;
  feedProductName: string;
  unitId: number;
  unitName: string;
  plasmaId: number;
  plasmaName: string;
  totalZak: number;
  totalKg: number;
}

/** Paginated stock resume response. */
export interface StockResumeResponse {
  data: StockResumeItem[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Get performance records for cycles.
 * Shows daily body weight, FCR, mortality rate (SR), deplesi, and IP over time.
 * Used in performance charts to track growth efficiency per cycle.
 *
 * @param tenantId - Tenant to scope data to
 * @param params - Optional filters (cycle, unit, date range, pagination)
 * @returns Performance records with pagination metadata
 * @throws ApiError if request fails
 */
export function getPerformance(
  tenantId: number,
  params?: {
    cycleId?: number;
    unitId?: number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  },
): Promise<PerformanceResponse> {
  const queryParams = new URLSearchParams({ tenantId: String(tenantId) });
  if (params?.cycleId) queryParams.set('cycleId', String(params.cycleId));
  if (params?.unitId) queryParams.set('unitId', String(params.unitId));
  if (params?.dateFrom) queryParams.set('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.set('dateTo', params.dateTo);
  if (params?.page) queryParams.set('page', String(params.page));
  if (params?.limit) queryParams.set('limit', String(params.limit));
  return apiClient<PerformanceResponse>(`/reporting/performance?${queryParams.toString()}`);
}

/**
 * Get feed stock summary by product and plasma.
 * Shows current inventory in zak and kg units for each feed type per plasma.
 * Used in stock alerts and purchase planning.
 *
 * @param tenantId - Tenant to scope data to
 * @param params - Optional filters (unit, plasma, feed product, date range, pagination)
 * @returns Stock summary with aggregated quantities
 * @throws ApiError if request fails
 */
export function getStockResume(
  tenantId: number,
  params?: {
    unitId?: number;
    plasmaId?: number;
    feedProductId?: number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  },
): Promise<StockResumeResponse> {
  const queryParams = new URLSearchParams({ tenantId: String(tenantId) });
  if (params?.unitId) queryParams.set('unitId', String(params.unitId));
  if (params?.plasmaId) queryParams.set('plasmaId', String(params.plasmaId));
  if (params?.feedProductId) queryParams.set('feedProductId', String(params.feedProductId));
  if (params?.dateFrom) queryParams.set('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.set('dateTo', params.dateTo);
  if (params?.page) queryParams.set('page', String(params.page));
  if (params?.limit) queryParams.set('limit', String(params.limit));
  return apiClient<StockResumeResponse>(`/reporting/stock-resume?${queryParams.toString()}`);
}
