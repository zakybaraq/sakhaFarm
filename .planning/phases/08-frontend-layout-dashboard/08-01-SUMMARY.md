# 08-01-SUMMARY.md — Auth & API Foundation Layer

**Phase:** 08-frontend-layout-dashboard  
**Plan:** 01 (Wave 1)  
**Status:** ✅ Complete  
**Date:** 2026-04-17

---

## What Was Done

### Task 1: TypeScript Types & API Client

**Created files:**

- `client/src/types/index.ts` — Shared TypeScript interfaces: `User`, `AuthState`, `Permission`, `MeResponse`, `LoginResponse`, `ApiErrorResponse`
- `client/src/api/client.ts` — Typed fetch wrapper with `apiClient<T>()` and `ApiError` class. Handles:
  - `credentials: 'include'` on all requests (cookie-based auth per D-03)
  - `API_BASE` defaults to `/api` (relative path for Vite proxy per D-05)
  - HTTP 401 → redirect to `/login`
  - HTTP 200 with `{ error }` field → auth failure detection (server returns 200 with error for unauthenticated sessions)
  - Non-2xx → `ApiError` with status and code
- `client/src/api/auth.ts` — Auth API functions: `login()`, `logout()`, `getCurrentUser()`
- `client/src/api/rbac.ts` — RBAC API function: `getUserPermissions()` calling `/auth/permissions` (not `/rbac/permissions` which requires `rbac.read`)
- `client/src/vite-env.d.ts` — Vite client type reference for `import.meta.env`

### Task 2: Server-Side Enhancements

**Modified file:** `server/src/modules/auth/auth.controller.ts`

1. **Extended `/api/auth/me`** — Now returns `{ user: { id, email, name, roleId, tenantId } }` (added `roleId` and `tenantId`)
2. **Added `/api/auth/permissions`** — New endpoint that returns the authenticated user's permissions based on their `roleId`, without requiring `rbac.read` permission. Uses `getRolePermissions()` from rbac service.
3. **Added import** — `getRolePermissions` from `../rbac/rbac.service`

### Task 3: AuthContext & RequireAuth

**Created files:**

- `client/src/contexts/AuthContext.tsx` — `AuthProvider` and `useAuth()` hook:
  - Uses TanStack Query `useQuery` for session check (`retry: false` prevents infinite loops)
  - Loads permissions via `getUserPermissions()` on auth
  - `login()` and `logout()` via `useMutation`
  - Provider order: StrictMode > BrowserRouter > QueryClientProvider > ThemeProvider > CssBaseline > AuthProvider > App
- `client/src/hooks/useAuth.ts` — Convenience re-export from AuthContext
- `client/src/components/RequireAuth.tsx` — Route guard:
  - Shows `CircularProgress` while loading
  - Redirects to `/login?returnUrl=...` when not authenticated
  - Optional `requiredPermission` prop for permission-based guards

**Modified file:** `client/src/main.tsx` — Added `AuthProvider` wrapping `<App />`

---

## Verification Results

| Check | Result |
|-------|--------|
| TypeScript compilation (`cd client && bun run build`) | ✅ Exit 0 |
| Server type-check (auth.controller.ts) | ✅ No diagnostics |
| Client LSP diagnostics (all new files) | ✅ No diagnostics |
| `/api/auth/me` returns `roleId` and `tenantId` | ✅ Verified in code |
| `/api/auth/permissions` endpoint exists | ✅ Verified in code |
| `credentials: 'include'` on all API calls | ✅ Verified |
| `retry: false` on auth query | ✅ Verified |
| AuthProvider in provider stack | ✅ Verified |

---

## Key Design Decisions

1. **API_BASE = `/api`** (relative path) — Vite proxy handles cookies in dev, no CORS issues
2. **200-with-error detection** — Server returns HTTP 200 with `{ error: 'Not authenticated' }` instead of 401; client checks for `error` field
3. **`/auth/permissions` not `/rbac/permissions`** — Regular users don't have `rbac.read`; new endpoint uses user's own `roleId`
4. **`retry: false`** on auth query — Prevents infinite retry loops on unauthenticated sessions
5. **AuthProvider inside QueryClientProvider** — Auth context uses TanStack Query hooks, so it must be nested inside

---

## Files Modified/Created

| File | Action |
|------|--------|
| `client/src/types/index.ts` | Created |
| `client/src/api/client.ts` | Created |
| `client/src/api/auth.ts` | Created |
| `client/src/api/rbac.ts` | Created |
| `client/src/vite-env.d.ts` | Created |
| `client/src/contexts/AuthContext.tsx` | Created |
| `client/src/hooks/useAuth.ts` | Created |
| `client/src/components/RequireAuth.tsx` | Created |
| `client/src/main.tsx` | Modified (added AuthProvider) |
| `server/src/modules/auth/auth.controller.ts` | Modified (extended /me, added /permissions) |