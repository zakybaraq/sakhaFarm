# Phase 3 Code Review — Fix Summary

**Date**: 2026-04-17
**Scope**: Critical and High severity findings from 03-REVIEW.md

---

## Fixes Applied

### 🔴 CRITICAL

#### C-01: User Management Endpoints Unauthenticated — FIXED
**Files**: `server/src/modules/users/users.controller.ts`, `server/src/plugins/rbac.ts`

- Added `beforeHandle: requirePermission(...)` guards to all 9 user management routes:
  - `POST /` → `users.create`
  - `GET /` → `users.read`
  - `GET /search` → `users.read`
  - `GET /:id` → `users.read`
  - `PUT /:id` → `users.update`
  - `PATCH /:id/deactivate` → `users.update`
  - `PATCH /:id/activate` → `users.update`
  - `POST /:id/reset-password` → `users.reset-password`
  - `POST /import` → `users.create`
- Removed manual session validation from reset-password endpoint (now handled by `requirePermission`)
- Simplified `resetPassword` service function signature (removed `adminUserId` param)

#### C-02: listRoles(null) Returns All Roles — FIXED
**Files**: `server/src/modules/rbac/rbac.service.ts`, `server/src/modules/rbac/rbac.controller.ts`

- `listRoles()` now throws an error when `tenantId` is null — never returns unscoped data
- Controller validates `tenantId` is present and returns 400 if missing
- Made `tenantId` a required query parameter in the RBAC controller schema
- Added `ne(roles.isDefault, -1)` filter to `listRoles` to also exclude soft-deleted roles

#### C-03: Soft-Deleted Roles Not Filtered — FIXED
**Files**: `server/src/modules/rbac/rbac.service.ts`, `server/src/modules/users/users.service.ts`

- `getRole()` now filters `isDefault != -1` — soft-deleted roles return undefined
- `listRoles()` now filters `isDefault != -1`
- `deleteRole()` already calls `getRole()` so it now rejects soft-deleted roles
- `assignPermission()` already calls `getRole()` so it now rejects soft-deleted roles
- `removePermission()` now calls `getRole()` to verify role exists and isn't soft-deleted
- `createUser()` role validation now filters `isDefault != -1`
- `updateUser()` role validation now filters `isDefault != -1`

#### C-04: Update User Email Check Bug — FIXED
**File**: `server/src/modules/users/users.service.ts`

- Changed `eq(users.id, id)` to `ne(users.id, id)` in the duplicate email check
- Added `ne` to the drizzle-orm import

#### C-05: resetPassword Hardcodes Role Check — FIXED
**Files**: `server/src/modules/users/users.service.ts`, `server/src/modules/users/users.controller.ts`

- Removed hardcoded `roleId !== 1` check from `resetPassword` service function
- Removed `adminUserId` parameter — authorization now handled by `requirePermission('users.reset-password')` in the controller
- Simplified the controller handler (removed manual session validation)

---

### 🟠 HIGH

#### H-01: RBAC Error Handler Missing HTTP Status Codes — FIXED
**File**: `server/src/modules/rbac/rbac.controller.ts`

- `RoleHasUsersError` → 409 Conflict
- `DefaultRoleError` → 403 Forbidden
- `PermissionAssignmentError` → 409 Conflict
- Permission denied → 403 Forbidden (already had status, now explicit)
- Added `set` parameter to `onError` handler

#### H-02: updateRole Doesn't Protect Default/System Roles — FIXED
**File**: `server/src/modules/rbac/rbac.service.ts`

- Added `isDefault === 1` check to `updateRole()` — throws `DefaultRoleError` if role is a default/system role
- Also added soft-deleted role check (calls `getRole()` which filters `isDefault = -1`)

#### H-03: requirePermission Doesn't Check User Active Status — FIXED
**File**: `server/src/plugins/rbac.ts`

- Added `user.isActive !== 1` check — returns 403 with "Account is deactivated" if user is inactive
- Reordered checks: first verify user exists (401), then check active status (403), then check super admin bypass, then check permissions

#### H-05: createUser Password Validation Throws Generic Error — FIXED
**Files**: `server/src/modules/users/users.errors.ts`, `server/src/modules/users/users.service.ts`, `server/src/modules/users/users.controller.ts`

- Created `WeakPasswordError` class extending `Error`
- Changed `throw new Error(passwordError)` to `throw new WeakPasswordError(passwordError)`
- Added `WeakPasswordError` handler in `handleUserError` with code `WEAK_PASSWORD`

#### H-06: listUsers/searchUsers Filters Mutually Exclusive — FIXED
**File**: `server/src/modules/users/users.service.ts`

- Changed `else if` chains to independent `if` statements in both `listUsers` and `searchUsers`
- Filters are now combinable: `?name=John&status=active` applies both filters

#### H-07: createUser Doesn't Validate tenantId — FIXED
**Files**: `server/src/modules/users/users.errors.ts`, `server/src/modules/users/users.service.ts`, `server/src/modules/users/users.controller.ts`

- Created `InvalidTenantError` class extending `Error`
- Added tenant existence check in `createUser()` before user creation
- Added `InvalidTenantError` handler in `handleUserError` with code `INVALID_TENANT`

#### H-08: RBAC Permission Assignment Uses rbac.create — FIXED
**File**: `server/src/modules/rbac/rbac.controller.ts`

- Changed `POST /roles/:id/permissions` from `requirePermission('rbac.create')` to `requirePermission('rbac.assign')`
- Permission assignment is now a distinct privilege from role/permission creation

---

### Additional Fixes

#### L-01: Unused Import drizzleEq — FIXED
**File**: `server/src/modules/rbac/rbac.service.ts`

- Removed unused `eq as drizzleEq` import
- Added `ne` import (needed for soft-delete filtering)

#### M-02: Email Column Lacks Unique Constraint — FIXED
**File**: `server/src/db/schema/users.ts`

- Changed `index('idx_users_email')` to `unique('uq_users_email')` on the email column
- Added `unique` import from `drizzle-orm/mysql-core`

#### getRole 404 Status — FIXED
**File**: `server/src/modules/rbac/rbac.controller.ts`

- Added `set.status = 404` when role is not found in `GET /roles/:id`

---

## Files Modified

| File | Changes |
|------|---------|
| `server/src/modules/users/users.controller.ts` | Added requirePermission guards, WeakPasswordError/InvalidTenantError handling, simplified reset-password |
| `server/src/modules/users/users.service.ts` | Fixed email check (ne), combinable filters, tenant validation, WeakPasswordError, soft-delete role filter, removed hardcoded role check |
| `server/src/modules/users/users.errors.ts` | Added WeakPasswordError, InvalidTenantError classes |
| `server/src/modules/rbac/rbac.controller.ts` | HTTP status codes in errors, rbac.assign permission, required tenantId, 404 for role not found |
| `server/src/modules/rbac/rbac.service.ts` | listRoles requires tenantId, soft-delete filtering, updateRole protects defaults, removePermission checks role, removed drizzleEq |
| `server/src/plugins/rbac.ts` | Active user check, reordered auth flow |
| `server/src/db/schema/users.ts` | Unique constraint on email |

## Verification

- All modified files pass `lsp_diagnostics` with zero errors
- TypeScript compilation shows only pre-existing errors in unrelated modules (auth, cycle, recordings, tenant)
- No new TypeScript errors introduced by these changes

## Not Fixed (Deferred)

| Finding | Reason |
|---------|--------|
| M-01: isDefault overloaded for soft-delete | Requires schema migration with `deletedAt` column — deferred to avoid breaking changes |
| M-03: action field lacks enum constraint | Requires DB migration — deferred |
| M-04: ARGON2_OPTIONS duplicated | Low priority cosmetic issue |
| M-05: No caching for permission lookups | Performance optimization — deferred |
| M-06: ctx: any type in requirePermission | Type improvement — deferred |
| M-07: CSV parser doesn't handle quoted fields | Requires adding a dependency — deferred |
| M-08: Search wildcard injection | Low severity — deferred |
| M-09: deactivateUser/activateUser don't check state | Low severity — deferred |
| M-10: parseInt without NaN guard | Low severity — deferred |
| L-02: Custom errors missing Object.setPrototypeOf | Low severity — deferred |
| L-03: permissions table missing updatedAt | Schema enhancement — deferred |
| L-04: description field nullable mismatch | Schema alignment — deferred |
| L-05: No rate limiting on CSV import | Infrastructure concern — deferred |
| L-06: CSV import doesn't validate email format | Low severity — deferred |
| L-07: rbacPlugin is empty | Architectural — deferred |
| L-08: resetPassword returns plaintext temp password | Security design decision — deferred |
| H-04: requirePermission only supports 'allow' action | Design decision — deny override requires spec clarification |