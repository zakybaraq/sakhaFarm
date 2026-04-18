---
phase: 3
plan: 03-01
subsystem: rbac
tags:
  - rbac
  - roles
  - permissions
  - crud
  - backend
requires:
  - 02-authentication
provides:
  - role-crud-api
  - permission-crud-api
  - role-permission-assignment-api
affects:
  - server/src/index.ts
tech-stack:
  added:
    - Elysia route controller
    - Drizzle ORM queries
    - Custom error classes
  patterns:
    - service/controller separation
    - error handling via onError hook
    - type-safe body/query/params validation
key-files:
  created:
    - server/src/modules/rbac/rbac.errors.ts
    - server/src/modules/rbac/rbac.service.ts
    - server/src/modules/rbac/rbac.controller.ts
    - server/src/modules/rbac/rbac.routes.ts
  modified:
    - server/src/index.ts
decisions:
  - Soft-delete uses isDefault=-1 flag (reusing existing column)
  - Permissions are append-only (no delete endpoint)
  - Default role protection via isDefault=1 check
  - Error handling centralized in controller onError hook
metrics:
  duration: ~15min
  completed: 2026-04-17
---

# Phase 3 Plan 01: RBAC Manager Summary

**One-liner:** Role and permission CRUD backend with role-permission assignment, custom error classes, full JSDoc documentation, and 12 REST endpoints under `/api/rbac`.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create RBAC error classes | `aa4e40a` | `rbac.errors.ts` |
| 2 | Create RBAC service | `aa4e40a` | `rbac.service.ts` |
| 3 | Create RBAC controller | `aa4e40a` | `rbac.controller.ts` |
| 4 | Create RBAC routes | `aa4e40a` | `rbac.routes.ts`, `index.ts` |
| 5 | Verify TypeScript compiles | — | RBAC module: 0 errors |

## Endpoints Implemented

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/rbac/roles` | Create role |
| GET | `/api/rbac/roles` | List roles (optional tenantId filter) |
| GET | `/api/rbac/roles/:id` | Get role by ID |
| PUT | `/api/rbac/roles/:id` | Update role |
| DELETE | `/api/rbac/roles/:id` | Soft-delete role |
| POST | `/api/rbac/permissions` | Create permission |
| GET | `/api/rbac/permissions` | List permissions (optional category filter) |
| GET | `/api/rbac/permissions/:id` | Get permission by ID |
| PUT | `/api/rbac/permissions/:id` | Update permission |
| POST | `/api/rbac/roles/:roleId/permissions` | Assign permission to role |
| DELETE | `/api/rbac/roles/:roleId/permissions/:permissionId` | Remove permission from role |
| GET | `/api/rbac/roles/:roleId/permissions` | List role permissions |

## Key Decisions

1. **Soft-delete via `isDefault` column**: Reuses existing `isDefault` column with value `-1` for deleted roles, avoiding schema migration.
2. **Permissions append-only**: No delete endpoint for permissions — they are reference data that should not be removed.
3. **Default role protection**: Roles with `isDefault=1` cannot be deleted, enforcing system role integrity.
4. **Centralized error handling**: Controller uses Elysia `onError` hook to map custom errors to structured JSON responses.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing validation] Added type-safe normalization for optional tenantId**
- **Found during:** Task 3 (controller creation)
- **Issue:** `body.tenantId` typed as `number | null | undefined` from Elysia `t.Optional`, but service expects `number | null`
- **Fix:** Added `?? null` coalescing at controller layer before passing to service
- **Files modified:** `server/src/modules/rbac/rbac.controller.ts`
- **Commit:** `aa4e40a`

**2. [Rule 3 - Blocking] Pre-existing TypeScript errors in users.service.ts**
- **Found during:** Task 5 (verification)
- **Issue:** 10 pre-existing TS2741/TS2339 errors in `server/src/modules/users/users.service.ts` unrelated to RBAC work
- **Action:** Documented as out-of-scope per deviation scope boundary rules; RBAC module compiles cleanly (0 errors)
- **Files affected:** `server/src/modules/users/users.service.ts` (not modified)

## Known Stubs

None. All endpoints return live data from database queries.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag:authz-bypass | `rbac.controller.ts` | RBAC endpoints lack auth middleware — any caller can create/modify roles and permissions. Should be protected by `requirePermission` guard in future phase. |
| threat_flag:mass-assignment | `rbac.controller.ts` | Role creation accepts `tenantId` from request body; tenant isolation depends on caller providing correct value. |

## Self-Check: PASSED

- [x] `server/src/modules/rbac/rbac.errors.ts` — EXISTS
- [x] `server/src/modules/rbac/rbac.service.ts` — EXISTS
- [x] `server/src/modules/rbac/rbac.controller.ts` — EXISTS
- [x] `server/src/modules/rbac/rbac.routes.ts` — EXISTS
- [x] `server/src/index.ts` — MODIFIED (rbacController import + registration)
- [x] Commit `aa4e40a` — EXISTS in git log
- [x] RBAC module TypeScript compilation — 0 errors
