# Phase 6 — Feed Inventory: Code Review Fix Summary

**Date:** 2026-04-17
**Reviewer:** Automated fix from code review findings

---

## Fixes Applied

### 🔴 C-01: Multi-Tenancy Data Leak — FIXED

**Problem:** `tenantId` accepted but never used in queries. Feed tables lacked tenant isolation, allowing cross-tenant data access.

**Fix:** Applied the same pattern as Phase 5 (recordings/cycles):

1. **`feed_products` schema** — Added `tenantId` column with FK to `tenants` table. Changed unique constraint from `code` alone to `(tenantId, code)` so each tenant can have its own product codes. Added index on `tenantId`.

2. **`feed.service.ts`** — All functions now enforce tenant isolation:
   - `createFeedProduct` — Filters duplicate check by `tenantId`, inserts `tenantId`
   - `listFeedProducts` — Filters by `tenantId`
   - `getFeedProduct` — Filters by `tenantId`
   - `updateFeedProduct` — Filters by `tenantId`
   - `softDeleteFeedProduct` — Filters by `tenantId`
   - `createSuratJalan` — Verifies `plasmaId` belongs to tenant via `plasmas → units` join; filters product lookup by `tenantId`
   - `getStockForPlasmaFeed` — Verifies `plasmaId` belongs to tenant; filters product by `tenantId`
   - `getAllStock` — Joins `feed_stock → plasmas → units` and filters by `units.tenantId`; filters products by `tenantId`
   - `recordFeedConsumption` — Verifies `plasmaId` belongs to tenant; filters product by `tenantId`

3. **New helper** — `verifyPlasmaInTenant()` function validates that a plasma belongs to the current tenant via `plasmas.unitId → units.tenantId`.

4. **New error** — `PlasmaNotInTenantError` thrown when a plasma doesn't belong to the requesting tenant.

5. **`feed.controller.ts`** — Added 403 handler for `PlasmaNotInTenantError`.

**Files changed:** `feed_products.ts`, `feed.service.ts`, `feed.errors.ts`, `feed.controller.ts`

---

### 🟠 H-01: Race Condition — Stock Read Outside Transaction — FIXED

**Problem:** `recordFeedConsumption` read stock outside the transaction, creating a TOCTOU window for stale reads and lost updates.

**Fix:**
- Moved product lookup and stock read **inside** the transaction
- Added `.for('update')` row lock on the stock SELECT to prevent concurrent modifications
- Negative stock check now happens inside the transaction with the row lock held
- Stock update uses **atomic SQL increments** (`SET totalOutKg = totalOutKg + <delta>`) instead of absolute values to prevent lost updates

**Files changed:** `feed.service.ts`

---

### 🟠 H-02: TOCTOU on Surat Jalan Number — FIXED

**Problem:** Duplicate `suratJalanNumber` check happened outside the transaction, allowing two concurrent requests to both pass the check.

**Fix:**
- Moved the duplicate check **inside** the existing transaction
- Added `try/catch` for MySQL `ER_DUP_ENTRY` (errno 1062) as a fallback, converting it to `InvalidSuratJalanError`
- The DB unique constraint `uq_surat_jalan_number` serves as the authoritative guard

**Files changed:** `feed.service.ts`

---

### 🟠 H-03: TOCTOU on Feed Product Code — FIXED

**Problem:** Duplicate `feedProduct.code` check happened outside any transaction.

**Fix:**
- Wrapped `createFeedProduct` in a `db.transaction()`
- Moved the duplicate check **inside** the transaction
- Added `try/catch` for MySQL `ER_DUP_ENTRY` (errno 1062) as a fallback, converting it to `DuplicateFeedCodeError`
- The DB unique constraint `uq_feed_products_code` (now on `(tenantId, code)`) serves as the authoritative guard

**Files changed:** `feed.service.ts`

---

### 🟡 M-07: Error Classes Missing Prototype Chain — FIXED (bonus)

**Problem:** Custom error classes didn't set `Object.setPrototypeOf(this, new.target.prototype)`, causing `instanceof` checks to fail in some TS compilation targets.

**Fix:** Added `Object.setPrototypeOf(this, new.target.prototype)` to all error class constructors.

**Files changed:** `feed.errors.ts`

---

### 🟡 M-06: Stock Updates Use Absolute Values — FIXED (bonus)

**Problem:** Both `createSuratJalan` and `recordFeedConsumption` computed new stock values by reading current values in JS and writing absolute results — the "read-modify-write" anti-pattern.

**Fix:** Changed to atomic SQL increments using Drizzle's `sql` template:
- `createSuratJalan`: `SET totalInKg = totalInKg + <delta>, closingStockKg = closingStockKg + <delta>`
- `recordFeedConsumption`: `SET totalOutKg = totalOutKg + <delta>, closingStockKg = closingStockKg - <delta>`

**Files changed:** `feed.service.ts`

---

## Files Modified

| File | Changes |
|------|---------|
| `server/src/db/schema/feed_products.ts` | Added `tenantId` column, changed unique constraint to `(tenantId, code)`, added tenant index |
| `server/src/modules/feed/feed.errors.ts` | Added `PlasmaNotInTenantError`, added `Object.setPrototypeOf` to all error classes |
| `server/src/modules/feed/feed.service.ts` | Tenant filtering on all queries, transaction fixes for H-01/H-02/H-03, atomic SQL increments, `verifyPlasmaInTenant` helper |
| `server/src/modules/feed/feed.controller.ts` | Added `PlasmaNotInTenantError` handler (403) |

---

## Migration Required

The `feed_products` table schema change requires a database migration:
- Add `tenant_id INT NOT NULL` column with FK to `tenants(id)`
- Add index `idx_feed_products_tenant` on `tenant_id`
- Change unique constraint from `uq_feed_products_code(code)` to `uq_feed_products_code(tenant_id, code)`
- Existing rows need a `tenant_id` value populated (data migration)

Run `bunx drizzle-kit generate` and `bunx drizzle-kit migrate` after deploying.

---

## Remaining Items (Not in Scope)

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| M-1 | 🟡 MEDIUM | `x-tenant-id` header fallback is spoofable | Deferred |
| M-2 | 🟡 MEDIUM | `userId` derived from session cookie | Deferred |
| M-3 | 🟡 MEDIUM | `listFeedProducts` doesn't filter by `isActive` | Deferred |
| M-4 | 🟡 MEDIUM | `consumptionZak` validation allows zero | Deferred |
| M-5 | 🟡 MEDIUM | Audit logs missing `tenantId` | Deferred |
| M-8 | 🟡 MEDIUM | `notes` field has no length limit | Deferred |
| L-1 | 🔵 LOW | Audit log failures silently swallowed | Deferred |
| L-2 | 🔵 LOW | `parseInt` without NaN guard | Deferred |
| L-3 | 🔵 LOW | Decimal/string type impedance mismatch | Deferred |
| L-4 | 🔵 LOW | `feed.routes.ts` is a trivial re-export | Deferred |
| L-5 | 🔵 LOW | Inconsistent error response format | Deferred |
| L-6 | 🔵 LOW | Two separate queries could be a JOIN | Deferred |