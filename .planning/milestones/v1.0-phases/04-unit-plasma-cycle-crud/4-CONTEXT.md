---
phase: 04-unit-plasma-cycle-crud
version: 1
created: 2026-04-17T04:35:00Z
---

# Phase 4 CONTEXT — Unit, Plasma & Cycle CRUD

## Prior Context Applied

**From Phase 1:** Schema for `units`, `plasmas`, `cycles` exists with FKs, indexes, soft-delete columns.
**From Phase 2:** Auth, session, CSRF, rate limiting, tenant middleware all verified (12/12 pass).
**From Phase 3:** RBAC permission guards on all endpoints, user CRUD verified (21/21 pass).
**Pattern established:** service → controller → routes, custom error classes, JSDoc on every export, Elysia `t.Object` validation.

## Gray Area Decisions

### D-01: Soft Delete Pattern — `deletedAt` timestamp
- Units and plasmas already have `deletedAt: timestamp('deleted_at')` column
- Cycles will also get `deletedAt` added (schema migration needed)
- Soft-delete sets `deletedAt = NOW()`, excludes `WHERE deletedAt IS NULL`
- Cycles can only be soft-deleted if they have zero daily recordings
- Units can only be soft-deleted if they have no active plasmas
- Plasmas can only be soft-deleted if they have no active cycles

### D-02: Audit Logging — Include in Phase 4
- All unit/plasma/cycle mutations write to `audit_logs` table
- Fields: `action` (create/update/delete/complete/fail), `entity_type` ('unit'|'plasma'|'cycle'), `entity_id`, `user_id`, `old_values` (JSON), `new_values` (JSON)
- Use existing `audit_logs` schema from Phase 1
- Audit write is fire-and-forget (non-blocking, wrapped in try/catch so audit failure doesn't block main operation)

### D-03: Cycle Status Transitions — Manual via dedicated endpoints
- `active` → `completed`: `POST /api/cycles/:id/complete` (requires `harvestDate`, `finalPopulation`)
- `active` → `failed`: `POST /api/cycles/:id/fail` (requires `harvestDate`, optional `notes`)
- No reverse transitions (completed/failed → active is blocked)
- Status changes write to audit_logs

### D-04: DOC Type Validation — Service-layer array
- Validated in service layer, not DB enum (flexible for new types)
- Allowed values: `['CP', 'Patriot', 'Ayam Unggul', 'MBU']`
- Validation error: `"Invalid DOC type. Must be one of: CP, Patriot, Ayam Unggul, MBU"`
- New DOC types can be added by extending the validation array

### D-05: Plasma Capacity Check — Hard block
- Cycle creation blocked if `initialPopulation > plasma.capacity`
- Error: `"Initial population ({n}) exceeds plasma capacity ({n})"`
- Capacity check runs before cycle insert in the same transaction

### D-06: Cycle Numbering — Auto-increment per plasma
- `cycleNumber` auto-calculated: `MAX(cycleNumber) WHERE plasmaId = ? + 1`
- No manual cycle number input from user
- First cycle for a plasma gets `cycleNumber = 1`

### D-07: Chick-In = Cycle Creation
- No separate Chick-In endpoint
- `POST /api/cycles` IS the Chick-In event
- Required fields: `plasmaId`, `docType`, `chickInDate`, `initialPopulation`
- System auto-assigns: `cycleNumber`, `status = 'active'`, `totalFeedKg = 0`

## Scope Boundary

### In Scope
- Unit CRUD (create, list, get, update, soft-delete)
- Plasma CRUD (create, list, get, update, soft-delete, with unit assignment)
- Cycle CRUD (create/Chick-In, list, get, update, soft-delete, complete, fail)
- Audit logging for all mutations
- Validation: capacity check, DOC type, cycle numbering, status transitions
- Tenant isolation on all queries (via existing tenant middleware)
- RBAC permission guards on all endpoints

### Out of Scope (Deferred)
- Frontend UI for unit/plasma/cycle management (Phase 8-9)
- Daily recording endpoints (Phase 5)
- Feed stock integration (Phase 6)
- Aggregate reports and resume queries (Phase 7)
- Notification/alert system (v1.2)

## Reusable Assets

### Existing Patterns
- Error classes: `server/src/modules/rbac/rbac.errors.ts`, `server/src/modules/users/users.errors.ts`
- Service layer pattern: `server/src/modules/users/users.service.ts`
- Controller pattern: `server/src/modules/rbac/rbac.controller.ts`
- Route registration: `server/src/index.ts`

### Existing Schema (no changes needed except cycles.soft-delete)
- `units`: id, tenantId, name, code, location, isActive, createdAt, updatedAt, deletedAt
- `plasmas`: id, unitId, name, farmerName, address, phone, capacity, isActive, createdAt, updatedAt, deletedAt
- `cycles`: id, plasmaId, cycleNumber, docType, chickInDate, initialPopulation, status, harvestDate, finalPopulation, totalFeedKg, createdAt, updatedAt

### Schema Change Needed
- Add `deletedAt: timestamp('deleted_at')` to `cycles` table

## Technical Decisions for Downstream Agents

1. **Module structure**: One module per entity (`server/src/modules/unit/`, `server/src/modules/plasma/`, `server/src/modules/cycle/`)
2. **Each module**: `{entity}.errors.ts`, `{entity}.service.ts`, `{entity}.controller.ts`, `{entity}.routes.ts`
3. **Transaction boundary**: Cycle creation (with capacity check + cycle number calculation) runs in a single Drizzle transaction
4. **Tenant scoping**: All list queries filter by `tenantId` from the tenant middleware
5. **Soft-delete queries**: All queries add `.where(isNull(table.deletedAt))` except admin "list all including deleted" endpoints
6. **Error naming convention**: `{Entity}NotFoundError`, `{Entity}HasActive{Child}Error`, `Invalid{Field}Error`
