# Phase 4 Code Review — Unit, Plasma & Cycle CRUD

**Reviewer**: Automated code review  
**Date**: 2026-04-17  
**Scope**: Phase 4.01–4.03 (Unit, Plasma, Cycle modules + schemas)  
**Depth**: Standard (per-file analysis)

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 3 |
| 🟠 HIGH | 6 |
| 🟡 MEDIUM | 7 |
| 🔵 LOW | 5 |

---

## 🔴 CRITICAL Findings

### C-01: Tenant ID bypass via `x-tenant-id` header

**Files**: `unit.controller.ts:18`, `plasma.controller.ts:18`, `cycle.controller.ts:23`

```ts
const headerTenantId = parseInt(headers['x-tenant-id'] || '0', 10)
return storeTenantId ?? deriveTenantId ?? headerTenantId
```

The `getTenantId` function falls back to reading `x-tenant-id` from request headers. Any authenticated user can set this header to impersonate another tenant and access/modify their data. The nullish coalescing chain means if `storeTenantId` and `deriveTenantId` are both `null`/`undefined`, the attacker-controlled header value is trusted.

**Fix**: Remove the header fallback entirely. Tenant ID must come exclusively from the authenticated session/middleware, never from user-supplied headers.

---

### C-02: All error responses return HTTP 200

**Files**: All three controllers' `.onError()` handlers

```ts
.onError(({ error }) => {
  if (error instanceof UnitNotFoundError) {
    return { error: error.message, code: 'UNIT_NOT_FOUND' }
  }
  // ...
})
```

Elysia's `onError` handler returns the response with status 200 by default unless `set.status` is explicitly set. This means:
- `UNIT_NOT_FOUND` → 200 (should be 404)
- `DUPLICATE_UNIT_CODE` → 200 (should be 409)
- `UNIT_HAS_ACTIVE_PLASMAS` → 200 (should be 409)
- `MISSING_TENANT_ID` → 200 (should be 400 or 401)

Clients cannot distinguish success from failure using HTTP status codes.

**Fix**: Set appropriate HTTP status codes in each error handler:
```ts
.onError(({ error, set }) => {
  if (error instanceof UnitNotFoundError) {
    set.status = 404
    return { error: error.message, code: 'UNIT_NOT_FOUND' }
  }
  // ...
})
```

---

### C-03: Soft-delete breaks unique constraint — cannot recreate unit with same code

**File**: `units.ts:29` (schema)

```ts
unitCodeTenantUnique: unique('uq_units_code_tenant').on(table.code, table.tenantId),
```

The unique constraint `uq_units_code_tenant` on `(code, tenantId)` does not account for soft-deleted rows. After soft-deleting a unit (setting `deletedAt`), attempting to create a new unit with the same code under the same tenant will fail with a database constraint violation — not a clean business error.

**Fix**: Change the unique constraint to a partial/conditional unique index that excludes soft-deleted rows. In MySQL, this requires a generated column or a trigger-based approach since MySQL doesn't natively support partial unique indexes. A common pattern:
```sql
-- Add a nullable column or use a composite unique with deletedAt
unique('uq_units_code_tenant_active').on(table.code, table.tenantId, table.deletedAt)
```
This way, `(code='A', tenant=1, deletedAt=null)` and `(code='A', tenant=1, deletedAt='2026-01-01')` are treated as different rows.

---

## 🟠 HIGH Findings

### H-01: Race condition in duplicate code check (Unit create/update)

**File**: `unit.service.ts:24–37` (create), `unit.service.ts:126–142` (update)

The check-then-insert pattern is not atomic:
```ts
const existing = await db.select().from(units).where(/* code check */)
if (existing.length > 0) throw new DuplicateUnitCodeError(...)
const result = await db.insert(units).values(...)
```

Two concurrent requests with the same code could both pass the check and one would get a raw database error instead of the clean `DuplicateUnitCodeError`.

**Fix**: Wrap in a transaction and catch the unique constraint violation, translating it to `DuplicateUnitCodeError`. Alternatively, use `ON CONFLICT` / `INSERT ... ON DUPLICATE KEY` handling.

---

### H-02: Race condition in cycle number assignment

**File**: `cycle.service.ts:56–61`

```ts
const cycleNumberResult = await db
  .select({ max: max(cycles.cycleNumber) })
  .from(cycles)
  .where(eq(cycles.plasmaId, input.plasmaId))
const cycleNumber = (cycleNumberResult[0]?.max ?? 0) + 1
```

Two concurrent Chick-In requests for the same plasma could both read the same max cycle number and both insert with the same `cycleNumber`. The schema has no unique constraint on `(plasmaId, cycleNumber)` to prevent this.

**Fix**: Add a unique constraint on `(plasmaId, cycleNumber)` in the cycles schema and wrap the max-read + insert in a transaction. Alternatively, use a database sequence per plasma.

---

### H-03: `failCycle` silently discards `notes` field

**File**: `cycle.service.ts:338–341`

```ts
await db
  .update(cycles)
  .set({ status: 'failed', harvestDate: new Date(input.harvestDate) })
  .where(eq(cycles.id, id))
```

The `notes` field from the request body is accepted by the controller schema (line 195: `notes: t.Optional(t.String())`) but is never written to the database. The cycles schema has no `notes` column. The notes only appear in the audit log (line 349), which is fire-and-forget and could be lost.

**Fix**: Either add a `notes` column to the cycles schema, or remove `notes` from the API contract. If notes are intended to be stored, add the column before releasing.

---

### H-04: Invalid DOC type throws generic `Error` — unhandled by controller

**Files**: `cycle.service.ts:31`, `cycle.service.ts:201`

```ts
throw new Error(`Invalid DOC type. Must be one of: ${VALID_DOC_TYPES.join(', ')}`)
```

This throws a plain `Error`, not a custom error class. The controller's `.onError()` handler only catches specific error classes (`CycleNotFoundError`, `InvalidCycleStatusTransitionError`, etc.), so this error will fall through to Elysia's default error handler and return a 500 Internal Server Error with a generic message.

**Fix**: Create a custom `InvalidDocTypeError` class and add it to the cycle controller's error handler.

---

### H-05: `userId` defaults to `'system'` when no session exists

**Files**: All three controllers (e.g., `unit.controller.ts:42`)

```ts
const sessionId = cookie.auth_session?.value as string | undefined
const userId = sessionId || 'system'
```

If no auth session cookie exists, the user ID defaults to `'system'`. This means:
1. Unauthenticated requests (that pass the RBAC check) would be attributed to `'system'` in audit logs.
2. The session cookie value is used directly as a user ID without validation — it should be decoded/verified from a JWT or session token.

**Fix**: Extract the actual user ID from a validated session token. Fail with 401 if no valid session exists rather than defaulting to `'system'`.

---

### H-06: Plasma soft-delete check doesn't scope active cycles by tenant

**File**: `plasma.service.ts:240–243`

```ts
const activeCycles = await db
  .select({ count: count() })
  .from(cycles)
  .where(and(eq(cycles.plasmaId, id), eq(cycles.status, 'active')))
```

While the plasma ownership is verified via `getPlasma(id, tenantId)` on line 238, the cycles query doesn't filter by tenant. If a plasma ID were somehow spoofed (defense in depth), this could count cycles from other tenants. More importantly, this query doesn't exclude soft-deleted cycles.

**Fix**: Add `isNull(cycles.deletedAt)` to the where clause for consistency.

---

## 🟡 MEDIUM Findings

### M-01: `getTenantId` function duplicated across all three controllers

**Files**: `unit.controller.ts:16–20`, `plasma.controller.ts:16–20`, `cycle.controller.ts:21–25`

The exact same `getTenantId` function is copy-pasted in all three controllers. Any bug fix or change must be applied three times.

**Fix**: Extract to a shared utility, e.g., `server/src/utils/tenant.ts`.

---

### M-02: `listPlasmas` and `getPlasma` don't filter soft-deleted units

**Files**: `plasma.service.ts:89–115` (listPlasmas), `plasma.service.ts:128–160` (getPlasma)

```ts
.leftJoin(units, eq(plasmas.unitId, units.id))
.where(and(eq(units.tenantId, tenantId), isNull(plasmas.deletedAt)))
```

The WHERE clause filters `isNull(plasmas.deletedAt)` but not `isNull(units.deletedAt)`. If a unit is soft-deleted, its plasmas will still appear in list/get responses, potentially showing data the tenant admin expected to be hidden.

**Fix**: Add `isNull(units.deletedAt)` to the WHERE clause in both queries.

---

### M-03: `listCycles` doesn't filter soft-deleted plasmas or units

**File**: `cycle.service.ts:107–134`

```ts
.leftJoin(plasmas, eq(cycles.plasmaId, plasmas.id))
.leftJoin(units, eq(plasmas.unitId, units.id))
```

No `isNull(plasmas.deletedAt)` or `isNull(units.deletedAt)` filter. Cycles belonging to soft-deleted plasmas or units will still appear in listings.

**Fix**: Add `isNull(plasmas.deletedAt)` and `isNull(units.deletedAt)` to the conditions array.

---

### M-04: `createUnit` returns constructed object instead of DB row

**File**: `unit.service.ts:60`

```ts
return { ...input, id: newId, tenantId }
```

This returns a manually constructed object that lacks DB-generated defaults (`isActive`, `createdAt`, `updatedAt`, `deletedAt`). The client receives an incomplete representation of the created resource.

**Fix**: Fetch the inserted row from the database after insert, similar to how `createPlasma` does it (lines 69–75).

---

### M-05: `updateCycle` uses `Record<string, unknown>` bypassing type safety

**File**: `cycle.service.ts:210`

```ts
const updateData: Record<string, unknown> = {}
```

This bypasses TypeScript's type checking for the update payload. A typo in a key name (e.g., `doc_type` instead of `docType`) would silently insert a wrong column name.

**Fix**: Use a typed partial object:
```ts
const updateData: Partial<typeof cycles.$inferInsert> = {}
```

---

### M-06: `capacity` null/0 makes cycle creation impossible with confusing error

**File**: `cycle.service.ts:51–54`

```ts
const plasmaCapacity = plasma[0].plasmas.capacity ?? 0
if (input.initialPopulation > plasmaCapacity) {
  throw new CycleCapacityExceededError(input.initialPopulation, plasmaCapacity)
}
```

If a plasma's `capacity` is `null` (not set), it defaults to `0`, making it impossible to create any cycle (since `initialPopulation` minimum is 1). The error message "exceeds plasma capacity (0)" is confusing — the real issue is that capacity hasn't been configured.

**Fix**: If capacity is null, either skip the capacity check (allow any population) or throw a specific error like "Plasma capacity not configured". Don't silently default to 0.

---

### M-07: No database transactions for multi-step operations

**Files**: All service files

Operations like `softDeleteUnit` (check plasmas → delete unit) and `createCycle` (check plasma → calculate number → insert) involve multiple queries that should be atomic. Without transactions, concurrent requests can cause inconsistent state.

**Fix**: Wrap multi-step operations in database transactions using Drizzle's `db.transaction()`.

---

## 🔵 LOW Findings

### L-01: `address` field in plasma has no length validation

**File**: `plasma.controller.ts:53`

```ts
address: t.Optional(t.String()),
```

The `address` field accepts strings of unlimited length, while the schema uses `text` type. Other string fields have `maxLength` constraints. While `text` can store large values, unbounded input validation is a minor concern.

**Fix**: Add `maxLength` to the address field validation, e.g., `t.String({ maxLength: 500 })`.

---

### L-02: `chickInDate` and `harvestDate` accept any string

**Files**: `cycle.controller.ts:63`, `cycle.controller.ts:170`, `cycle.controller.ts:194`

```ts
chickInDate: t.String(),
harvestDate: t.String(),
```

These are validated as plain strings but used as `new Date(input.chickInDate)` in the service. Invalid date strings will produce `Invalid Date` objects stored in the database.

**Fix**: Use `t.Date()` validation or add a regex pattern for ISO 8601 dates.

---

### L-03: `status` query parameter uses type assertion bypassing validation

**File**: `cycle.controller.ts:76`

```ts
const status = query.status as string | undefined
```

The `as string | undefined` assertion bypasses the enum validation defined in the schema. While Elysia validates before the handler runs, the assertion is unnecessary and reduces type safety.

**Fix**: Remove the type assertion; Elysia's validated type should flow through.

---

### L-04: Audit log failures are silently swallowed

**Files**: All service files

```ts
try {
  await db.insert(auditLogs).values(...)
} catch {
  // Fire-and-forget audit per D-02
}
```

While documented as intentional, silent audit log failures mean compliance-critical events could be lost without any monitoring or alerting.

**Fix**: At minimum, log the failure to stderr or a monitoring system so ops can detect audit gaps.

---

### L-05: `isActive` field on units/plasmas is never set or toggled

**Files**: `units.ts:23`, `plasmas.ts:25`

```ts
isActive: int('is_active').default(1),
```

The `isActive` field exists in both schemas with a default of 1, but no CRUD operation ever reads or writes it. There's no endpoint to activate/deactivate a unit or plasma. This is dead code that could confuse future developers.

**Fix**: Either implement activate/deactivate endpoints or remove the field until it's needed.

---

## Cross-Cutting Observations

1. **Error handling pattern is inconsistent**: Custom error classes are used for business errors, but `Error` is thrown for validation failures (DOC type). The controller error handlers only catch specific classes, leaving generic errors to produce 500s.

2. **Tenant isolation relies entirely on application logic**: There are no database-level RLS policies. A single missed `WHERE tenantId = ?` clause would expose cross-tenant data. Consider adding database-level constraints or RLS.

3. **No pagination on list endpoints**: `listUnits`, `listPlasmas`, and `listCycles` return all records with no limit/offset. This will degrade performance as data grows.

4. **Soft-delete cascading is incomplete**: Deleting a unit checks for active plasmas but not soft-deleted plasmas. Deleting a plasma checks for active cycles but not completed/failed ones. The business rules around what blocks deletion vs. what cascades need clarification.