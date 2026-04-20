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
// ─── Feed Types ───────────────────────────────────────────────────────────────

/** Feed type master data item. */
export interface FeedType {
  id: number;
  tenantId: number;
  code: string;
  name: string;
  isActive: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Feed types list response. */
export interface FeedTypesResponse {
  types: FeedType[];
}

export function listFeedTypes(): Promise<FeedTypesResponse> {
  return apiClient<FeedTypesResponse>('/feed-types');
}

export function createFeedType(data: {
  code: string;
  name: string;
}): Promise<FeedType> {
  return apiClient<FeedType>('/feed-types', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateFeedType(
  id: number,
  data: { code?: string; name?: string; isActive?: number },
): Promise<FeedType> {
  return apiClient<FeedType>(`/feed-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function toggleFeedType(id: number): Promise<FeedType> {
  return apiClient<FeedType>(`/feed-types/${id}/toggle`, { method: 'PUT' });
}

export function deleteFeedType(id: number): Promise<void> {
  return apiClient<void>(`/feed-types/${id}`, { method: 'DELETE' });
}

// ─── Feed Brands ──────────────────────────────────────────────────────────────

/** Feed brand master data item. */
export interface FeedBrand {
  id: number;
  tenantId: number;
  code: string;
  name: string;
  phone: string | null;
  isActive: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Feed brands list response. */
export interface FeedBrandsResponse {
  brands: FeedBrand[];
}

export function listFeedBrands(): Promise<FeedBrandsResponse> {
  return apiClient<FeedBrandsResponse>('/feed-brands');
}

export function createFeedBrand(data: {
  code: string;
  name: string;
  phone?: string;
}): Promise<FeedBrand> {
  return apiClient<FeedBrand>('/feed-brands', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateFeedBrand(
  id: number,
  data: { code?: string; name?: string; phone?: string; isActive?: number },
): Promise<FeedBrand> {
  return apiClient<FeedBrand>(`/feed-brands/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function toggleFeedBrand(id: number): Promise<FeedBrand> {
  return apiClient<FeedBrand>(`/feed-brands/${id}/toggle`, { method: 'PUT' });
}

export function deleteFeedBrand(id: number): Promise<void> {
  return apiClient<void>(`/feed-brands/${id}`, { method: 'DELETE' });
}

// ─── Feed Products ────────────────────────────────────────────────────────────

/** Feed product catalog item. */
export interface FeedProduct {
  id: number;
  tenantId: number;
  code: string;
  name: string;
  typeId: number | null;
  brandId: number | null;
  typeName: string | null;
  brandName: string | null;
  proteinPercent: string | null;
  defaultUnit: string | null;
  zakKgConversion: string | null;
  isActive: number | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Feed products list response. */
export interface FeedProductsResponse {
  products: FeedProduct[];
}

/**
 * List all feed products for the current tenant.
 * Used to populate feed product dropdowns in reports and forms.
 *
 * @returns Feed product catalog items
 * @throws ApiError if request fails
 */
export function listFeedProducts(): Promise<FeedProductsResponse> {
  return apiClient<FeedProductsResponse>('/feed/products');
}

export function createFeedProduct(data: {
  code: string;
  name: string;
  typeId?: number | null;
  brandId?: number | null;
  zakKgConversion?: string;
}): Promise<FeedProduct> {
  return apiClient<FeedProduct>('/feed/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateFeedProduct(
  id: number,
  data: {
    code?: string;
    name?: string;
    typeId?: number | null;
    brandId?: number | null;
    zakKgConversion?: string;
    isActive?: number;
  },
): Promise<FeedProduct> {
  return apiClient<FeedProduct>(`/feed/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function toggleFeedProduct(id: number): Promise<FeedProduct> {
  return apiClient<FeedProduct>(`/feed/products/${id}/toggle`, {
    method: 'PUT',
  });
}

export function deleteFeedProduct(id: number): Promise<void> {
  return apiClient<void>(`/feed/products/${id}`, { method: 'DELETE' });
}

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
