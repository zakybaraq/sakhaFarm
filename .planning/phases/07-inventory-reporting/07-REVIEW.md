# Phase 7 — Code Review: Inventory Resume & Reporting

**Reviewer:** automated  
**Date:** 2026-04-17  
**Files reviewed:**
- `server/src/modules/reporting/reporting.service.ts`
- `server/src/modules/reporting/reporting.controller.ts`
- `server/src/modules/reporting/reporting.routes.ts`

**Supporting schema files examined:**
- `server/src/db/schema/feed_stock.ts`
- `server/src/db/schema/daily_recordings.ts`
- `server/src/db/schema/cycles.ts`
- `server/src/plugins/rbac.ts`

---

## Summary

The reporting module implements stock resume and performance report endpoints with CSV export. The code is functional but has **1 critical security vulnerability**, **4 high-severity issues**, and several medium/low findings. The most impactful problems are: a tenant isolation bypass via header fallback, N+1 queries that will degrade performance at scale, in-memory pagination that fetches all rows from the DB, and incorrect HTTP status codes on error responses.

---

## Findings

### 🔴 CRITICAL

#### C1 — Tenant isolation bypass via `x-tenant-id` header fallback

**File:** `reporting.controller.ts:10-14`

```typescript
function getTenantId(store, headers, deriveTenantId?) {
  const storeTenantId = (store as Record<string, unknown>).tenantId as number | undefined
  const headerTenantId = parseInt(headers['x-tenant-id'] || '0', 10)
  return storeTenantId ?? deriveTenantId ?? headerTenantId
}
```

The `getTenantId` function falls back to reading `x-tenant-id` from the request headers. If the auth middleware fails to set `store.tenantId` (e.g., misconfiguration, bug, or edge case), a malicious user can set `x-tenant-id` to any tenant's ID and access their data. This violates the fundamental tenant isolation guarantee.

**Fix:** Remove the header fallback entirely. Tenant ID must come exclusively from the authenticated session:

```typescript
function getTenantId(store: Record<string, unknown>, deriveTenantId?: number | null): number {
  const storeTenantId = (store as Record<string, unknown>).tenantId as number | undefined
  const resolved = storeTenantId ?? deriveTenantId
  if (!resolved || resolved === 0) {
    throw new Error('Tenant ID is required')
  }
  return resolved
}
```

---

### 🟠 HIGH

#### H1 — N+1 queries in performance report (2 extra queries per cycle)

**File:** `reporting.service.ts:319-374`

For each unique `cycleId` in the result set, two separate queries are executed:
1. Cumulative feed query (lines 324-337)
2. Cumulative mortality query (lines 353-367)

With 5 cycles on a page of 20 recordings, this produces **1 (main) + 1 (count) + 10 (N+1) = 12 queries** per request. This will degrade significantly as the number of cycles grows.

**Fix:** Replace with a single query using window functions, or pre-fetch all cumulative data in 2 batch queries (one for feed, one for mortality) filtered by the set of `cycleIds`:

```typescript
// Batch approach: 2 queries instead of 2*N
const feedRows = await db
  .select({
    cycleId: dailyRecordingsTable.cycleId,
    recordingDate: dailyRecordingsTable.recordingDate,
    cumulativeFeed: sql<number>`sum(${dailyRecordingsTable.feedConsumedKg}) 
      over (partition by ${dailyRecordingsTable.cycleId} order by ${dailyRecordingsTable.recordingDate})`,
  })
  .from(dailyRecordingsTable)
  .where(inArray(dailyRecordingsTable.cycleId, cycleIds))
  // ...
```

#### H2 — In-memory pagination for stock resume (fetches ALL rows)

**File:** `reporting.service.ts:142-234`

The `getStockResume` function fetches **all** stock rows from the database (no `LIMIT`/`OFFSET` on the SQL query), groups them in memory, then slices for pagination. This means:
- Every request fetches the entire dataset regardless of page
- Memory usage scales linearly with total data size
- The DB does full table scans on every request

**Fix:** Apply pagination at the database level. First count distinct `feedProductId` values matching the filters, then query only the needed page of products, and finally fetch stock rows for just those products:

```typescript
// 1. Count matching products
const [{ count }] = await db.select({ count: sql<number>`count(distinct ${feedStockTable.feedProductId})` })
  .from(feedStockTable)
  .innerJoin(...)
  .where(and(...conditions))

// 2. Get product IDs for this page
const productIds = await db.select({ id: feedStockTable.feedProductId })
  .from(feedStockTable)
  .innerJoin(...)
  .where(and(...conditions))
  .groupBy(feedStockTable.feedProductId)
  .limit(limit).offset(offset)

// 3. Fetch stock rows only for those products
```

#### H3 — Error responses return HTTP 200 instead of 4xx

**File:** `reporting.controller.ts:21-23, 50-52, 81-83, 111-113`

All four endpoints return `{ error: 'Tenant ID is required', code: 'MISSING_TENANT_ID' }` without setting the HTTP status code. Elysia defaults to 200 OK for returned objects. This means:
- Clients receive a 200 response with an error body
- API consumers must check the response body for errors instead of relying on status codes
- Monitoring/alerting systems won't catch these errors

**Fix:** Set the appropriate status code before returning:

```typescript
if (!currentTenantId || currentTenantId === 0) {
  set.status = 400  // or 403 depending on semantics
  return { error: 'Tenant ID is required', code: 'MISSING_TENANT_ID' }
}
```

#### H4 — FCR calculation uses live weight instead of weight gain

**File:** `reporting.service.ts:399-413`

The comment says:
```
// FCR: cumulative feed consumed / (weight gain * population)
```

But the code calculates:
```typescript
const totalWeightKg = (avgBodyWeightG / 1000) * remainingPopulation
fcr = cumulativeFeedKg / totalWeightKg
```

This uses **current live weight** (`avgBodyWeightG × remainingPopulation`), not **weight gain**. In poultry farming, FCR = cumulative feed consumed / cumulative weight gain. Using live weight instead of weight gain produces incorrect FCR values, especially early in a cycle when birds are small (FCR would appear artificially high).

**Fix:** Calculate weight gain from the cycle's starting weight (typically 0 for day-old chicks) or track cumulative weight gain:

```typescript
// Weight gain = current avg weight - starting avg weight (typically ~0 for DOC)
// For DOC: weightGain = avgBodyWeightG (since starting weight ≈ 0)
// Total weight gained = weightGain * remainingPopulation
const weightGainG = avgBodyWeightG // assuming DOC start at ~0g
const totalWeightGainKg = (weightGainG / 1000) * remainingPopulation
fcr = cumulativeFeedKg / totalWeightGainKg
```

Or better, store and use the initial body weight from the cycle to compute actual gain.

---

### 🟡 MEDIUM

#### M1 — Export endpoints fetch up to 10,000 rows without rate limiting

**File:** `reporting.controller.ts:89-91, 119-121`

```typescript
limit: 10000,
```

The export endpoints hardcode `limit: 10000`. For large datasets, this:
- Generates massive CSV files that could exhaust memory
- Has no rate limiting, allowing repeated large exports
- Could be used for data exfiltration

**Fix:** Add rate limiting on export endpoints. Consider streaming the CSV response instead of building it in memory. Add a configurable max export size.

#### M2 — Cache doesn't invalidate on data mutations

**File:** `reporting.service.ts:88-115`

The Redis cache uses TTL-only expiration (60s for stock, 300s for performance). If a user creates/updates/deletes a recording or stock entry, the cached report will serve stale data for up to 5 minutes. There's no cache invalidation triggered by mutations.

**Fix:** Add cache invalidation in the mutation services (feed stock updates, daily recording CRUD) by deleting the relevant cache keys:

```typescript
// In feed stock update service:
await redis.del(`reporting:stock-resume:${tenantId}:*`)
// Or use pattern-based invalidation with SCAN
```

#### M3 — `StockResumeFilters.dateFrom`/`dateTo` are defined but never used

**File:** `reporting.service.ts:18-19`

The `StockResumeFilters` interface includes `dateFrom` and `dateTo` fields, and the cache key includes them, but the `getStockResume` function never applies these filters. The `feed_stock` table has no date column, so these filters cannot be applied. Their presence in the interface is misleading.

**Fix:** Remove `dateFrom` and `dateTo` from `StockResumeFilters` and the cache key, or document that they are reserved for future use.

#### M4 — Window function + GROUP BY in cumulative feed query is fragile

**File:** `reporting.service.ts:324-337`

```typescript
const feedRows = await db
  .select({
    recordingDate: dailyRecordingsTable.recordingDate,
    cumulativeFeed: sql<number>`cast(sum(${dailyRecordingsTable.feedConsumedKg}) 
      over (order by ${dailyRecordingsTable.recordingDate}) as decimal(10,3))`,
  })
  .from(dailyRecordingsTable)
  .where(...)
  .groupBy(dailyRecordingsTable.recordingDate)
  .orderBy(dailyRecordingsTable.recordingDate)
```

The query combines `GROUP BY` with a window function `sum() over (order by ...)`. The window function operates on the post-GROUP BY result set. Since the schema allows multiple recordings per (cycleId, recordingDate) (due to soft deletes), this could produce incorrect cumulative sums if there are duplicate dates with different feed values.

**Fix:** Use a subquery approach or ensure the GROUP BY correctly aggregates before the window function:

```sql
SELECT recording_date,
       SUM(daily_sum) OVER (ORDER BY recording_date) AS cumulative_feed
FROM (
  SELECT recording_date, SUM(feed_consumed_kg) AS daily_sum
  FROM daily_recordings
  WHERE cycle_id = ? AND deleted_at IS NULL
  GROUP BY recording_date
) subq
```

#### M5 — Default `zakKgConversion` of '50' masks data quality issues

**File:** `reporting.service.ts:183, 200`

```typescript
const conversion = parseFloat(product.zakKgConversion || '50')
```

If `zakKgConversion` is null or empty, the code silently defaults to 50. This could produce incorrect stock calculations without any warning. A missing conversion factor should be flagged rather than silently defaulted.

**Fix:** Log a warning when the conversion factor is missing, or exclude products with no conversion factor from the report with an explicit indicator.

#### M6 — No `deletedAt` filter on `feedStock` rows (by design, but worth noting)

**File:** `reporting.service.ts:131`

The `feed_stock` table has no `deletedAt` column, so there's no soft-delete filter on stock rows. If a plasma is soft-deleted, its stock rows are still accessible through the join (since `plasmasTable.deletedAt` IS filtered). However, if a feed product is soft-deleted, the stock rows referencing it would still appear in the main query (since `feedProductsTable` is not joined in the main query). The separate product query filters by `isNull(feedProductsTable.deletedAt)`, so the product info would be missing, and the row would be skipped via `if (!product) continue`. This works but is fragile.

**Fix:** Consider joining `feedProductsTable` in the main stock query and filtering by `isNull(feedProductsTable.deletedAt)` to avoid fetching orphaned stock rows.

---

### 🔵 LOW

#### L1 — Redundant/duplicate imports

**File:** `reporting.service.ts:3-9`

```typescript
import { feedStock, feedProducts, dailyRecordings, cycles } from '../../db/schema'
import { feedStock as feedStockTable } from '../../db/schema/feed_stock'
import { feedProducts as feedProductsTable } from '../../db/schema/feed_products'
import { dailyRecordings as dailyRecordingsTable } from '../../db/schema/daily_recordings'
import { cycles as cyclesTable } from '../../db/schema/cycles'
```

Lines 3 and 4-7 import the same tables under different names. The namespace imports (`feedStock`, `feedProducts`, etc.) from `../../db/schema` are unused — only the aliased imports (`feedStockTable`, etc.) are used.

**Fix:** Remove the unused namespace import on line 3.

#### L2 — CSV export skips products with no plasmas

**File:** `reporting.service.ts:474-498`

The `stockResumeToCSV` function iterates `row.plasmas` for each product. If a product has an empty `plasmas` array, it produces no CSV row, making the product invisible in the export.

**Fix:** Add a summary row even when `plasmas` is empty, or document this behavior.

#### L3 — No request-level error handling in service functions

**File:** `reporting.service.ts`

Both `getStockResume` and `getPerformanceReport` have no try/catch. Database errors will propagate as unhandled 500 errors. While Elysia's global error handler may catch these, explicit error handling with meaningful messages would improve debuggability.

**Fix:** Wrap service functions in try/catch with domain-specific error messages:

```typescript
try {
  // ... query logic
} catch (err) {
  throw new Error(`Failed to generate stock resume: ${err.message}`)
}
```

#### L4 — `getTenantId` function should be a shared utility

**File:** `reporting.controller.ts:10-14`

The `getTenantId` function is defined locally in the controller. If other controllers need the same logic, this should be extracted to a shared module to avoid duplication and ensure consistent tenant resolution.

#### L5 — Cache key uses string concatenation with `??` fallbacks

**File:** `reporting.service.ts:91-97`

The cache key construction uses template literals with `?? 'all'` and `?? 'na'` fallbacks. If a filter value is `0` (which is falsy but valid for some numeric IDs), the fallback would incorrectly activate. However, since the validation requires `minimum: 1`, this is not currently exploitable.

---

## Verdict

| Severity | Count | Must Fix Before Merge |
|----------|-------|-----------------------|
| 🔴 CRITICAL | 1 | ✅ Yes (C1) |
| 🟠 HIGH | 4 | ✅ Yes (H1, H2, H3, H4) |
| 🟡 MEDIUM | 6 | ⚠️ Recommended (M1-M6) |
| 🔵 LOW | 5 | ❌ Optional |

**Overall Assessment:** The module has a critical tenant isolation bypass that must be fixed before merge. The N+1 queries and in-memory pagination will cause performance problems at scale. The FCR calculation logic error will produce incorrect business metrics. These should all be addressed before the phase is considered complete.