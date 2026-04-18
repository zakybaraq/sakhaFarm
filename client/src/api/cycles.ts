/**
 * API client for chicken growing cycle management.
 *
 * Tracks each chicken batch from chick-in to harvest.
 * A cycle represents one growing period for one plasma unit.
 */

import { apiClient } from './client';

/** Growing cycle representing one chicken batch. */
export interface Cycle {
  id: number;
  plasmaId: number;
  cycleNumber: number;
  docType: string;
  chickInDate: string;
  initialPopulation: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** API response containing cycles list. */
export interface CyclesResponse {
  cycles: Cycle[];
}

/**
 * List all cycles for the current tenant.
 * Used in cycle management page to show all historical cycles.
 *
 * @returns All cycles (active and closed)
 * @throws ApiError if request fails
 */
export function listCycles(): Promise<CyclesResponse> {
  return apiClient<CyclesResponse>('/cycles');
}

/**
 * List only active cycles for a tenant.
 * Used in daily recording forms — only active cycles accept weight/feed data.
 *
 * @param tenantId - Tenant ID to filter by
 * @returns Active cycles only (status = 'active')
 * @throws ApiError if tenant not found
 */
export function listActiveCycles(tenantId: number): Promise<CyclesResponse> {
  return apiClient<CyclesResponse>(`/cycles?status=active&tenantId=${tenantId}`);
}

/**
 * Start a new growing cycle.
 * Creates a new batch with initial population — triggers cycleNumber auto-increment.
 *
 * @param data - Plasma, document type, chick-in date, and initial bird count
 * @returns Created cycle with server-assigned ID and cycle number
 * @throws ApiError if plasma not found or cycleNumber collision
 */
export function createCycle(data: {
  plasmaId: number;
  docType: string;
  chickInDate: string;
  initialPopulation: number;
}): Promise<{ success: boolean; cycle: Cycle }> {
  return apiClient<{ success: boolean; cycle: Cycle }>('/cycles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update cycle details.
 * Used to correct data entry errors or manually close a cycle.
 * Setting status to 'closed' ends daily recording for that cycle.
 *
 * @param cycleId - Cycle ID to update
 * @param data - Fields to update (any combination allowed)
 * @throws ApiError if cycle not found or status transition invalid
 */
export function updateCycle(
  id: number,
  data: {
    docType?: string;
    chickInDate?: string;
    initialPopulation?: number;
    status?: string;
    isDeleted?: boolean;
    cycleNumber?: number;
  },
): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/cycles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Soft-delete a cycle (marks as deleted in DB).
 * Prefer using updateCycle to close cycle instead of deleting.
 * Deleted cycles are hidden from UI but retained for audit.
 *
 * @param cycleId - Cycle ID to delete
 * @throws ApiError if cycle not found
 */
export function deleteCycle(id: number): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/cycles/${id}`, {
    method: 'DELETE',
  });
}
