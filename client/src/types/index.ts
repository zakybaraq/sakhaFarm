/**
 * Shared TypeScript interfaces for SakhaFarm client.
 *
 * These types mirror the server API response shapes and provide
 * type safety across the frontend: API client, auth context, and components.
 */

/** User object returned by /api/auth/me — includes roleId and tenantId for permission loading */
export interface User {
  id: string;
  email: string;
  name: string;
  roleId: number;
  tenantId: number;
}

/** Auth context value provided to all children via AuthProvider */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

/** Permission object returned by /api/auth/permissions */
export interface Permission {
  id: number;
  action: string;
  permissionId: number;
  permissionName: string;
  permissionDescription: string;
  permissionCategory: string;
}

/** Response shape from GET /api/auth/me */
export interface MeResponse {
  user: User | null;
  error?: string;
}

/** Response shape from POST /api/auth/login */
export interface LoginResponse {
  success: boolean;
  user: { id: string; email: string; name: string };
}

/** Generic API error response shape */
export interface ApiErrorResponse {
  error?: string;
  code?: string;
  message?: string;
}
