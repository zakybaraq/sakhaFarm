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
  category?: string;
  isActive?: boolean;
}

export function listSuppliers(params?: ListSuppliersParams) {
  return apiClient<SuppliersResponse>("/suppliers");
}

export function createSupplier(data: {
  code: string;
  name: string;
  contactPerson?: string;
  phone: string;
  address?: string;
  category: "feed" | "vitamin" | "medicine" | "other";
}): Promise<Supplier> {
  return apiClient<Supplier>("/suppliers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateSupplier(
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
  return apiClient<Supplier>(`/suppliers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function toggleSupplier(id: number): Promise<Supplier> {
  return apiClient<Supplier>(`/suppliers/${id}/toggle`, { method: "PUT" });
}

export function deleteSupplier(id: number): Promise<void> {
  return apiClient<void>(`/suppliers/${id}`, { method: "DELETE" });
}