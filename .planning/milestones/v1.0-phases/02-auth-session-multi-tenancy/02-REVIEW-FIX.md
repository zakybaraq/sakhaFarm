# Phase 2 Code Review — Fix Summary

**Date**: 2026-04-17
**Scope**: Critical and High severity findings from 02-REVIEW.md

---

## Fixes Applied

### 🔴 CRITICAL

#### C-01: Unauthenticated session deletion endpoint
**File**: `auth.controller.ts`
**Fix**: Added session validation and ownership verification to `DELETE /sessions/:id`. The endpoint now requires authentication, validates the session, and checks that the requesting user owns the target session or is a Super Admin before allowing deletion.
**Imports added**: `sessions` from schema, `SUPER_ADMIN_ROLE_ID` from constants.

#### C-02: Insecure temporary password generation using `Math.random()`
**File**: `auth.service.ts`
**Fix**: Removed the local insecure `generateTempPassword()` function that used `Math.random()`. Now imports the cryptographically secure `generateTempPassword` from `lib/password.ts` which uses `oslo/crypto`'s `generateRandomInteger`.

#### C-03: Admin password reset returns temporary password in API response
**File**: `auth.controller.ts`
**Fix**: Removed `tempPassword` from the `/reset-password` response. The endpoint now returns `{ success: true }` only. The temp password is still generated and set for the user, but is no longer exposed in the HTTP response.

#### C-04: Missing RBAC enforcement on admin reset-password endpoint
**File**: `auth.controller.ts`, `auth.service.ts`
**Fix**: Added `beforeHandle: requirePermission('users.reset-password')` guard to the `/reset-password` route. Also minimized the admin query in `adminResetPassword` to only select `roleId` instead of the full user record (including `passwordHash`).

---

### 🟠 HIGH

#### H-01: Duplicate `validatePasswordStrength` — `PASSWORD_REGEX` undefined
**File**: `auth.service.ts`
**Fix**: Removed the local `validatePasswordStrength` that referenced undefined `PASSWORD_REGEX`. Now imports `validatePasswordStrength` from `lib/password.ts`. Adapted callers (`registerUser`, `changePassword`) to handle the `string | null` return type — checking for non-null error message and throwing.

#### H-02: Brute-force lock counter race condition
**File**: `auth.service.ts`
**Fix**: 
- Replaced separate `redis.incr()` + `redis.expire()` calls with `redis.pipeline()` for atomic execution, preventing the window where a key persists without TTL.
- Replaced read-then-write DB counter (`(user.failedLoginAttempts || 0) + 1`) with SQL increment `sql\`${users.failedLoginAttempts} + 1\`` using Drizzle's `sql` template, eliminating the TOCTOU race condition.
- Used `BRUTE_FORCE.MAX_ATTEMPTS` constant instead of hardcoded `5`.
- Also fixed M-04: Changed account lockout error messages from "Account temporarily locked..." and "Account is locked..." to generic "Invalid email or password" to prevent account enumeration.

#### H-03: Login rate limit bypass via IP spoofing
**Files**: `rate-limit.ts`, `auth.controller.ts`, `env.ts`
**Fix**: 
- Created a `getClientIp()` function in `rate-limit.ts` that uses the **rightmost** value from `X-Forwarded-For` (set by trusted proxy) instead of the leftmost (spoofable by clients).
- Added `TRUST_PROXY` environment variable (`'true'`/`'false'`, default `'false'`) to `env.ts`. When `TRUST_PROXY` is not `'true'`, header-based IP extraction is disabled and falls back to `'unknown'`.
- Updated the inline login rate limiter in `auth.controller.ts` to use the same trusted-proxy logic.

#### H-04: Tenant plugin doesn't enforce user-tenant matching
**File**: `tenant.ts`
**Fix**: Added a check after the Super Admin bypass: if a non-admin user's `tenantId` doesn't match the `X-Tenant-ID` header, the plugin returns `{ tenantId: null, tenantError: 'Tenant access denied' }`, preventing cross-tenant access.

#### H-05: No password minimum length validation in controller schema
**File**: `auth.controller.ts`
**Fix**: Added `minLength: 8` to all password fields in request schemas:
- `/register` → `password: t.String({ minLength: 8 })`
- `/login` → `password: t.String({ minLength: 8 })`
- `/change-password` → `newPassword: t.String({ minLength: 8 })`

#### H-06: Session cookie not set with `httpOnly` flag
**File**: `lucia.ts`
**Fix**: Added `httpOnly: true` to the session cookie attributes in the Lucia configuration, preventing JavaScript access to the session cookie via `document.cookie`.

---

## Files Modified

| File | Changes |
|------|---------|
| `server/src/modules/auth/auth.controller.ts` | C-01, C-03, C-04, H-03, H-05 |
| `server/src/modules/auth/auth.service.ts` | C-02, H-01, H-02, M-04 |
| `server/src/plugins/rate-limit.ts` | H-03 |
| `server/src/plugins/tenant.ts` | H-04 |
| `server/src/auth/lucia.ts` | H-06 |
| `server/src/config/env.ts` | H-03 (TRUST_PROXY) |

## Verification

- All modified files pass `lsp_diagnostics` with zero errors
- No new imports reference undefined modules
- All changes are atomic and backward-compatible (TRUST_PROXY defaults to 'false')