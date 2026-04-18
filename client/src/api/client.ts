/**
 * Typed fetch wrapper for SakhaFarm API calls.
 *
 * All requests include credentials: 'include' for cookie-based auth.
 * CSRF protection uses the double-submit cookie pattern:
 * a csrf_token cookie is read and sent as X-CSRF-Token header
 * on all mutating requests (POST, PUT, PATCH, DELETE).
 */

/** Custom error class for API responses with status codes */
export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/** Read the CSRF token from the csrf_token cookie (double-submit pattern). */
function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Typed fetch wrapper that handles auth errors and response parsing.
 *
 * @param endpoint - API path relative to API_BASE (e.g., '/auth/me')
 * @param options - Standard fetch options (method, body, headers, etc.)
 * @returns Parsed JSON response typed as T
 * @throws ApiError on non-2xx responses
 */
export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const method = (options?.method ?? 'GET').toUpperCase();
  const isMutating = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(isMutating ? { 'X-CSRF-Token': getCsrfToken() ?? '' } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (response.status === 403) {
    throw new ApiError(403, 'Forbidden');
  }

  // Non-2xx status — parse error body and throw ApiError
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Network error' }));
    throw new ApiError(
      response.status,
      errorBody.error || errorBody.message || errorBody.code || 'Unknown error',
      errorBody.code,
    );
  }

  // 2xx response — parse JSON and check for error field
  const data = await response.json();

  if (data.error) {
    throw new ApiError(response.status, data.error, data.code);
  }

  return data as T;
}
