import { apiClient } from './client';

export interface Plasma {
  id: number;
  tenantId: number;
  unitId: number;
  name: string;
  farmerName: string | null;
  address: string | null;
  phone: string | null;
  capacity: number | null;
  isActive: number;
  createdAt: string;
  updatedAt: string;
  unitName?: string | null;
}

export interface PlasmasResponse {
  plasmas: Plasma[];
}

export function listPlasmas(unitId?: number): Promise<PlasmasResponse> {
  const params = unitId ? `?unitId=${unitId}` : '';
  return apiClient<PlasmasResponse>(`/plasmas${params}`);
}

export function getPlasma(id: number): Promise<{ plasma: Plasma }> {
  return apiClient<{ plasma: Plasma }>(`/plasmas/${id}`);
}

export function createPlasma(data: {
  unitId: number;
  name: string;
  farmerName?: string;
  address?: string;
  phone?: string;
  capacity?: number;
}): Promise<{ success: boolean; plasma: Plasma }> {
  return apiClient<{ success: boolean; plasma: Plasma }>('/plasmas', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updatePlasma(
  id: number,
  data: {
    name?: string;
    farmerName?: string;
    address?: string;
    phone?: string;
    capacity?: number;
    unitId?: number;
    isActive?: number;
  },
): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/plasmas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deletePlasma(id: number): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/plasmas/${id}`, {
    method: 'DELETE',
  });
}
