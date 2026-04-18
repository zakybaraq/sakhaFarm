# Phase 5 Code Review: Daily Recording & Standard Comparison

**Reviewer**: Automated code review  
**Date**: 2026-04-17  
**Scope**: Phase 5.01 (Recording CRUD) + Phase 5.02 (Bulk Import & Cycle Summary)  
**Files reviewed**: 8 source files, 1 test file

---

## Summary

Phase 5 implements daily recording CRUD, bulk CSV import, and cycle summary with IP/FCR/deviation calculations. The implementation has **one critical security vulnerability** (broken tenant isolation), **several high-severity bugs** (soft-delete vs unique constraint conflict, CSV parsing, missing dayAge recalculation), and **moderate code quality issues** (duplicated logic, missing transaction, timezone handling).

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 2 |
| 🟠 HIGH | 6 |
| 🟡 MEDIUM | 7 |
| 🔵 LOW | 5 |

---

## 🔴 CRITICAL Findings

### C1. Tenant Isolation Completely Broken — All Service Files

**Files**: `recordings.service.ts`, `recordings.summary.ts`, `recordings.bulk.ts`

The `tenantId` parameter is accepted in every service function but **never used in any WHERE clause**. This means any authenticated user can read, modify, or delete recordings belonging to any tenant.

```typescript
// recordings.service.ts:259-283
export async function listRecordings(cycleId: number, tenantId: number) {
  // tenantId is accepted but NEVER used in the query
  const recordings = await db
    .select({...})
    .from(dailyRecordings)
    .leftJoin(cyclesTable, eq(dailyRecordings.cycleId, cyclesTable.id))
    .where(and(
      eq(dailyRecordings.cycleId, cycleId),
      isNull(dailyRecordings.deletedAt),
      // MISSING: eq(cyclesTable.tenantId, tenantId) or similar
    ))
```

**Impact**: Cross-tenant data leakage. A user in tenant A can view/modify/delete recordings in tenant B by guessing or enumerating cycle IDs.

**Fix**: Add tenant filtering to every query. Since `dailyRecordings` doesn't have a `tenantId` column, join through `cycles` and filter on `cycles.plasmaId → plasmas.tenantId`, or add a `tenantId` column to `daily_recordings`.

---

### C2. Soft-Delete Conflicts with Unique Constraint on `(cycleId, recordingDate)`

**File**: `daily_recordings.ts` (schema), `recordings.service.ts`

The unique constraint `uq_cycle_recording_date` on `(cycleId, recordingDate)` does not account for soft-deleted rows. After soft-deleting a recording, creating a new recording for the same date will fail at the database level.

```typescript
// daily_recordings.ts:36
cycleDateUnique: unique('uq_cycle_recording_date').on(table.cycleId, table.recordingDate),
```

The application-level check in `createRecording` (line 161-175) filters by `isNull(dailyRecordings.deletedAt)`, so it would allow the insert, but the DB constraint would reject it.

**Impact**: Data loss — users cannot re-record data for a date after deleting the previous entry.

**Fix**: Either (a) use a partial/conditional unique index (not supported in MySQL), (b) change soft-delete to hard delete, or (c) include `deletedAt` in the unique constraint by using a sentinel value (e.g., set `deletedAt` to a specific timestamp pattern) or use a composite unique index with a nullable `deletedAt` column workaround.

---

## 🟠 HIGH Findings

### H1. CSV Parser Doesn't Handle Quoted Fields — `recordings.bulk.ts:47`

```typescript
const values = line.split(',').map(v => v.trim())
```

Simple comma-split breaks on any field containing commas (especially the `notes` column). A note like `"Sick, medication given"` would be split into two columns.

**Fix**: Use a proper CSV parser (e.g., `papaparse`, `csv-parse`) or at minimum handle quoted fields with a regex-based parser.

---

### H2. Bulk Import Has No Transaction — `recordings.bulk.ts:157-207`

Each row is inserted individually without a transaction wrapper. If the import fails partway through, some rows will be persisted while others are lost, leaving the cycle in an inconsistent state.

**Fix**: Wrap the entire bulk import in a database transaction. If any row fails validation, roll back all inserts (or use a two-phase approach: validate all, then insert all).

---

### H3. `updateRecording` Doesn't Recalculate `dayAge` — `recordings.service.ts:369-447`

When `recordingDate` is changed in an update, the `dayAge` field is not recalculated. This leads to stale/incorrect day age values.

```typescript
// Line 421: recordingDate is updated but dayAge is never recalculated
if (input.recordingDate !== undefined) updateData.recordingDate = input.recordingDate
// MISSING: recalculate dayAge from cycle.chickInDate
```

**Fix**: When `recordingDate` changes, fetch the cycle's `chickInDate` and recalculate `dayAge`.

---

### H4. Audit Log for Updates Only Captures `{id}` as Old Value — `recordings.service.ts:439`

```typescript
oldValue: JSON.stringify(existing), // existing = { id: dailyRecordings.id }
```

The `existing` variable (line 375-379) only selects `{ id }`, so the audit log's `oldValue` is just `{"id":42}` — useless for tracking what actually changed.

**Fix**: Select all relevant fields in the initial query so the audit log captures the full before-state.

---

### H5. `parseInt` on SQL SUM Results Can Produce NaN — `recordings.service.ts:208-209`

```typescript
const totalDead = parseInt(cumulativeStats[0]?.totalDead || '0', 10)
```

If `totalDead` is a decimal string like `"10.5"`, `parseInt` would return `10` (truncating). More importantly, if the sum returns `null` in an edge case, the `|| '0'` fallback handles it, but `parseInt` on unexpected formats could yield `NaN`.

**Fix**: Use `Number()` or `parseFloat()` instead of `parseInt()` for aggregate results.

---

### H6. `getCycleSummary` Throws Generic `Error` — `recordings.summary.ts:101`

```typescript
throw new Error(`Cycle ${cycleId} not found`)
```

This throws a plain `Error`, which won't be caught by the controller's `onError` handler (which only handles custom error classes). The client will receive a generic 500 error instead of a proper 404.

**Fix**: Create and throw a `CycleNotFoundError` similar to `RecordingNotFoundError`, and add it to the controller's error handler.

---

## 🟡 MEDIUM Findings

### M1. Timezone Issues in Date Comparisons — `recordings.service.ts:154-158`, `recordings.bulk.ts:77-80`

```typescript
const today = new Date()
today.setHours(23, 59, 59, 999)
const recordingDateObj = new Date(input.recordingDate) // Parsed as UTC midnight
```

`new Date('2026-04-17')` is parsed as UTC midnight, but `new Date()` is local time. In timezones behind UTC (e.g., UTC-5), a recording for "today" in local time might be rejected as "future" because UTC midnight of today is ahead of local time.

**Fix**: Normalize both dates to the same timezone, or compare date strings directly (`input.recordingDate <= today.toISOString().split('T')[0]`).

---

### M2. Duplicate `fetchStandard` and Deviation Logic — `recordings.service.ts:90-109`, `recordings.summary.ts:44-63`

The `fetchStandard` function and deviation calculation logic are duplicated across two files. Any bug fix or change must be applied in both places.

**Fix**: Extract to a shared utility module (e.g., `recordings.utils.ts`).

---

### M3. `calculateDayAge` Can Return Negative Values — `recordings.service.ts:58-63`

If a recording date is before the chick-in date, `dayAge` will be negative. No validation prevents this.

**Fix**: Add validation that `recordingDate >= chickInDate`, or clamp `dayAge` to minimum 0.

---

### M4. Hardcoded Initial Weight in FCR Calculation — `recordings.summary.ts:152`

```typescript
const initialWeightKg = 0.04 // 40g chick weight
```

This magic number should be configurable per doc type or at least documented with a comment explaining the assumption.

**Fix**: Move to a constant/config, or better yet, store initial weight in the cycle or standards table.

---

### M5. No Pagination on `listRecordings` — `recordings.service.ts:259-283`

Returns all recordings for a cycle without pagination. For long-running cycles (100+ days), this could return large payloads.

**Fix**: Add `limit`/`offset` query parameters with sensible defaults.

---

### M6. Bulk Import Returns `success: true` Even with Row Errors — `recordings.bulk.ts:209`

```typescript
return { success: true, created, errors }
```

If some rows fail, `success: true` is misleading. Consumers might not check the `errors` array.

**Fix**: Return `success: errors.length === 0` or add a `partial` status field.

---

### M7. N+1 Query in Bulk Import — `recordings.bulk.ts:157-207`

`validateRow` queries the cycle for every row, and `importBulk` queries it again for `chickInDate`. For a 1000-row import, this is 2000+ unnecessary DB queries.

**Fix**: Query the cycle once before the loop and pass it to validation/insertion functions.

---

## 🔵 LOW Findings

### L1. `getTenantId` Function is Fragile — `recordings.controller.ts:19-23`

The function casts `store` to `Record<string, unknown>` and accesses `tenantId`. If the auth middleware doesn't set this, it silently falls back to headers, which could be spoofed.

**Fix**: Validate tenant ID from the authenticated session only; remove header fallback or mark it as development-only.

---

### L2. `userId` Derived from Session ID — `recordings.controller.ts:51-52`

```typescript
const sessionId = cookie.auth_session?.value as string | undefined
const userId = sessionId || 'system'
```

A session ID is not a user ID. This conflates authentication session with user identity, and the fallback to `'system'` means unauthenticated requests are attributed to a system user.

**Fix**: Resolve the session to a user ID via the auth system, not use the session cookie directly.

---

### L3. Empty Catch Blocks in Audit Logging — `recordings.service.ts:237-239`, `recordings.bulk.ts:200`

```typescript
} catch {
  // Fire-and-forget audit logging
}
```

While fire-and-forget is acceptable for audit logs, completely silent catches can hide configuration or schema issues. At minimum, log to stderr.

---

### L4. `updateRecording` Uses `Record<string, unknown>` — `recordings.service.ts:420`

```typescript
const updateData: Record<string, unknown> = {}
```

This loses all type safety for the Drizzle `set()` call. If a field name is typo'd, it won't be caught at compile time.

**Fix**: Type `updateData` as `Partial<NewDailyRecording>` or use Drizzle's inferred type.

---

### L5. Custom Error Classes Missing `Object.setPrototypeOf` — `recordings.errors.ts`

In some bundler/transpilation scenarios, `instanceof` checks can fail for custom error classes without `Object.setPrototypeOf(this, ClassName.prototype)`.

**Fix**: Add `Object.setPrototypeOf(this, ClassName.prototype)` to each constructor, or verify this works correctly in the project's runtime.

---

## Test Coverage Assessment

**File**: `tests/unit/recordings.test.ts`

| Area | Covered? |
|------|----------|
| Error classes | ✅ |
| CSV parsing | ✅ (basic) |
| CSV validation | ⚠️ (mock DB doesn't match real API) |
| Bulk import limits | ✅ |
| `createRecording` | ❌ |
| `updateRecording` | ❌ |
| `softDeleteRecording` | ❌ |
| `getRecording` | ❌ |
| `listRecordings` | ❌ |
| `getCycleSummary` | ❌ |
| Calculation functions (dayAge, mortality, deplesi, survivalRate, FCR, IP, deviation) | ❌ |
| Tenant isolation | ❌ |
| Timezone edge cases | ❌ |

**Recommendation**: Add unit tests for all calculation functions (they're pure functions and easy to test) and integration tests for CRUD operations with proper DB mocking.

---

## Priority Remediation Order

1. **🔴 C1** — Add tenant filtering to ALL queries (security blocker)
2. **🔴 C2** — Fix unique constraint vs soft-delete conflict (data integrity blocker)
3. **🟠 H1** — Replace naive CSV parser with proper library
4. **🟠 H2** — Wrap bulk import in transaction
5. **🟠 H3** — Recalculate dayAge on recordingDate update
6. **🟠 H4** — Capture full old value in audit log
7. **🟠 H5** — Use `Number()` instead of `parseInt()` for aggregates
8. **🟠 H6** — Use custom error class in summary
9. **🟡 M1** — Fix timezone handling in date comparisons
10. **🟡 M2** — Extract shared utility functions
11. **🟡 M3-M7** — Address remaining medium findings
12. **🔵 L1-L5** — Address low findings as time permits