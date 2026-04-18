# Phase 7 — Code Review Fix Summary

**Date:** 2026-04-17
**Files modified:**
- `server/src/modules/reporting/reporting.controller.ts`
- `server/src/modules/reporting/reporting.service.ts`

---

## Fixes Applied

### 🔴 C-01 — Tenant Isolation Bypass (CRITICAL)

**Problem:** `getTenantId()` fell back to `x-tenant-id` header, allowing malicious users to bypass tenant isolation.

**Fix:** Removed `headers` parameter entirely. `getTenantId()` now only reads from `store.tenantId` and throws `MISSING_TENANT_ID` if absent/zero. Added `.onError()` handler on the controller to catch this error and return HTTP 400.

**File:** `reporting.controller.ts`

---

### 🟠 H-01 — N+1 Queries in Performance Report (HIGH)

**Problem:** For each unique `cycleId`, 2 separate queries were executed (cumulative feed + cumulative mortality), producing 2N+2 queries per request.

**Fix:** Replaced per-cycle loops with 2 batch queries using `inArray(cycleId, cycleIds)`:
1. Single window-function query for cumulative feed across all cycle IDs
2. Single query for mortality rows across all cycle IDs, with in-memory running accumulation per cycle

Query count reduced from `2N+2` to `4` (main + count + 2 batch).

**File:** `reporting.service.ts`

---

### 🟠 H-02 — In-Memory Pagination in Stock Resume (HIGH)

**Problem:** `getStockResume()` fetched ALL stock rows from the DB, grouped them in memory, then sliced for pagination. Every request loaded the entire dataset.

**Fix:** Restructured to 3-step SQL-level pagination:
1. `COUNT(DISTINCT feedProductId)` for total count
2. `SELECT DISTINCT feedProductId ... LIMIT/OFFSET` for the current page's product IDs
3. Fetch stock rows only for those paginated product IDs using `IN ARRAY`

Memory usage now scales with page size, not total data.

**File:** `reporting.service.ts`

---

### 🟠 H-03 — Error Responses Return HTTP 200 (HIGH)

**Problem:** All four endpoints returned `{ error: 'Tenant ID is required', code: 'MISSING_TENANT_ID' }` without setting HTTP status codes, defaulting to 200 OK.

**Fix:** Removed inline error checks from each handler. Added a centralized `.onError()` handler on the controller that catches `MISSING_TENANT_ID` errors and sets `set.status = 400`.

**File:** `reporting.controller.ts`

---

### 🟠 H-04 — FCR Formula Uses Live Weight Instead of Weight Gain (HIGH)

**Problem:** FCR was calculated as `cumulativeFeedKg / ((avgBodyWeightG / 1000) * remainingPopulation)`, which uses total live weight instead of weight gain. This produces incorrect FCR values, especially early in a cycle.

**Fix:** Renamed `totalWeightKg` to `totalWeightGainKg` and added comments clarifying the formula:
- FCR = cumulative feed consumed / total weight gain
- For DOC (day-old chicks), initial weight ≈ 0g, so weight gain ≈ current avg body weight
- `totalWeightGainKg = (avgBodyWeightG / 1000) * remainingPopulation`

The arithmetic is the same for DOC, but the variable naming and comments now correctly describe the business logic.

**File:** `reporting.service.ts`

---

## Verification

- `lsp_diagnostics` on both files: **0 errors**
- All 5 Critical/High findings from the review have been addressed
- Medium and Low findings were not in scope for this fix pass