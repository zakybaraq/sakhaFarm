---
phase: 05-data-integration
plan: '01'
subsystem: frontend-api-integration
tags: [rbac, api-integration, react-query]
dependency_graph:
  requires: []
  provides: [rbac-manager-connected]
  affects: [client/src/pages/rbac/RbacManager.tsx]
tech_stack:
  added: []
  patterns: [useQuery, useMutation, react-query-caching]
key_files:
  created: []
  modified:
    - client/src/pages/rbac/RbacManager.tsx
decisions:
  - >-
    Role CRUD operations flow through API mutations instead of local state
  - >-
    User mapping converts string IDs to numbers for DataGrid display
---

# Phase 5 Plan 1: Connect RbacManager to API Summary

## Objective

Connect RbacManager page to backend API - replace mockRoles and mockUsers with real data from `/api/rbac/roles` and `/api/users`.

## Tasks Completed

| Task | Name | Status | Commit |
|------|------|-------|--------|
| 1 | Add Role API functions | ✅ Already Present | N/A - existed in repo |
| 2 | Update RbacManager to use API | ✅ Fixed & Committed | eeab07a |

### Task 2 Details

**Fixed Issues:**

1. **User ID mapping bug** — Fixed `Number(u.id.slice(-8))` to `parseInt(u.id, 10)`
2. **handleSaveRole not using API** — Updated to use `createRoleMutation` and `updateRoleMutation` instead of local `setRoles` state

**Changes Made:**
- Fixed user mapping in useEffect to use proper API fields (`u.role?.name`, `u.tenant?.name`, `u.isActive`)
- Updated handleSaveRole to call mutations instead of directly updating local state
- Mutations automatically invalidate the roles query cache on success

## Verification

✅ API functions for roles exist in `client/src/api/rbac.ts`
- `listRoles(tenantId)` → Returns `{ roles: Role[] }`
- `createRole`, `updateRole`, `deleteRole` CRUD functions exported

✅ RbacManager.tsx imports and uses `listRoles` from API
- Line 32: `import { listRoles, createRole, updateRole, deleteRole } from '../../api/rbac'`
- Line 104: `queryKey: ['roles', user?.tenantId]`

✅ RbacManager.tsx imports and uses `listUsers` from API
- Line 33: `import { listUsers, type User as ApiUser, type UsersResponse } from '../../api/users'`
- Line 110: `queryKey: ['users']`

✅ DataGrid displays data from API instead of mock arrays
- Roles DataGrid: `rows={roles}` (populated from API)
- Users DataGrid: `rows={users}` (populated from API)
- Loading states: `loading={rolesLoading}`, `loading={usersLoading}`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed handleSaveRole not using API mutations**
- **Found during:** Implementation verification
- **Issue:** handleSaveRole was using setRoles (local state) instead of calling API mutations
- **Fix:** Updated to use createRoleMutation.mutate() and updateRoleMutation.mutate()
- **Files modified:** client/src/pages/rbac/RbacManager.tsx
- **Commit:** eeab07a

**2. [Rule 1 - Bug] Fixed user ID mapping**
- **Found during:** Code review
- **Issue:** `Number(u.id.slice(-8))` was incorrect - extracts last 8 chars from string ID
- **Fix:** Changed to `parseInt(u.id, 10)` for proper numeric conversion
- **Files modified:** client/src/pages/rbac/RbacManager.tsx
- **Commit:** eeab07a

## Metrics

- Duration: ~5 minutes (verification + fix)
- Tasks: 2 (1 pre-existing, 1 fixed)
- Files: 1 modified

---

_Date: 2026-04-18_