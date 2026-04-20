import { apiClient } from "./client";

export interface Supplier {
  id: number;
  tenantId: number;
  code: string;
  name: string;
  contactPerson: string | null;
  phone: string;
  address: string | null;
  category: "feed" | "vitamin" | "medicine" | "other";
  isActive: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SuppliersResponse {
  suppliers: Supplier[];
}

export interface ListSuppliersParams {
  tenantId: number;
  category?: string;
  isActive?: boolean;
}

export function listSuppliers(params: ListSuppliersParams) {
  const queryParams = new URLSearchParams({ tenantId: String(params.tenantId) });
  if (params.category) queryParams.set('category', params.category);
  if (params.isActive !== undefined) queryParams.set('isActive', String(params.isActive));
  return apiClient<SuppliersResponse>(`/suppliers?${queryParams}`);
}

export function createSupplier(tenantId: number, data: {
  code: string;
  name: string;
  contactPerson?: string;
  phone: string;
  address?: string;
  category: "feed" | "vitamin" | "medicine" | "other";
}): Promise<Supplier> {
  return apiClient<Supplier>(`/suppliers?tenantId=${tenantId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateSupplier(
  tenantId: number,
  id: number,
  data: {
    code?: string;
    name?: string;
    contactPerson?: string;
    phone?: string;
    address?: string;
    category?: "feed" | "vitamin" | "medicine" | "other";
    isActive?: number;
  },
): Promise<Supplier> {
  return apiClient<Supplier>(`/suppliers/${id}?tenantId=${tenantId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function toggleSupplier(tenantId: number, id: number): Promise<Supplier> {
  return apiClient<Supplier>(`/suppliers/${id}/toggle?tenantId=${tenantId}`, { method: "PUT" });
}

export function deleteSupplier(tenantId: number, id: number): Promise<void> {
  return apiClient<void>(`/suppliers/${id}?tenantId=${tenantId}`, { method: "DELETE" });
}