# Phase 5 Code Review Fix Summary

**Date**: 2026-04-17
**Scope**: Critical and High severity findings from 05-REVIEW.md

---

## Fixes Applied

### 🔴 C1. Tenant Isolation — FIXED

**Files**: `recordings.service.ts`, `recordings.summary.ts`, `recordings.bulk.ts`

All queries now enforce tenant isolation by joining through the full ownership chain:
`daily_recordings → cycles → plasmas → units` and filtering on `units.tenantId`.

- `createRecording`: Cycle lookup now joins plasmas+units and filters by tenantId
- `listRecordings`: Changed from leftJoin to innerJoin with plasmas+units, added tenantId filter
- `getRecording`: Changed from leftJoin to innerJoin with plasmas+units, added tenantId filter
- `updateRecording`: Existing-record query now innerJoins plasmas+units with tenantId filter
- `softDeleteRecording`: Same tenant isolation pattern applied
- `getCycleSummary` (summary.ts): Cycle lookup now innerJoins plasmas+units with tenantId filter
- `validateRow` (bulk.ts): Cycle lookup now innerJoins plasmas+units with tenantId filter
- `importBulk` (bulk.ts): Cycle lookup now innerJoins plasmas+units with tenantId filter

### 🔴 C2. Soft-Delete vs Unique Constraint — FIXED

**File**: `daily_recordings.ts`

Removed the `unique('uq_cycle_recording_date').on(table.cycleId, table.recordingDate)` constraint from the schema. MySQL doesn't support partial/filtered unique indexes, so soft-deleted rows would conflict with new entries for the same date. Deduplication is already enforced at the application level via `isNull(deletedAt)` checks before insert/update.

### 🟠 H1. CSV Parser Quoted Fields — FIXED

**File**: `recordings.bulk.ts`

Replaced naive `line.split(',')` with a proper `parseCSVLine()` function that handles:
- Quoted fields containing commas
- Escaped double quotes (`""` inside quoted fields)
- Header parsing also uses the new parser

### 🟠 H2. Bulk Import Transaction — FIXED

**File**: `recordings.bulk.ts`

Refactored `importBulk` to:
1. Fetch the cycle once before the loop (eliminates N+1 query)
2. Validate all rows first, collecting valid rows separately
3. Insert all valid rows inside a `db.transaction()` block
4. Audit logs remain fire-and-forget outside the transaction
5. `success` field now returns `errors.length === 0` instead of always `true`

### 🟠 H3. dayAge Recalculation on Update — FIXED

**File**: `recordings.service.ts`

When `recordingDate` is changed in `updateRecording`, the function now fetches the cycle's `chickInDate` and recalculates `dayAge` using the existing `calculateDayAge()` utility. The updated `dayAge` is included in the `updateData` set.

### 🟠 H4. Audit Log Captures Full Old Value — FIXED

**Files**: `recordings.service.ts`

Both `updateRecording` and `softDeleteRecording` now select all relevant fields (id, cycleId, recordingDate, dayAge, dead, culled, remainingPopulation, bodyWeightG, feedConsumedKg, notes) instead of just `{ id }`. The audit log's `oldValue` now contains the complete before-state.

### 🟠 H5. parseInt → Number() for SUM Results — FIXED

**File**: `recordings.service.ts`

Replaced `parseInt(cumulativeStats[0]?.totalDead || '0', 10)` with `Number(cumulativeStats[0]?.totalDead || 0)` in both `createRecording` and `getRecording`. This avoids truncating decimal values and handles edge cases correctly.

### 🟠 H6. CycleNotFoundError for getCycleSummary — FIXED

**Files**: `recordings.errors.ts`, `recordings.summary.ts`, `recordings.controller.ts`

- Added `CycleNotFoundError` class to `recordings.errors.ts`
- Replaced `throw new Error(...)` in `getCycleSummary` with `throw new CycleNotFoundError(cycleId)`
- Added error handler in the controller that returns 404 with code `CYCLE_NOT_FOUND`

---

## Files Changed

| File | Changes |
|------|---------|
| `server/src/modules/recordings/recordings.service.ts` | C1, H3, H4, H5 |
| `server/src/modules/recordings/recordings.summary.ts` | C1, H6 |
| `server/src/modules/recordings/recordings.bulk.ts` | C1, H1, H2 |
| `server/src/modules/recordings/recordings.controller.ts` | H6 |
| `server/src/modules/recordings/recordings.errors.ts` | H6 |
| `server/src/db/schema/daily_recordings.ts` | C2 |

## Not Addressed (Medium/Low — out of scope)

- M1: Timezone issues in date comparisons
- M2: Duplicate fetchStandard/deviation logic
- M3: calculateDayAge negative values
- M4: Hardcoded initial weight in FCR
- M5: No pagination on listRecordings
- M6: Bulk import success flag (partially addressed — now returns `errors.length === 0`)
- M7: N+1 query in bulk import (fixed as part of H2)
- L1-L5: Low severity findings