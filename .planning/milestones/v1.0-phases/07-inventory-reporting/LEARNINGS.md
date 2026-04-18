# Phase 7 — Learnings: Inventory Resume & Reporting

**Extracted:** 2026-04-17  
**Source Artifacts:** 07-01-PLAN.md, 07-REVIEW.md, 07-REVIEW-FIX.md, 07-01-CONTEXT.md

---

## Decisions Made

### D1 — Tenant ID Resolution Strategy
- **Decision:** Tenant ID must come exclusively from authenticated session store, never from HTTP headers
- **Rationale:** Header-based fallback creates a critical security vulnerability allowing tenant isolation bypass
- **Alternative Considered:** Keep header fallback for dev/testing convenience — rejected due to security risk

### D2 — Pagination Strategy for Stock Resume
- **Decision:** Implement true SQL-level pagination (3-step: count → paginated IDs → fetch rows)
- **Rationale:** In-memory pagination fetches entire dataset regardless of page size, causing performance degradation at scale
- **Alternative Considered:** Simple LIMIT/OFFSET — insufficient due to join complexity with multiple tables

### D3 — FCR Formula Interpretation
- **Decision:** For DOC (day-old chicks), weight gain ≈ current body weight (starting weight ≈ 0g)
- **Rationale:** The arithmetic for DOC yields the same result whether using "live weight" or "weight gain" terminology, but naming matters for maintainability and future extension (non-DOC cycles)
- **Alternative Considered:** Use actual starting weight from cycle — deferred for future phase

### D4 — Export Format Priority
- **Decision:** CSV first, Excel deferred
- **Rationale:** CSV is simpler to implement and universally compatible; Excel can be added in Phase 10 if needed

---

## Lessons Learned

### L1 — Critical Security Issues Must Be Caught Early
The tenant isolation bypass (C1) was a fundamental architectural flaw that should have been caught in the design phase. When implementing multi-tenant systems, tenant resolution logic should be centralized and validated before any data access.

### L2 — N+1 Query Patterns Are Costly at Scale
Performance report originally made 2 queries per cycle. With 5 cycles × 20 recordings = 12 queries per request. The batch query approach reduced this to 4 queries regardless of cycle count.

**Takeaway:** Always analyze query count based on worst-case pagination scenarios before implementing aggregation features.

### L3 — In-Memory Pagination Is a Trap
Fetching all rows then paginating in JavaScript seems simple but creates:
- Linear memory growth with data size
- Full table scans on every request
- No benefit from database indexing

**Takeaway:** Design pagination at the SQL level from the start, especially for aggregate queries.

### L4 — Error Handling Must Set HTTP Status Codes
Elysia's default behavior returns 200 OK for any returned object. Error responses without explicit status codes create ambiguous client behavior.

**Takeaway:** Always set `set.status` explicitly for error responses, or use centralized error handlers.

### L5 — Cache Invalidation Is an Afterthought
TTL-only expiration (60s/300s) leaves stale data in the gap between mutation and expiration. The review noted this but it remained unfixed in the fix pass.

**Takeaway:** Cache invalidation should be designed alongside caching, not added later.

---

## Patterns Discovered

### P1 — Centralized Error Handling in Elysia
```typescript
controller
  .onError(({ code, set }) => {
    if (code === 'MISSING_TENANT_ID') {
      set.status = 400
      return { error: 'Tenant ID is required', code }
    }
  })
```
This pattern works well for consistent error responses across multiple endpoints.

### P2 — Batch Query Pattern for N+1 Avoidance
Instead of looping and querying per entity:
```typescript
// Before: N+1
for (const cycleId of cycleIds) {
  await db.select(...).where(eq(cycleId, cycleId))
}

// After: 2 batch queries
const cycleIds = [...new Set(recordings.map(r => r.cycleId))]
await db.select(...).where(inArray(cycleId, cycleIds))
```

### P3 — Three-Step SQL Pagination
For complex joins with GROUP BY, pagination requires:
1. Count total distinct entities (for metadata)
2. Get paginated entity IDs (LIMIT/OFFSET)
3. Fetch related data only for those IDs (IN ARRAY)

---

## Surprises

### S1 — Unused Filter Fields in Interfaces
`StockResumeFilters` included `dateFrom` and `dateTo` but the function never used them. The `feed_stock` table has no date column to filter by. This went unnoticed through implementation.

**Implication:** Code review caught this, but it's a reminder to audit interfaces against actual usage.

### S2 — Window Functions + GROUP BY Interaction
The cumulative feed query combined `GROUP BY` with a window function. The reviewer noted this is fragile because the window operates on post-GROUP BY results, which could produce incorrect cumulative sums with duplicate dates.

**Implication:** Complex SQL with window functions needs careful validation against edge cases.

### S3 — Default Conversion Factor Masks Data Quality
The code silently defaults `zakKgConversion` to 50 when null. This means missing data produces results instead of errors, which could hide data quality issues.

**Implication:** Silent defaults on critical business calculations should at minimum log warnings.

---

## Unresolved (From Review)

| Finding | Severity | Status | Reason |
|---------|----------|--------|--------|
| M1 — Export rate limiting | Medium | Not fixed | Deferred |
| M2 — Cache invalidation | Medium | Not fixed | Requires coordination with mutation services |
| M3 — Unused date filters | Medium | Not fixed | Interface cleanup deferred |
| M4 — Window+GROUP BY fragility | Medium | Not fixed | Works for current data model |
| M5 — Default zakKgConversion | Medium | Not fixed | Would need logging infrastructure |
| M6 — Missing deletedAt on feedStock join | Medium | Not fixed | Current logic works but fragile |
| L1-L5 — Low findings | Low | Not fixed | Optional |

---

## Key Files Created/Modified

| File | Purpose |
|------|---------|
| `server/src/modules/reporting/reporting.service.ts` | Stock resume + performance report logic |
| `server/src/modules/reporting/reporting.controller.ts` | API endpoints with RBAC guards |
| `server/src/modules/reporting/reporting.routes.ts` | Route exports |
| `tests/unit/reporting.test.ts` | CSV export unit tests |

---

## Metrics

- **Duration:** ~10 min (estimated)
- **Files Modified:** 3
- **Tests Added:** 11
- **Critical/High Fixes Applied:** 5