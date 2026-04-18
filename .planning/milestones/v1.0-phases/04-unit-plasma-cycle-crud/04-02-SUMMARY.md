---
phase: 04-unit-plasma-cycle-crud
plan: 02
subsystem: plasma
tags:
  - plasma-crud
  - tenant-isolation
  - rbac
  - soft-delete
  - audit-logging
requires:
  - phase-01: database schema (plasmas, units, cycles, audit_logs)
  - phase-02: auth, session, tenant middleware
  - phase-03: RBAC permission guards
provides:
  - plasma-crud-api
  - tenant-scoped-queries
  - active-cycles-guard
affects:
  - server/src/index.ts: route registration
tech-stack:
  added: []
  patterns:
    - service → controller → routes
    - custom error classes
    - Elysia t.Object validation
    - fire-and-forget audit logging
key-files:
  created:
    - server/src/modules/plasma/plasma.errors.ts
    - server/src/modules/plasma/plasma.service.ts
    - server/src/modules/plasma/plasma.controller.ts
    - server/src/modules/plasma/plasma.routes.ts
    - tests/unit/plasma.test.ts
  modified:
    - server/src/index.ts
decisions:
  - Used unit ownership join for tenant isolation (not direct tenantId on plasma table)
  - Fire-and-forget audit logging per D-02 (empty catch blocks are intentional)
  - Session userId extracted from cookie.auth_session with 'system' fallback
  - Followed unit.controller.ts pattern exactly for consistency
metrics:
  duration: ~8min
  completed: "2026-04-17T04:27:00Z"
  tasks_completed: 2
  tasks_planned: 2
  tests: 17 passing
---

# Phase 04 Plan 02: Plasma CRUD Summary

**One-liner:** Plasma CRUD API with tenant isolation via unit ownership, RBAC guards, soft-delete with active cycles guard, and fire-and-forget audit logging.

## Objective

Create the Plasma module with full CRUD (create, list, get, update, soft-delete) following the established service → controller → routes pattern. Implements the middle level of the organizational hierarchy (Unit → Plasma → Cycle) with tenant isolation via unit ownership.

## Tasks Completed

| Task | Type | Description | Commit |
|------|------|-------------|--------|
| 1 | auto (tdd) | Create plasma.errors.ts and plasma.service.ts | a7b077d (pre-existing), 668fa61 (test) |
| 2 | auto | Create plasma.controller.ts and plasma.routes.ts | 0787e15 |

### Task 1: Plasma Errors & Service (TDD RED/GREEN)

**Files created:**
- `server/src/modules/plasma/plasma.errors.ts` — 3 error classes
- `server/src/modules/plasma/plasma.service.ts` — 5 CRUD functions

**Error classes:**
- `PlasmaNotFoundError` — thrown for non-existent or soft-deleted plasmas
- `PlasmaHasActiveCyclesError` — thrown when soft-delete blocked by active cycles
- `PlasmaNotInTenantUnitError` — thrown when creating plasma for unit outside tenant

**Service functions:**
- `createPlasma(input, tenantId, userId)` — verifies unit ownership, inserts, audit logs
- `listPlasmas(tenantId, unitId?)` — joins with units table, excludes soft-deleted
- `getPlasma(id, tenantId)` — tenant-scoped single record retrieval
- `updatePlasma(id, input, tenantId, userId)` — partial update with old/new audit
- `softDeletePlasma(id, tenantId, userId)` — checks active cycles, sets deletedAt

**TDD cycle:** 17 tests written (RED), then implementation (GREEN). All 17 pass.

### Task 2: Plasma Controller & Routes

**Files created:**
- `server/src/modules/plasma/plasma.controller.ts` — Elysia controller with 5 routes
- `server/src/modules/plasma/plasma.routes.ts` — re-export

**Routes:**
| Method | Path | Permission | Validation |
|--------|------|------------|------------|
| POST | `/api/plasmas` | `plasma.create` | body: unitId, name, optional fields |
| GET | `/api/plasmas` | `plasma.read` | query: optional unitId |
| GET | `/api/plasmas/:id` | `plasma.read` | params: id |
| PUT | `/api/plasmas/:id` | `plasma.update` | params: id, body: partial update |
| DELETE | `/api/plasmas/:id` | `plasma.delete` | params: id |

**Error mapping:**
- `PlasmaNotFoundError` → 404 `PLASMA_NOT_FOUND`
- `PlasmaHasActiveCyclesError` → 400 `PLASMA_HAS_ACTIVE_CYCLES`
- `PlasmaNotInTenantUnitError` → 400 `PLASMA_NOT_IN_TENANT_UNIT`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed insert return type in createPlasma**
- **Found during:** Task 1 GREEN
- **Issue:** Used `result.lastInsertRowid` (incorrect for MySQL2/Drizzle)
- **Fix:** Changed to `result[0].insertId` matching established unit.service.ts pattern
- **Files modified:** `server/src/modules/plasma/plasma.service.ts`

**2. [Rule 3 - Blocking] Registered plasma routes in index.ts**
- **Found during:** Task 2
- **Issue:** Plan didn't mention route registration but routes won't be accessible without it
- **Fix:** Added import and `.use(plasmaController)` to server/src/index.ts
- **Files modified:** `server/src/index.ts`

**3. [Rule 1 - Bug] Fixed test tenant insert missing required slug field**
- **Found during:** Task 1 GREEN
- **Issue:** Test insert into tenants table omitted required `slug` column
- **Fix:** Added `slug: 'test-tenant'` to test tenant creation
- **Files modified:** `tests/unit/plasma.test.ts`

## Verification

- ✅ TypeScript type check: 0 errors
- ✅ All 34 tests pass (17 plasma + 15 unit + 2 setup)
- ✅ No `as any` usage in plasma module files
- ✅ All 8 exported symbols have JSDoc with @param/@returns/@throws
- ✅ 4 files created in server/src/modules/plasma/
- ✅ Routes registered and accessible at /api/plasmas

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| threat_flag: endpoint | plasma.controller.ts | 5 new network endpoints at /api/plasmas/* — all guarded by requirePermission() |
| threat_flag: tenant-scoping | plasma.service.ts | All queries join with units table and filter eq(units.tenantId, tenantId) — matches T-04-06 mitigation |
| threat_flag: unit-verification | plasma.service.ts | createPlasma verifies unit belongs to tenant before insert — matches T-04-09 mitigation |
| threat_flag: input-validation | plasma.controller.ts | Elysia t.Object validation on all POST/PUT bodies — matches T-04-05 mitigation |
| threat_flag: audit | plasma.service.ts | Fire-and-forget audit logging per D-02 — matches T-04-07 acceptance |

## Known Stubs

None.

## Self-Check: PASSED

- ✅ server/src/modules/plasma/plasma.errors.ts exists
- ✅ server/src/modules/plasma/plasma.service.ts exists
- ✅ server/src/modules/plasma/plasma.controller.ts exists
- ✅ server/src/modules/plasma/plasma.routes.ts exists
- ✅ tests/unit/plasma.test.ts exists
- ✅ Commit 668fa61 exists (test RED)
- ✅ Commit a7b077d exists (service GREEN - pre-existing from wave)
- ✅ Commit 0787e15 exists (controller + routes)
