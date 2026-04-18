/**
 * API client for audit log endpoints.
 *
 * Provides functions to fetch audit logs with filtering and pagination.
 */

import { apiClient } from './client';

/**
 * Filter parameters for querying audit logs.
 * At least one filter is required by the backend to prevent full-table scans.
 */
export interface AuditFilters {
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Single audit log entry from the API.
 */
export interface AuditLogEntry {
  id: number;
  userId: string;
  action: string;
  resource: string;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  // Joined user info when available
  userName?: string;
  userEmail?: string;
}

/**
 * API response for list endpoint.
 */
export interface AuditLogsResponse {
  logs: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Fetch audit logs with optional filters.
 *
 * @param filters - Filter parameters (at least one required by backend)
 * @returns Paginated audit log entries
 * @throws ApiError if request fails
 */
export async function listAuditLogs(filters: AuditFilters): Promise<AuditLogsResponse> {
  // Build query string from filters
  const params = new URLSearchParams();

  if (filters.userId) params.set('userId', filters.userId);
  if (filters.action) params.set('action', filters.action);
  if (filters.resource) params.set('resource', filters.resource);
  if (filters.resourceId) params.set('resourceId', filters.resourceId);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.offset) params.set('offset', String(filters.offset));

  const queryString = params.toString();
  const endpoint = queryString ? `/audit/logs?${queryString}` : '/audit/logs';

  return apiClient<AuditLogsResponse>(endpoint);
}

/**
 * Fetch a single audit log entry by ID.
 *
 * @param id - Audit log entry ID
 * @returns Single audit log entry
 * @throws ApiError if not found or request fails
 */
export async function getAuditLog(id: number): Promise<{ log: AuditLogEntry }> {
  return apiClient<{ log: AuditLogEntry }>(`/audit/logs/${id}`);
}

/**
 * Common action types for filtering.
 */
export const AUDIT_ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGIN_FAILED',
  'LOGOUT',
  'EXPORT',
  'IMPORT',
] as const;

/**
 * Common resource types for filtering.
 */
export const AUDIT_RESOURCES = [
  'User',
  'Role',
  'Permission',
  'Unit',
  'Plasma',
  'Cycle',
  'Recording',
  'FeedProduct',
  'FeedStock',
  'SuratJalan',
  'Session',
] as const;
