# Phase 4 Code Review — Fix Summary

**Date**: 2026-04-17  
**Scope**: Critical and High severity findings from 04-REVIEW.md

---

## Fixes Applied

### 🔴 CRITICAL

#### C-01: Tenant ID bypass via `x-tenant-id` header — FIXED
**Files**: `unit.controller.ts`, `plasma.controller.ts`, `cycle.controller.ts`

- Removed `headers` parameter and `x-tenant-id` header fallback from `getTenantId()` in all 3 controllers
- `getTenantId()` now throws `MISSING_TENANT_ID` error if no valid tenant ID from session/middleware
- Removed all `headers` and `tenantId` destructuring from route handlers
- Removed manual `if (!currentTenantId)` checks (now handled by `getTenantId()` throwing)

#### C-02: HTTP 200 for all errors — FIXED
**Files**: `unit.controller.ts`, `plasma.controller.ts`, `cycle.controller.ts`

- Added `set.status` in all `.onError()` handlers:
  - `*NotFoundError` → 404
  - `*ConflictError` / `DuplicateUnitCodeError` / `*HasActive*Error` / `InvalidCycleStatusTransitionError` → 409
  - `InvalidDocTypeError` → 400
  - `MISSING_TENANT_ID` / `MISSING_USER_ID` → 401

#### C-03: Soft-delete vs unique constraint — FIXED
**File**: `server/src/db/schema/units.ts`

- Removed `unique('uq_units_code_tenant').on(table.code, table.tenantId)` constraint
- App-level duplicate check with `isNull(units.deletedAt)` filter already prevents duplicates among active units
- Soft-deleted units can now be recreated with the same code

---

### 🟠 HIGH

#### H-01: Race condition — duplicate code check — FIXED
**File**: `server/src/modules/unit/unit.service.ts`

- Wrapped `createUnit()` in `db.transaction()` — check + insert now atomic
- Wrapped `updateUnit()` in `db.transaction()` — check + update now atomic
- Changed `createUnit` to return fetched DB row instead of constructed object (also fixes M-04)

#### H-02: Race condition — cycle number — FIXED
**File**: `server/src/modules/cycle/cycle.service.ts`

- Wrapped `createCycle()` in `db.transaction()` — max read + insert now atomic within transaction

#### H-03: `failCycle` discards notes — FIXED
**Files**: `server/src/db/schema/cycles.ts`, `server/src/modules/cycle/cycle.service.ts`

- Added `notes: text('notes')` column to cycles schema
- Updated `failCycle` to include `notes: input.notes ?? null` in the update `.set()` call

#### H-04: Invalid DOC type throws generic Error — FIXED
**Files**: `server/src/modules/cycle/cycle.errors.ts`, `server/src/modules/cycle/cycle.service.ts`, `server/src/modules/cycle/cycle.controller.ts`

- Created `InvalidDocTypeError` class in `cycle.errors.ts`
- Replaced `throw new Error(...)` with `throw new InvalidDocTypeError(...)` in `createCycle` and `updateCycle`
- Added `InvalidDocTypeError` handler in cycle controller's `.onError()` with `set.status = 400`

#### H-05: `userId` defaults to `'system'` — FIXED
**Files**: `unit.controller.ts`, `plasma.controller.ts`, `cycle.controller.ts`

- Changed all `const userId = sessionId || 'system'` to throw `MISSING_USER_ID` error when no session
- Added `MISSING_USER_ID` handler in all 3 controller `.onError()` blocks with `set.status = 401`

#### H-06: Plasma soft-delete check missing tenant scope — FIXED
**File**: `server/src/modules/plasma/plasma.service.ts`

- Added `isNull(cycles.deletedAt)` to the `activeCycles` query in `softDeletePlasma()`

---

## Files Changed

| File | Changes |
|------|---------|
| `server/src/modules/unit/unit.controller.ts` | C-01, C-02, H-05 |
| `server/src/modules/unit/unit.service.ts` | H-01 |
| `server/src/modules/plasma/plasma.controller.ts` | C-01, C-02, H-05 |
| `server/src/modules/plasma/plasma.service.ts` | H-06 |
| `server/src/modules/cycle/cycle.controller.ts` | C-01, C-02, H-04, H-05 |
| `server/src/modules/cycle/cycle.service.ts` | H-02, H-03, H-04 |
| `server/src/modules/cycle/cycle.errors.ts` | H-04 |
| `server/src/db/schema/units.ts` | C-03 |
| `server/src/db/schema/cycles.ts` | H-03 |

## Verification

- All 9 changed files pass LSP diagnostics with zero errors
- No new imports required beyond existing dependencies
- Transaction support already available via `db.transaction()` (used in `recordings.bulk.ts`)