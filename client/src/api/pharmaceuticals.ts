import { apiClient } from "./client";

export interface Pharmaceutical {
  id: number;
  tenantId: number;
  code: string;
  name: string;
  category: "vitamin" | "medicine";
  unitOfMeasure: string;
  manufacturer: string | null;
  strength: string | null;
  phone: string | null;
  supplierId: number | null;
  supplierName?: string | null;
  isActive: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PharmaceuticalsResponse {
  items: Pharmaceutical[];
}

export interface PharmaceuticalStockItem {
  id: number;
  plasmaId: number;
  plasmaName: string;
  itemId: number;
  itemName: string;
  openingStock: string;
  totalIn: string;
  totalOut: string;
  closingStock: string;
  lastUpdatedAt: string;
}

export interface StockResponse {
  stocks: PharmaceuticalStockItem[];
}

export interface PharmaceuticalBatch {
  id: number;
  tenantId: number;
  itemId: number;
  batchNumber: string;
  expiryDate: string;
  receivedQty: string;
  remainingQty: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchesResponse {
  batches: PharmaceuticalBatch[];
}

export interface UsageInput {
  plasmaId: number;
  itemId: number;
  batchQuantities: { batchId: number; quantity: string }[];
  date: string;
  note?: string;
}

export interface UsageResponse {
  success: boolean;
  consumption: {
    totalQty: string;
    closingStock: string;
  };
}

export interface ListPharmaceuticalsParams {
  tenantId: number;
  category?: string;
}

export function listPharmaceuticals(params: ListPharmaceuticalsParams) {
  const queryParams = new URLSearchParams({ tenantId: String(params.tenantId) });
  if (params.category) queryParams.set("category", params.category);
  return apiClient<PharmaceuticalsResponse>(`/vitamins-medicines?${queryParams}`);
}

export function getPharmaceutical(id: number, tenantId: number) {
  return apiClient<Pharmaceutical>(`/vitamins-medicines/${id}?tenantId=${tenantId}`);
}

export function createPharmaceutical(
  tenantId: number,
  data: {
    code: string;
    name: string;
    category: "vitamin" | "medicine";
    unitOfMeasure: string;
    manufacturer?: string;
    strength?: string;
    phone?: string;
    supplierId?: number;
  }
) {
  return apiClient<Pharmaceutical>(`/vitamins-medicines?tenantId=${tenantId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updatePharmaceutical(
  id: number,
  tenantId: number,
  data: Partial<{
    code: string;
    name: string;
    category: string;
    unitOfMeasure: string;
    manufacturer: string;
    strength: string;
    phone: string;
    supplierId: number;
    isActive: number;
  }>
) {
  return apiClient<Pharmaceutical>(`/vitamins-medicines/${id}?tenantId=${tenantId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function togglePharmaceutical(id: number, tenantId: number) {
  return apiClient<Pharmaceutical>(`/vitamins-medicines/${id}/toggle?tenantId=${tenantId}`, {
    method: "PUT",
  });
}

export function deletePharmaceutical(id: number, tenantId: number) {
  return apiClient<void>(`/vitamins-medicines/${id}?tenantId=${tenantId}`, {
    method: "DELETE",
  });
}

export function listPharmaceuticalStock(params: {
  tenantId: number;
  plasmaId?: number;
  itemId?: number;
  category?: string;
}) {
  const queryParams = new URLSearchParams({ tenantId: String(params.tenantId) });
  if (params.plasmaId) queryParams.set("plasmaId", String(params.plasmaId));
  if (params.itemId) queryParams.set("itemId", String(params.itemId));
  if (params.category) queryParams.set("category", params.category);
  return apiClient<StockResponse>(`/pharmaceutical-stock?${queryParams}`);
}

export function listPharmaceuticalBatches(itemId: number) {
  return apiClient<BatchesResponse>(`/pharmaceutical-batches?itemId=${itemId}`);
}

export function createPharmaceuticalBatch(
  data: {
    itemId: number;
    batchNumber: string;
    expiryDate: string;
    receivedQty: string;
  },
  tenantId: number
) {
  return apiClient<PharmaceuticalBatch>(`/pharmaceutical-batches?tenantId=${tenantId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function recordPharmaceuticalUsage(data: UsageInput, tenantId: number) {
  return apiClient<UsageResponse>(`/pharmaceutical-usage?tenantId=${tenantId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}