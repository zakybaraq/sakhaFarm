# Phase 13: Backend Toggle Fix — Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix 500 errors when toggling active/inactive status on the Units and Plasmas pages.
Covers backend schema fix, service layer update, and frontend alignment.
Does NOT cover read-only cycle status badge (Phase 14) or any other data integration work.

</domain>

<decisions>
## Implementation Decisions

### Toggle Field — Use isActive, NOT isDeleted
- **D-01:** The toggle switch controls the `isActive` field (int 0/1), NOT `deletedAt`. Toggling off sets `isActive = 0`; toggling on sets `isActive = 1`.
- **D-02:** The record STAYS visible in the table when toggled off — it shows as inactive. It should NOT disappear.
- **D-03:** `deletedAt` remains exclusively for the hard delete button (soft-delete). These are separate concerns — do not conflate them.

### Fix Approach — Patch Existing PUT Endpoint
- **D-04:** Add `isActive` to the existing `PUT /:id` body schema in both `unit.controller.ts` and `plasma.controller.ts`. Do NOT create a new PATCH /toggle endpoint.
- **D-05:** Update both service functions (`updateUnit`, `updatePlasma`) to handle `isActive?: boolean` input and map it to `units.isActive = isActive ? 1 : 0`.

### Error UX — Surface Backend Errors
- **D-06:** When toggle fails (e.g., backend throws 409 or 500), display the backend error message in the existing Snackbar. The current `onError` handlers already do this — no extra work required.

### Frontend Alignment
- **D-07:** Change `api/units.ts` `Unit` interface: replace `isDeleted: boolean` with `isActive: number` (matches DB: `int` 0/1). Update `updateUnit` to accept `{ isActive?: boolean }` instead of `{ isDeleted?: boolean }`.
- **D-08:** Change `api/plasmas.ts` `Plasma` interface: same — add `isActive: number`, remove `isDeleted: boolean`. Update `updatePlasma` similarly.
- **D-09:** `Units.tsx` and `Plasmas.tsx` toggle logic: read `row.original.isActive` (truthy = active), send `{ isActive: unit.isActive ? 0 : 1 }` (or boolean equivalent — service maps to int).
- **D-10:** Switch `checked` prop: `checked={!!row.original.isActive}` (handles int 0/1 truthiness).

### Claude's Discretion
- Whether to type `isActive` as `number` or `boolean` in the frontend interface — either works; prefer `number` to match the DB int exactly and avoid confusion.
- Exact mapping in service (`isActive ? 1 : 0` vs using boolean directly in Drizzle update) — Claude decides based on Drizzle type expectations.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files to Modify (Backend)
- `server/src/modules/unit/unit.controller.ts` — PUT body schema missing `isActive`; service call passes body to `updateUnit`
- `server/src/modules/unit/unit.service.ts` — `updateUnit` input type and update logic needs `isActive` handling
- `server/src/modules/plasma/plasma.controller.ts` — same as unit controller
- `server/src/modules/plasma/plasma.service.ts` — `updatePlasma` input type + update logic needs `isActive` handling

### Files to Modify (Frontend)
- `client/src/api/units.ts` — `Unit` interface and `updateUnit` function signature
- `client/src/api/plasmas.ts` — `Plasma` interface and `updatePlasma` function signature
- `client/src/pages/units/Units.tsx` — toggle mutation and Switch `checked` prop
- `client/src/pages/plasmas/Plasmas.tsx` — same

### Schema Reference
- `server/src/db/schema/units.ts` — `isActive: int('is_active').default(1)` and `deletedAt: timestamp('deleted_at')` are separate fields
- `server/src/db/schema/plasmas.ts` — same two fields present

### Requirements
- `.planning/REQUIREMENTS.md` — TOGGLE-01, TOGGLE-02

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `unit.service.ts:updateUnit` — already handles `isDeleted` → sets `deletedAt`. Add parallel `isActive` handling here.
- `plasma.service.ts:updatePlasma` — does NOT handle `isDeleted` or `isActive` yet. Add `isActive` handling.
- `Units.tsx:toggleMutation` — already wired up, just needs the correct field name.
- `Plasmas.tsx:toggleMutation` — same pattern as Units.

### Established Patterns
- Controller error handling: `onError` → catch known error types → return specific status codes. Already handles `MISSING_USER_ID`, `MISSING_TENANT_ID`.
- Service `updateData` pattern: build a partial object of fields to update, only include defined fields. Follow this in `updatePlasma`.
- Audit logging in services: fire-and-forget `try { await tx.insert(auditLogs)... } catch {}`. Include `isActive` change in audit log.

### Integration Points
- `unit.controller.ts:PUT /:id` calls `updateUnit(id, ctx.body, tenantId, userId)` — body passes through directly. Add `isActive` to schema and it flows to service.
- `plasma.controller.ts:PUT /:id` calls `updatePlasma(id, ctx.body, tenantId, userId)` — same pattern.
- Frontend `toggleMutation` → `updateUnit/Plasma(id, { isActive: ... })` → `PUT /api/units/:id` or `PUT /api/plasmas/:id`.

</code_context>

<specifics>
## Specific Ideas

- The `listUnits` query already filters by `isNull(units.deletedAt)` — inactive units (isActive=0) will still appear in the list, which is the desired behavior.
- The `listPlasmas` query same — inactive plasmas stay visible.
- Do NOT change the `listUnits` or `listPlasmas` queries — filtering behavior is correct as-is.
- DB column `isActive` is `int` (0/1), not boolean. Drizzle may require passing `1`/`0` directly, or a boolean that Drizzle coerces — check the Drizzle set() call pattern in the existing `updateUnit` code for reference.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 13-backend-toggle-fix*
*Context gathered: 2026-04-20*
