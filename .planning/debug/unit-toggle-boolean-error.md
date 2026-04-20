---
slug: unit-toggle-boolean-error
status: resolved
trigger: "Gagal toggle: Expected boolean ketika toggle di halaman unit di klik"
created: "2026-04-20T21:15:00+07:00"
updated: "2026-04-20T21:20:00+07:00"
symptoms:
  - "Toggle switch on Units page fails when clicked"
  - "Error message mentions 'Expected boolean'"
  - "Issue appeared after Phase 13 execution (isDeleted → isActive migration)"
---

# Debug Session: unit-toggle-boolean-error

## Trigger
Gagal toggle: Expected boolean ketika toggle di halaman unit di klik

## Current Focus
- **hypothesis**: Type mismatch between frontend sending boolean and backend expecting number (or vice versa) after Phase 13 isActive migration
- **test**: Check Units.tsx toggle handler, API updateUnit signature, and backend PUT schema for isActive field
- **expecting**: Find where boolean/number type mismatch occurs
- **next_action**: gather initial evidence
- **reasoning_checkpoint**:
- **tdd_checkpoint**:

## Evidence
- timestamp: 2026-04-20T21:20:00+07:00
  source: client/src/pages/units/Units.tsx:50
  detail: Toggle handler sends `{ isActive: unit.isActive ? 0 : 1 }` — number type (0 or 1)
- timestamp: 2026-04-20T21:20:00+07:00
  source: client/src/api/units.ts:39
  detail: `updateUnit` accepts `isActive?: number` — number type
- timestamp: 2026-04-20T21:20:00+07:00
  source: server/src/modules/unit/unit.controller.ts:107
  detail: PUT body schema defines `isActive: t.Optional(t.Boolean())` — expects boolean, NOT number
- timestamp: 2026-04-20T21:20:00+07:00
  source: server/src/modules/unit/unit.service.ts:115
  detail: Service function accepts `isActive?: boolean` and converts to `1/0` with ternary
- timestamp: 2026-04-20T21:20:00+07:00
  source: server/src/db/schema/units.ts:22
  detail: DB column is `int('is_active').default(1)` — integer type

## Eliminated
- Frontend toggle handler: correctly sends 0/1 as numbers
- Frontend API client: correctly typed as number
- DB schema: correctly uses int column

## Resolution
- **root_cause**: Backend PUT schema in unit.controller.ts validates `isActive` as `t.Boolean()` but frontend sends number (0/1). Elysia validation rejects the request with "Expected boolean" error.
- **fix**: Changed `t.Optional(t.Boolean())` to `t.Optional(t.Number())` in unit.controller.ts PUT body schema. Changed service input type from `isActive?: boolean` to `isActive?: number` in unit.service.ts.
- **verification**: Toggle should now work — frontend sends 0/1, backend accepts number, service stores int directly.
- **files_changed**: server/src/modules/unit/unit.controller.ts, server/src/modules/unit/unit.service.ts
