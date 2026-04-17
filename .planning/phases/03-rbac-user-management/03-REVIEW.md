# Phase 3 Code Review — RBAC Manager & User Management

**Reviewer**: Automated Code Review  
**Date**: 2026-04-17  
**Scope**: Phase 3.01 (RBAC), 3.02 (Users), 3.03 (Wiring)  
**Files Reviewed**: 10 source files across RBAC, Users, and Plugins

---

## Summary

Phase 3 introduces RBAC and User Management with functional CRUD operations, permission assignment, and CSV import. The architecture is sound, but there are **5 critical security vulnerabilities** that must be addressed before production, along with several high-severity logic errors and medium-severity quality issues.

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 5 |
| 🟠 HIGH | 8 |
| 🟡 MEDIUM | 10 |
| 🔵 LOW | 8 |

---

## 🔴 CRITICAL Findings

### C-01: User Management Endpoints Lack Authentication/Authorization

**File**: `server/src/modules/users/users.controller.ts`  
**Lines**: All routes (39–217)

Every single user management endpoint — create, list, search, get, update, deactivate, activate, reset-password, and CSV import — has **no `beforeHandle` guard**. Compare this to the RBAC controller which uses `requirePermission('rbac.read')` etc. on every route.

```typescript
// users.controller.ts — NO auth on ANY route
.post('/', async ({ body }) => { ... })       // anyone can create users
.get('/', async ({ query }) => { ... })        // anyone can list all users
.get('/search', async ({ query }) => { ... })  // anyone can search users
```

**Impact**: Any unauthenticated request can enumerate all users, create new admin users, deactivate existing users, or reset passwords.

**Fix**: Add `beforeHandle: requirePermission('users.create')` (and equivalent) to every route.

---

### C-02: `listRoles(null)` Returns All Roles Across All Tenants

**File**: `server/src/modules/rbac/rbac.service.ts`  
**Lines**: 31–36

```typescript
export async function listRoles(tenantId: number | null) {
  if (tenantId !== null) {
    return await db.select().from(roles).where(eq(roles.tenantId, tenantId))
  }
  return await db.select().from(roles)  // Returns ALL roles from ALL tenants
}
```

When `tenantId` is null (which happens when the query param is omitted), it returns every role in the system including roles from other tenants. This is a **tenant isolation breach**.

**Impact**: A tenant admin can see system-level roles and roles belonging to other tenants.

**Fix**: Always require a tenant context. If the user is a super admin, explicitly pass a system flag. Never return unscoped data.

---

### C-03: Soft-Deleted Roles Are Not Filtered from Queries

**File**: `server/src/modules/rbac/rbac.service.ts`  
**Lines**: 44–47, 31–36

`deleteRole` performs a soft-delete by setting `isDefault = -1`, but `getRole`, `listRoles`, and `getRolePermissions` do not filter out records where `isDefault = -1`. "Deleted" roles still appear in listings, can be retrieved by ID, and can have permissions assigned to them.

```typescript
// deleteRole sets isDefault = -1
await db.update(roles).set({ isDefault: -1 }).where(eq(roles.id, id))

// But getRole doesn't exclude soft-deleted roles
export async function getRole(id: number) {
  const result = await db.select().from(roles).where(eq(roles.id, id)).limit(1)
  return result[0]  // Returns soft-deleted role!
}
```

**Impact**: Deleted roles remain fully operational. Users can assign permissions to deleted roles, and deleted roles appear in role listings.

**Fix**: Add `where(eq(roles.isDefault, '!=', -1))` or better yet, add a proper `deletedAt` timestamp column and filter on it.

---

### C-04: `updateUser` Duplicate Email Check Is Inverted

**File**: `server/src/modules/users/users.service.ts`  
**Lines**: 211–220

```typescript
if (input.email) {
  const normalizedEmail = input.email.toLowerCase()
  const duplicateCheck = await db
    .select()
    .from(users)
    .where(and(eq(users.email, normalizedEmail), eq(users.id, id)))
  //                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // This finds the USER THEMSELVES, not other users with the same email!

  if (duplicateCheck.length > 0) {
    throw new DuplicateEmailError(normalizedEmail)
  }
}
```

The query uses `AND id = id` (the same user), so it always finds the current user and throws `DuplicateEmailError` — **preventing any user from keeping their own email during an update**. The correct check should be `id != id` (find OTHER users with the same email).

**Impact**: Any user update that includes the user's current email will fail with a "duplicate email" error. This effectively breaks email updates entirely.

**Fix**: Change to `ne(users.id, id)`:
```typescript
import { ne } from 'drizzle-orm'
const duplicateCheck = await db
  .select()
  .from(users)
  .where(and(eq(users.email, normalizedEmail), ne(users.id, id)))
```

---

### C-05: `resetPassword` Uses Hardcoded Role ID Check Bypassing RBAC

**File**: `server/src/modules/users/users.service.ts`  
**Lines**: 272–276

```typescript
export async function resetPassword(userId: string, adminUserId: string) {
  const admin = await db.select().from(users).where(eq(users.id, adminUserId)).limit(1)
  if (admin.length === 0 || admin[0].roleId !== 1) {
    throw new Error('Only Super Admin can reset passwords')
  }
```

This hardcodes `roleId !== 1` instead of using the RBAC permission system. If the Super Admin role ID ever changes, this check silently breaks. It also doesn't verify the admin user is active.

**Impact**: Authorization bypass if role IDs change; dead code path if Super Admin role is renumbered.

**Fix**: Use `requirePermission('users.reset-password')` in the controller and remove the hardcoded role check from the service.

---

## 🟠 HIGH Findings

### H-01: RBAC Error Handler Missing HTTP Status Codes

**File**: `server/src/modules/rbac/rbac.controller.ts`  
**Lines**: 20–33

The `onError` handler returns error objects but never sets `ctx.set.status`. All custom errors return HTTP 200 by default, which is incorrect:
- `RoleHasUsersError` → should be 409 Conflict
- `DefaultRoleError` → should be 403 Forbidden
- `PermissionAssignmentError` → should be 409 Conflict
- Permission denied → should be 403 (partially handled)

**Fix**: Set appropriate status codes in the error handler:
```typescript
if (error instanceof RoleHasUsersError) {
  ctx.set.status = 409
  return { error: error.message, type: 'RoleHasUsersError' }
}
```

---

### H-02: `updateRole` Doesn't Protect Default/System Roles

**File**: `server/src/modules/rbac/rbac.service.ts`  
**Lines**: 57–64

`deleteRole` checks `isDefault === 1` and throws `DefaultRoleError`, but `updateRole` has **no such check**. A user with `rbac.update` permission can rename "Super Admin" to anything they want.

**Fix**: Add the same `isDefault` check to `updateRole`.

---

### H-03: `requirePermission` Doesn't Check User Active Status

**File**: `server/src/plugins/rbac.ts`  
**Lines**: 7–38

The permission check verifies role permissions but never checks if the user's account is active (`isActive`). A deactivated user with a valid (non-expired) session token can still access all protected routes.

**Fix**: Add `user.isActive !== 1` check and return 403 if inactive.

---

### H-04: `requirePermission` Only Supports `allow` Action — No `deny` Override

**File**: `server/src/plugins/rbac.ts`  
**Lines**: 24–31

```typescript
.where(
  and(
    eq(rolePermissions.roleId, user.roleId),
    eq(permissions.name, requiredPermission),
    eq(rolePermissions.action, 'allow')  // Only checks 'allow'
  )
)
```

The `role_permissions` table supports an `action` field (varchar(10)) that can be "allow" or "deny", but the permission check only looks for `action = 'allow'`. If a role has both `allow` and `deny` for the same permission, the `allow` wins because `deny` is never evaluated.

**Fix**: Either remove the `deny` concept entirely (simpler) or implement proper deny-override logic (check for deny first, then allow).

---

### H-05: `createUser` Password Validation Throws Generic Error

**File**: `server/src/modules/users/users.service.ts`  
**Lines**: 83–86

```typescript
const passwordError = validatePasswordStrength(input.password)
if (passwordError) {
  throw new Error(passwordError)  // Generic Error, not a domain error
}
```

The controller's `handleUserError` won't catch this with a specific code — it falls through to the generic `Error` handler and returns `{ error: message }` without a structured code. This makes it hard for clients to programmatically handle weak password errors.

**Fix**: Create a `WeakPasswordError` class and handle it in the controller.

---

### H-06: `listUsers` and `searchUsers` Filters Are Mutually Exclusive (else-if Chain)

**File**: `server/src/modules/users/users.service.ts`  
**Lines**: 112–129, 311–319

```typescript
if (filters.name) {
  // ...
} else if (filters.email) {    // ← else-if means only ONE filter applies
  // ...
} else if (filters.roleId !== undefined) {
  // ...
} else if (filters.tenantId !== undefined) {
  // ...
} else if (filters.status === 'active') {
  // ...
}
```

The `else if` chain means only the **first matching** filter is applied. If a client sends `?name=John&status=active`, only the `name` filter is used and `status` is silently ignored. This is almost certainly a bug — filters should be combinable.

**Fix**: Change `else if` to independent `if` statements and push all conditions into the `conditions` array.

---

### H-07: `createUser` Doesn't Validate `tenantId` Exists

**File**: `server/src/modules/users/users.service.ts`  
**Lines**: 70–104

`createUser` validates that `roleId` exists but does **not** validate that `tenantId` exists. A user could be created with a non-existent tenant ID. While the foreign key constraint would cause a database error, it won't be a user-friendly error.

**Fix**: Add a tenant existence check similar to the role check.

---

### H-08: RBAC Permission Assignment Uses `rbac.create` Permission

**File**: `server/src/modules/rbac/rbac.controller.ts`  
**Lines**: 150–170

The `POST /roles/:id/permissions` endpoint (assign permission to role) uses `requirePermission('rbac.create')`. This is the same permission as creating new roles and permissions. Permission assignment is a distinct privilege — someone who can create roles shouldn't necessarily be able to assign permissions to them.

**Fix**: Create a separate `rbac.assign` permission for role-permission assignment.

---

## 🟡 MEDIUM Findings

### M-01: `isDefault` Field Overloaded for Soft-Delete

**File**: `server/src/db/schema/roles.ts`  
**Lines**: 22

The `isDefault` field serves triple duty: `0` = normal, `1` = default, `-1` = soft-deleted. This is confusing and error-prone. A separate `deletedAt` timestamp column would be clearer and enable proper soft-delete filtering.

---

### M-02: `email` Column Lacks Unique Constraint

**File**: `server/src/db/schema/users.ts`  
**Lines**: 37

The `email` column only has an index (`idx_users_email`), not a unique constraint. The application-level duplicate check in `createUser` is subject to race conditions — two concurrent requests could both pass the check and insert duplicate emails.

**Fix**: Add `.unique()` to the email column or add a unique index.

---

### M-03: `action` Field on `role_permissions` Has No Enum Constraint

**File**: `server/src/db/schema/role_permissions.ts`  
**Lines**: 22

The `action` field is `varchar(10)` with no constraint on valid values. Any string up to 10 characters can be stored. Should be restricted to `'allow'` or `'deny'` at the database level.

**Fix**: Use a MySQL ENUM type or add a CHECK constraint.

---

### M-04: `ARGON2_OPTIONS` Duplicated Between Service and Constants

**File**: `server/src/modules/users/users.service.ts`  
**Lines**: 16–21 vs `server/src/lib/constants.ts`  
**Lines**: 2–7

The Argon2 options object is defined identically in both files. The service should import from `constants.ts`.

---

### M-05: No Caching for Permission Lookups

**File**: `server/src/plugins/rbac.ts`  
**Lines**: 20–31

Every request to a protected route hits the database for a permission check. For high-traffic applications, this will become a bottleneck.

**Fix**: Consider caching permissions per role with a TTL, invalidating on role-permission changes.

---

### M-06: `ctx: any` Type in `requirePermission`

**File**: `server/src/plugins/rbac.ts`  
**Line**: 8

```typescript
return async (ctx: any) => {
```

Using `any` bypasses TypeScript's type safety. Should use Elysia's proper context type.

---

### M-07: CSV Import Doesn't Handle Quoted Fields

**File**: `server/src/modules/users/users.service.ts`  
**Lines**: 362–416

The CSV parser uses `lines[i].split(',')` which breaks on commas inside quoted fields (e.g., `"Doe, John"`). This will silently produce malformed data.

**Fix**: Use a proper CSV parser library (e.g., `papaparse` or `csv-parse`).

---

### M-08: Search Wildcard Injection

**File**: `server/src/modules/users/users.service.ts`  
**Lines**: 302, 114–117

```typescript
const searchPattern = `%${query}%`
```

While SQL injection is prevented by parameterized queries, users can inject SQL `LIKE` wildcards (`%` and `_`) to broaden searches beyond intended scope. A search for `%` would match all records.

**Fix**: Escape `%` and `_` characters in the search query before wrapping with wildcards.

---

### M-09: `deactivateUser`/`activateUser` Don't Check Current State

**File**: `server/src/modules/users/users.service.ts`  
**Lines**: 243–267

Both functions unconditionally set `isActive` without checking if the user is already in that state. This means deactivating an already-deactivated user still returns `{ success: true }` and invalidates sessions again.

**Fix**: Check current state first and return appropriate response if no change needed.

---

### M-10: `parseInt` on Query Params Without NaN Guard

**File**: `server/src/modules/rbac/rbac.controller.ts`  
**Lines**: 50

```typescript
const tenantId = query.tenantId ? parseInt(query.tenantId, 10) : null
```

If `query.tenantId` is a non-numeric string, `parseInt` returns `NaN`, which would cause unexpected query behavior. Same issue in `users.controller.ts` lines 66–67.

---

## 🔵 LOW Findings

### L-01: Unused Import `drizzleEq`

**File**: `server/src/modules/rbac/rbac.service.ts`  
**Line**: 3

```typescript
import { eq, and, eq as drizzleEq } from 'drizzle-orm'
```

`drizzleEq` is imported but never used.

---

### L-02: Custom Error Classes Missing `Object.setPrototypeOf`

**Files**: `rbac.errors.ts`, `users.errors.ts`

Custom error classes extending `Error` should call `Object.setPrototypeOf(this, new.target.prototype)` in their constructors for proper `instanceof` behavior in some TypeScript/bundler configurations.

---

### L-03: `permissions` Table Missing `updatedAt` Column

**File**: `server/src/db/schema/permissions.ts`

Permissions can be updated via `updatePermission` but there's no `updatedAt` timestamp to track when changes were made.

---

### L-04: `description` Field Nullable Mismatch

**File**: `server/src/modules/rbac/rbac.controller.ts`  
**Lines**: 44, 84

The controller requires `description: t.String()` (non-empty), but the DB schema has `description: text('description')` which is nullable in MySQL. This could cause unexpected validation vs. DB constraint mismatches.

---

### L-05: No Rate Limiting on CSV Import

**File**: `server/src/modules/users/users.controller.ts`  
**Lines**: 201–217

The `/import` endpoint allows bulk user creation without rate limiting. An attacker could flood the system with user records.

---

### L-06: CSV Import Doesn't Validate Email Format Per Row

**File**: `server/src/modules/users/users.service.ts`  
**Lines**: 384

The CSV import only checks for empty fields but doesn't validate email format before passing to `createUser`. Invalid emails will cause database-level errors rather than friendly CSV row errors.

---

### L-07: `rbacPlugin` Is Declared But Empty

**File**: `server/src/plugins/rbac.ts`  
**Line**: 40

```typescript
export const rbacPlugin = new Elysia({ name: 'rbac-plugin' })
```

This plugin is declared but has no routes or middleware registered. It's either incomplete or dead code.

---

### L-08: `resetPassword` Returns Plaintext Temp Password in Response

**File**: `server/src/modules/users/users.controller.ts`  
**Line**: 190

```typescript
return { success: true, tempPassword }
```

The temporary password is returned in the HTTP response body. While this is an admin-only operation, returning plaintext passwords in API responses is a security risk (logging, caching, etc.). Consider returning it via a more secure channel.

---

## Recommendations Summary

### Must Fix Before Production
1. **Add authentication guards** to all user management endpoints (C-01)
2. **Fix tenant isolation** in `listRoles` — never return unscoped data (C-02)
3. **Filter soft-deleted roles** from all queries (C-03)
4. **Fix duplicate email check** — use `ne(users.id, id)` instead of `eq` (C-04)
5. **Replace hardcoded role ID check** with RBAC permission check (C-05)
6. **Add HTTP status codes** to all error responses (H-01)
7. **Protect default roles** from updates (H-02)
8. **Check user active status** in `requirePermission` (H-03)

### Should Fix Soon
9. Make `listUsers`/`searchUsers` filters combinable (H-06)
10. Add tenant existence validation in `createUser` (H-07)
11. Separate `rbac.assign` permission from `rbac.create` (H-08)
12. Add unique constraint on `users.email` (M-02)
13. Use proper CSV parser for import (M-07)

### Nice to Have
14. Replace `isDefault` overload with proper `deletedAt` column (M-01)
15. Add permission lookup caching (M-05)
16. Escape LIKE wildcards in search (M-08)
17. Remove unused import (L-01)