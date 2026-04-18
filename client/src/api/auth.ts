/**
 * Auth API functions for login, logout, and current user retrieval.
 *
 * All calls go through apiClient which includes credentials: 'include'
 * for cookie-based session auth.
 */

import { apiClient, ApiError } from './client';
import type { LoginResponse, MeResponse } from '../types';

/**
 * Authenticates user with email and password.
 * Sets session cookie on success.
 *
 * @param email - User email address
 * @param password - User password
 * @returns Login response with user info
 */
export function login(email: string, password: string): Promise<LoginResponse> {
  return apiClient<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Logs out the current user by invalidating the session.
 * Clears the session cookie on success.
 *
 * @returns Success confirmation
 */
export function logout(): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>('/auth/logout', {
    method: 'POST',
  });
}

/**
 * Gets the currently authenticated user from the session cookie.
 * Returns { user } on success or { error } if not authenticated.
 *
 * @returns MeResponse with user data or error
 */
export async function getCurrentUser(): Promise<MeResponse> {
  try {
    return await apiClient<MeResponse>('/auth/me');
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 401) {
      return { user: null };
    }
    throw err;
  }
}
