# Phase 8 Review Fix Summary

**Date**: 2026-04-17
**Issues Fixed**: 9 (3 CRITICAL, 5 HIGH, 1 MEDIUM)

---

## CRITICAL Fixes

### C-01: Open Redirect Vulnerability — FIXED
**File**: `client/src/pages/Login.tsx`

Added `sanitizeReturnUrl()` function that validates `returnUrl` query parameter:
- Must start with `/`
- Must not start with `//` (protocol-relative URLs)
- Must not contain `://` (absolute URLs)
- Falls back to `/` for invalid values

Applied to both the `useEffect` redirect and the `handleSubmit` redirect.

### C-02: /register Endpoint Without Rate Limiting — FIXED
**File**: `server/src/modules/auth/auth.controller.ts`

Moved `.use(loginRateLimit)` from after the `/register` route definition to before it. The rate limit middleware now applies to `/register`, `/login`, and all subsequent auth routes.

### C-03: Server Returns HTTP 200 for Auth Failures — FIXED
**File**: `server/src/modules/auth/auth.controller.ts`

All auth-checking endpoints now return proper HTTP status codes:
- `401` for missing/invalid sessions (`Not authenticated`, `Session expired`)
- `403` for forbidden operations (e.g., deleting another user's session without admin rights)

Updated endpoints: `/me`, `/permissions`, `/profile` (GET/PUT), `/change-password`, `/reset-password`, `/sessions` (GET/DELETE), `/sessions/:id` (DELETE).

**File**: `client/src/api/client.ts`

Removed the workaround that checked for `error` fields in 200 responses. The client now handles auth failures via standard HTTP status codes (401/403). Also removed the `ApiError(200, ...)` pattern (L-08 fix).

---

## HIGH Fixes

### H-01: React Render-Side Effect — FIXED
**File**: `client/src/pages/Login.tsx`

Moved the `navigate()` call from render-time to `useEffect`, which is the correct React pattern for side effects. The component still returns `null` when authenticated to prevent UI flash.

### H-02: CSRF Token Handling — FIXED
**File**: `client/src/api/client.ts`

Implemented double-submit cookie pattern for CSRF protection:
- Added `getCsrfToken()` function that reads `csrf_token` from cookies
- All mutating requests (POST, PUT, PATCH, DELETE) now include `X-CSRF-Token` header
- GET/HEAD/OPTIONS requests are excluded from CSRF token attachment

### H-04: Null Division in avgFcr/avgIp — FIXED
**File**: `client/src/hooks/useKpiData.ts`

Changed average calculation to filter out null records before averaging:
- `avgFcr`: filters `r.fcr !== null`, averages only valid records, returns `null` if no valid records
- `avgIp`: filters `r.ip !== null`, averages only valid records, returns `null` if no valid records

Previously, null values were treated as 0 via `?? 0`, which skewed averages downward.

### H-06: Variable Shadowing in /sessions/:id — FIXED
**File**: `server/src/modules/auth/auth.controller.ts`

Renamed local variable from `targetSession` to `userSessions` to avoid shadowing the imported `sessions` table from the schema.

---

## MEDIUM Fixes

### M-02: Empty Catch Block in Layout — FIXED
**File**: `client/src/components/layout/Layout.tsx`

Added a comment explaining why the error is caught but not logged (localStorage unavailable in private mode, quota exceeded, etc.).

### M-01: tenantId=0 Fallback — FIXED
**Files**: `client/src/hooks/useActiveCycles.ts`, `client/src/hooks/useKpiData.ts`

Removed the `?? 0` fallback. Now uses optional chaining with explicit type assertion in queryFn. The `enabled` guard checks both `!!user` and `tenantId !== undefined`, so queries won't run without valid tenantId.

---

## Verification

- `cd client && bun run build` — exits 0 ✅
- LSP diagnostics clean on all modified files ✅