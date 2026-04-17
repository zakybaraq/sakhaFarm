# Phase 6 — Feed Inventory Management: Code Review

**Date:** 2026-04-17  
**Reviewer:** Automated Code Review  
**Depth:** Standard  
**Files Reviewed:**
- `server/src/modules/feed/feed.controller.ts`
- `server/src/modules/feed/feed.service.ts`
- `server/src/modules/feed/feed.errors.ts`
- `server/src/modules/feed/feed.routes.ts`
- `server/src/db/schema/feed_surat_jalan.ts`
- `server/src/db/schema/feed_products.ts`
- `server/src/db/schema/feed_stock.ts` (context)
- `server/src/db/schema/feed_movements.ts` (context)

---

## Summary

Phase 6 introduces feed inventory management with CRUD for feed products, surat jalan (delivery document) processing, stock tracking, and feed consumption recording. The implementation has **1 critical multi-tenancy data leak**, **2 high-severity race conditions**, and several medium/low issues.

---

## 🔴 CRITICAL

### C1: Multi-Tenancy Data Isolation — `tenantId` accepted but never used in queries

**Files:** `feed.service.ts` (all functions), `feed.controller.ts` (all handlers)

Every service function accepts `tenantId` as a parameter, and every controller handler extracts and validates it — but **no database query filters by tenant**. The feed tables (`feed_products`, `feed_stock`, `feed_surat_jalan`, `feed_movements`) lack a `tenant_id` column entirely.

**Impact:** Any authenticated user from any tenant can read, modify, or delete any other tenant's feed data. This is a cross-tenant data leak.

**Affected functions:**
- `listFeedProducts(tenantId)` — line 87: no `WHERE tenant_id = ?`
- `getFeedProduct(id, tenantId)` — line 96: no tenant filter
- `updateFeedProduct(id, input, tenantId, userId)` — line 110: no tenant filter
- `softDeleteFeedProduct(id, tenantId, userId)` — line 151: no tenant filter
- `createSuratJalan(input, tenantId, userId)` — line 186: no tenant filter on product lookup or stock
- `getStockForPlasmaFeed(plasmaId, feedProductId, tenantId)` — line 306: no tenant filter
- `getAllStock(tenantId, ...)` — line 352: no tenant filter
- `recordFeedConsumption(input, tenantId, userId)` — line 410: no tenant filter

**Fix:** Add `tenant_id` column to all four feed tables and filter every query by tenant. Alternatively, if tenant isolation is handled at the plasma level (plasmas belong to tenants), ensure every query joins through `plasmas.tenant_id`.

---

## 🟠 HIGH

### H1: Race condition in `recordFeedConsumption` — stock read outside transaction

**File:** `feed.service.ts`, lines 435–487

The stock row is read **outside** the transaction (lines 435–448), the negative-stock check is performed on that stale data (line 458), and then the update happens inside a transaction (lines 466–487). Between the read and the transaction start, another request could modify the same stock row, causing:

1. **Stale negative-stock check** — the check passes but the actual stock is already lower
2. **Lost update** — the `SET totalOutKg = <absolute>` overwrites concurrent changes

```typescript
// Read happens HERE — outside transaction
const stockRows = await db.select().from(feedStockTable)...  // line 435

// ... stale check ...
if (closingKg < 0) { throw new NegativeStockError(...) }  // line 458

// Transaction starts HERE — too late
await db.transaction(async (tx) => {  // line 466
  await tx.insert(feedMovementsTable)...  // line 467
  await tx.update(feedStockTable).set({...})  // line 479
})
```

**Fix:** Move the stock read inside the transaction and use `SELECT ... FOR UPDATE` (or Drizzle's equivalent `.for('update')`) to acquire a row lock. Alternatively, use atomic SQL: `SET totalOutKg = totalOutKg + <delta>, closingStockKg = closingStockKg - <delta>`.

### H2: TOCTOU race on duplicate `suratJalanNumber` check

**File:** `feed.service.ts`, lines 191–199

The uniqueness check for `suratJalanNumber` happens **outside** the transaction. Two concurrent requests with the same number could both pass the check, then one would fail with a database unique constraint violation (which is unhandled and would result in a 500 error instead of the intended 409).

```typescript
// Outside transaction — TOCTOU window
const existingSJ = await db.select(...).where(eq(...suratJalanNumber, ...))  // line 191
if (existingSJ.length > 0) { throw new InvalidSuratJalanError(...) }  // line 197

// Transaction starts later
await db.transaction(async (tx) => { ... })  // line 211
```

**Fix:** Move the duplicate check inside the transaction, or catch the DB unique constraint error and convert it to `InvalidSuratJalanError`. The DB already has a unique index (`uq_surat_jalan_number`), so catching the constraint violation is the most reliable approach.

### H3: TOCTOU race on duplicate `feedProduct.code` check

**File:** `feed.service.ts`, lines 51–58

Same pattern as H2. The duplicate code check is outside any transaction. Concurrent requests with the same code could both pass, then one fails with an unhandled DB unique constraint error.

**Fix:** Same as H2 — either move inside a transaction or catch the DB constraint error.

---

## 🟡 MEDIUM

### M1: `x-tenant-id` header fallback is spoofable

**File:** `feed.controller.ts`, lines 22–26

```typescript
function getTenantId(store, headers, deriveTenantId) {
  const storeTenantId = store.tenantId
  const headerTenantId = parseInt(headers['x-tenant-id'] || '0', 10)
  return storeTenantId ?? deriveTenantId ?? headerTenantId
}
```

If both `storeTenantId` and `deriveTenantId` are null/undefined, the `x-tenant-id` header is trusted. A malicious user could set this header to access another tenant's data. Combined with C1 (no tenant filtering), this is especially dangerous.

**Fix:** Remove the header fallback or validate it against the authenticated user's actual tenant.

### M2: `userId` derived from session cookie value, not actual user ID

**File:** `feed.controller.ts`, lines 58–59, 114–115, 161–162, 214–215

```typescript
const sessionId = cookie.auth_session?.value as string | undefined
const userId = sessionId || 'system'
```

The session cookie value is a session ID, not a user ID. Using it as `userId` in audit logs means audit trails record session tokens instead of user identifiers. This makes audit log analysis unreliable.

**Fix:** Resolve the actual user ID from the session (e.g., via a session store lookup) rather than using the raw session cookie value.

### M3: `listFeedProducts` doesn't filter by tenant or active status

**File:** `feed.service.ts`, lines 87–94

```typescript
export async function listFeedProducts(tenantId: number) {
  const products = await db
    .select()
    .from(feedProductsTable)
    .where(isNull(feedProductsTable.deletedAt))
  return products
}
```

- `tenantId` parameter is unused (see C1)
- Only filters by `deletedAt`, not by `isActive`. Soft-deleted products set `isActive = 0` but this isn't filtered separately.

### M4: `consumptionZak` validation allows zero

**File:** `feed.controller.ts`, line 227

```typescript
consumptionKg: t.Number({ minimum: 0, exclusiveMinimum: true }),
consumptionZak: t.Optional(t.Number({ minimum: 0 })),  // allows 0
```

`consumptionKg` correctly uses `exclusiveMinimum: true` to reject zero, but `consumptionZak` allows zero. If a user provides `consumptionZak: 0`, it would be stored as zero zak consumed, which is semantically meaningless.

**Fix:** Add `exclusiveMinimum: true` to `consumptionZak` as well, or remove it from input and always compute from kg.

### M5: Missing `tenantId` in audit log entries

**File:** `feed.service.ts`, lines 73–82, 136–146, 172–178, 279–287, 490–506

All audit log inserts lack a `tenantId` field. The `audit_logs` table doesn't have a `tenant_id` column either. This makes it impossible to filter audit logs by tenant for compliance or debugging.

**Fix:** Add `tenant_id` to the `audit_logs` table and include it in all audit log inserts.

### M6: Stock update uses absolute values instead of atomic increments

**File:** `feed.service.ts`, lines 267–274, 479–486

Both `createSuratJalan` and `recordFeedConsumption` compute new stock values by reading the current value, adding/subtracting in JS, then writing the absolute result. This is the "read-modify-write" anti-pattern that causes lost updates under concurrency.

```typescript
// createSuratJalan — absolute write
const newInKg = currentInKg + input.totalKg
await tx.update(feedStockTable).set({ totalInKg: newInKg.toString(), ... })
```

**Fix:** Use SQL arithmetic: `SET totalInKg = totalInKg + <delta>` via Drizzle's `sql` template.

### M7: Error classes missing proper prototype chain

**File:** `feed.errors.ts`, all classes

Custom error classes extend `Error` but don't set the prototype chain:

```typescript
export class FeedProductNotFoundError extends Error {
  constructor(id: number) {
    super(`Feed product "${id}" not found`)
    this.name = 'FeedProductNotFoundError'
    // Missing: Object.setPrototypeOf(this, new.target.prototype)
  }
}
```

In some TypeScript compilation targets (especially ES5), `instanceof` checks can fail without explicit prototype setup. The `onError` handler in the controller relies on `instanceof` checks.

**Fix:** Add `Object.setPrototypeOf(this, new.target.prototype)` to each error class constructor.

### M8: `notes` field in surat jalan has no length limit

**File:** `feed.controller.ts`, line 179

```typescript
notes: t.Optional(t.String()),
```

The `notes` field accepts unlimited-length strings, but the DB column is `text` (which is fine for MySQL). However, no sanitization or length limit is enforced at the API level, allowing arbitrarily large payloads.

**Fix:** Add `maxLength` to the validation: `t.Optional(t.String({ maxLength: 2000 }))`.

---

## 🔵 LOW

### L1: Fire-and-forget audit logging silently swallows errors

**File:** `feed.service.ts`, lines 80–82, 144–146, 179–181, 285–287, 504–506

```typescript
} catch {
  // Fire-and-forget audit logging
}
```

While intentional, this means audit log failures are completely invisible. No logging, no metrics, no alerting.

**Fix:** At minimum, log the error with `console.error` or a logger. Consider adding monitoring/alerting for audit failures.

### L2: `parseInt(params.id, 10)` without NaN guard

**File:** `feed.controller.ts`, lines 97, 117, 144

Though Elysia validates `format: 'integer'` on the `id` param, the controller still uses `parseInt` which could theoretically produce `NaN` for edge cases. The validation should make this safe, but a defensive guard would be prudent.

### L3: `proteinPercent` and `zakKgConversion` type impedance mismatch

**File:** `feed.service.ts`, `feed_products.ts` schema

The DB schema uses `decimal` (stored as strings in Drizzle), but the TypeScript interfaces use `number`. The service manually converts with `.toString()` and `parseFloat()`. This creates a subtle bug surface — e.g., `parseFloat("12.345")` loses precision beyond the schema's `scale: 2`.

### L4: `feed.routes.ts` is a trivial re-export

**File:** `feed.routes.ts`

```typescript
export { feedController } from './feed.controller'
```

This file adds no value. Consider removing it and importing directly from `feed.controller`.

### L5: Inconsistent error response format

**File:** `feed.controller.ts`

Error responses from `onError` use `{ error, code }` format, but the tenant ID check returns `{ error, code }` with a different semantic meaning (missing input vs. resource not found). Consider using a consistent error envelope across all responses.

### L6: `getStockForPlasmaFeed` makes two separate DB queries

**File:** `feed.service.ts`, lines 306–349

The function queries `feedStock` then separately queries `feedProducts`. This could be a single JOIN query for better performance.

---

## Findings Summary

| ID | Severity | Category | File | Description |
|----|----------|----------|------|-------------|
| C1 | 🔴 CRITICAL | Security | feed.service.ts | tenantId accepted but never used in queries — cross-tenant data leak |
| H1 | 🟠 HIGH | Bug | feed.service.ts | Race condition: stock read outside transaction in recordFeedConsumption |
| H2 | 🟠 HIGH | Bug | feed.service.ts | TOCTOU race on suratJalanNumber uniqueness check |
| H3 | 🟠 HIGH | Bug | feed.service.ts | TOCTOU race on feedProduct.code uniqueness check |
| M1 | 🟡 MEDIUM | Security | feed.controller.ts | x-tenant-id header fallback is spoofable |
| M2 | 🟡 MEDIUM | Security | feed.controller.ts | userId derived from session cookie, not actual user ID |
| M3 | 🟡 MEDIUM | Bug | feed.service.ts | listFeedProducts doesn't filter by tenant or isActive |
| M4 | 🟡 MEDIUM | Bug | feed.controller.ts | consumptionZak validation allows zero |
| M5 | 🟡 MEDIUM | Security | feed.service.ts | Audit logs missing tenantId |
| M6 | 🟡 MEDIUM | Bug | feed.service.ts | Stock updates use absolute values (lost update risk) |
| M7 | 🟡 MEDIUM | Bug | feed.errors.ts | Error classes missing prototype chain setup |
| M8 | 🟡 MEDIUM | Security | feed.controller.ts | notes field has no length limit |
| L1 | 🔵 LOW | Quality | feed.service.ts | Audit log failures silently swallowed |
| L2 | 🔵 LOW | Quality | feed.controller.ts | parseInt without NaN guard |
| L3 | 🔵 LOW | Quality | feed.service.ts | Decimal/string type impedance mismatch |
| L4 | 🔵 LOW | Quality | feed.routes.ts | Trivial re-export adds no value |
| L5 | 🔵 LOW | Quality | feed.controller.ts | Inconsistent error response format |
| L6 | 🔵 LOW | Performance | feed.service.ts | Two separate queries could be a JOIN |

---

## Recommended Priority

1. **Fix C1 immediately** — Add tenant isolation to all feed queries before any production deployment
2. **Fix H1, H2, H3** — Move reads inside transactions, use `SELECT FOR UPDATE` or atomic SQL updates
3. **Fix M1, M2** — Remove header-based tenant fallback; resolve actual user ID from session
4. **Fix M6** — Convert to atomic SQL increments for stock updates
5. **Address remaining M/L items** in subsequent iterations