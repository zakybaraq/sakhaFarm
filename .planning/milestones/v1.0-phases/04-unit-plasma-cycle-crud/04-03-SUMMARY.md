---
phase: 04-unit-plasma-cycle-crud
plan: 03
subsystem: cycle-crud
tags: [backend, crud, elysia, drizzle, tenant-scoped, rbac, chick-in, status-transitions]
dependency_graph:
  requires:
    - phase-01: database schema (cycles, plasmas, units, audit_logs, daily_recordings)
    - phase-02: auth, session, tenant middleware
    - phase-03: RBAC permission guards
    - phase-04-plan-01: unit CRUD module
    - phase-04-plan-02: plasma CRUD module
  provides:
    - cycle-create (Chick-In)
    - cycle-list
    - cycle-get
    - cycle-update
    - cycle-soft-delete
    - cycle-complete
    - cycle-fail
    - auto-cycle-numbering
    - capacity-validation
    - doc-type-validation
    - status-transition-guards
  affects:
    - server/src/index.ts: route registration
tech-stack:
  added: []
  patterns:
    - service → controller → routes
    - custom error classes
    - Elysia t.Object validation
    - fire-and-forget audit logging
    - soft-delete with recording guard
    - auto-increment per parent entity
key-files:
  created:
    - server/src/modules/cycle/cycle.errors.ts
    - server/src/modules/cycle/cycle.service.ts
    - server/src/modules/cycle/cycle.controller.ts
    - server/src/modules/cycle/cycle.routes.ts
    - tests/unit/cycle.test.ts
  modified:
    - server/src/index.ts
    - server/vitest.config.ts
    - tests/setup.ts
decisions:
  - Used `result[0].insertId` for MySQL insert return (Drizzle tuple format)
  - Store access cast to `Record<string, unknown>` for tenantId derived by tenant middleware
  - userId falls back to 'system' when session cookie unavailable (audit trail continuity)
  - Date fields (chickInDate, harvestDate) converted from string to Date object for Drizzle MySQL compatibility
  - Vitest setup file added to load .env vars before test suite execution
metrics:
  duration: ~15min
  completed: "2026-04-17T04:45:00Z"
  tasks_completed: 3
  tests: 29 passing (cycle) + 63 total
---

# Phase 04 Plan 03: Cycle CRUD Module Summary

**One-liner:** Cycle CRUD module with Chick-In (cycle creation), auto-numbering per plasma, capacity validation, DOC type validation, status transitions (complete/fail), soft-delete blocked by daily recordings, tenant-scoped queries via plasma→unit chain, RBAC guards, and fire-and-forget audit logging across 4 module files.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add deletedAt to cycles schema and push | `73613f0` (pre-existing) | cycles.ts (already had deletedAt) |
| 2 | Create cycle.errors.ts and cycle.service.ts (TDD) | `73613f0` | cycle.errors.ts, cycle.service.ts, cycle.test.ts |
| 3 | Create cycle.controller.ts, cycle.routes.ts, register routes | `81287e8` | cycle.controller.ts, cycle.routes.ts, index.ts |

## Verification Results

- **TypeScript compilation**: 0 errors
- **Unit tests**: 63/63 passing (29 cycle + 17 plasma + 15 unit + 2 setup)
- **Module files**: 4 files created in `server/src/modules/cycle/`
- **JSDoc coverage**: All 7 service exports have @param/@returns/@throws annotations
- **No `as any`**: Zero occurrences in any cycle module file
- **Routes registered**: 7 endpoints at `/api/cycles/*`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Date type conversion in cycle.service.ts**
- **Found during:** TypeScript compilation
- **Issue:** `chickInDate` and `harvestDate` fields were passed as strings but Drizzle MySQL schema expects `Date` objects for `date()` column type.
- **Fix:** Wrapped string inputs with `new Date()` in createCycle, updateCycle, completeCycle, and failCycle.
- **Files modified:** server/src/modules/cycle/cycle.service.ts
- **Commit:** `73613f0`

**2. [Rule 1 - Bug] Fixed null safety on plasma capacity check**
- **Found during:** TypeScript compilation
- **Issue:** `plasma[0].plasmas.capacity` could be `null`, causing type error in CycleCapacityExceededError constructor.
- **Fix:** Extracted capacity with null coalescing: `const plasmaCapacity = plasma[0].plasmas.capacity ?? 0`.
- **Files modified:** server/src/modules/cycle/cycle.service.ts
- **Commit:** `73613f0`

**3. [Rule 3 - Blocking] Fixed vitest env loading**
- **Found during:** Test execution
- **Issue:** Tests failed because `validateEnv()` in `env.ts` threw ZodError — DATABASE_URL, REDIS_URL, JWT_SECRET, CORS_ORIGIN were undefined in test context.
- **Fix:** Added `tests/setup.ts` with dotenv loading, configured in `vitest.config.ts` setupFiles. Installed `dotenv` as dev dependency.
- **Files modified:** tests/setup.ts, server/vitest.config.ts, server/package.json
- **Commit:** `73613f0`

**4. [Rule 1 - Bug] Fixed duplicate content in cycle.test.ts**
- **Found during:** Test execution
- **Issue:** Test file had duplicate `it` blocks and orphaned code between line 259-292 (listCycles filter tests repeated outside describe block), causing esbuild parse error.
- **Fix:** Removed duplicate content, restored proper describe block structure.
- **Files modified:** tests/unit/cycle.test.ts
- **Commit:** `73613f0`

**5. [Rule 1 - Bug] Fixed updateCycle set type incompatibility**
- **Found during:** TypeScript compilation
- **Issue:** Passing raw `input` object to `db.update(cycles).set(input)` failed because `chickInDate` type mismatch (string vs Date).
- **Fix:** Built `updateData` record with proper type conversions before passing to `.set()`.
- **Files modified:** server/src/modules/cycle/cycle.service.ts
- **Commit:** `73613f0`

## Auth Gates

None encountered during execution.

## Key Decisions

1. **Date conversion**: String dates from API converted to `Date` objects before Drizzle insert/update — MySQL `date()` column type requires Date objects.
2. **Update data builder**: Instead of spreading input directly into `.set()`, built explicit `updateData` record to ensure type compatibility.
3. **Test infrastructure**: Added vitest setup file to load .env — required because `env.ts` validates at import time, before mocks can be applied.

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| threat_flag: endpoint | cycle.controller.ts | 7 new network endpoints at /api/cycles/* — all guarded by requirePermission('cycle.*') |
| threat_flag: tenant-scoping | cycle.service.ts | All queries join cycles→plasmas→units and filter eq(units.tenantId, tenantId) — matches T-04-11 mitigation |
| threat_flag: plasma-verification | cycle.service.ts | createCycle verifies plasma belongs to tenant (via unit chain) before insert — matches T-04-14 mitigation |
| threat_flag: input-validation | cycle.controller.ts | Elysia t.Object validation on all POST/PUT bodies — matches T-04-10 mitigation |
| threat_flag: status-transition | cycle.service.ts | completeCycle/failCycle check existing.status === 'active' before transition — matches T-04-15 mitigation |
| threat_flag: capacity-check | cycle.service.ts | createCycle validates initialPopulation <= plasma.capacity before insert — matches T-04-16 mitigation |
| threat_flag: audit | cycle.service.ts | Fire-and-forget audit logging per D-02 — matches T-04-12 acceptance |

## Known Stubs

None.

## Self-Check: PASSED

- ✅ server/src/modules/cycle/cycle.errors.ts exists (5 error classes)
- ✅ server/src/modules/cycle/cycle.service.ts exists (7 exported functions)
- ✅ server/src/modules/cycle/cycle.controller.ts exists (7 routes)
- ✅ server/src/modules/cycle/cycle.routes.ts exists (re-export)
- ✅ tests/unit/cycle.test.ts exists (29 tests)
- ✅ server/src/index.ts imports and uses cycleController
- ✅ TypeScript compilation: 0 errors
- ✅ All 63 tests pass
- ✅ No `as any` in cycle module files
- ✅ Commit 73613f0 exists (TDD cycle)
- ✅ Commit 81287e8 exists (controller + routes)
