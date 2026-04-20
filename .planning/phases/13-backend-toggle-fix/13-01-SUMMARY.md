---
phase: 13-backend-toggle-fix
plan: 01
subsystem: backend
tags: [backend, toggle, isActive, elysia, drizzle]
dependency:
  requires: []
  provides: [isActive toggle support for units and plasmas]
  affects: [unit.controller.ts, unit.service.ts, plasma.controller.ts, plasma.service.ts]
tech-stack:
  added: []
  patterns: [boolean-to-int coercion, optional schema fields]
key-files:
  created: []
  modified:
    - server/src/modules/unit/unit.controller.ts
    - server/src/modules/unit/unit.service.ts
    - server/src/modules/plasma/plasma.controller.ts
    - server/src/modules/plasma/plasma.service.ts
decisions:
  - isActive mapped from boolean (frontend) to int 0/1 (database) in service layer
  - isActive added as optional field in PUT body schemas to avoid breaking existing clients
  - isActive and deletedAt handled in separate if-blocks to maintain independence
metrics:
  duration: ~5min
  completed: 2026-04-20
---

# Phase 13 Plan 01: Add isActive field to PUT schema + service for units & plasmas toggle endpoints

## One-liner

Added `isActive: t.Optional(t.Boolean())` to PUT body schemas for units and plasmas, with service-layer boolean-to-int (0/1) coercion for the database column.

## Tasks Completed

### Task 1: Add isActive to unit PUT schema and service

**Files modified:**
- `server/src/modules/unit/unit.controller.ts` — Added `isActive: t.Optional(t.Boolean())` to PUT `/:id` body schema (line 107)
- `server/src/modules/unit/unit.service.ts` — Added `isActive?: boolean` to `updateUnit` input type; added `if (input.isActive !== undefined) { updateData.isActive = input.isActive ? 1 : 0; }` after the `isDeleted` block; updated JSDoc

**Commit:** `dde3a49` — `feat(13-01): add isActive to unit PUT schema and service`

### Task 2: Add isActive to plasma PUT schema and service

**Files modified:**
- `server/src/modules/plasma/plasma.controller.ts` — Added `isActive: t.Optional(t.Boolean())` to PUT `/:id` body schema (line 116)
- `server/src/modules/plasma/plasma.service.ts` — Added `isActive?: boolean` to `updatePlasma` input type; added `if (input.isActive !== undefined) updateData.isActive = input.isActive ? 1 : 0` after the `capacity` block; updated JSDoc

**Commit:** `7635d00` — `feat(13-01): add isActive to plasma PUT schema and service`

## Verification Results

| Check | Result |
|-------|--------|
| `grep "isActive: t.Optional(t.Boolean())"` — unit.controller.ts | ✅ Match at line 107 |
| `grep "isActive?: boolean"` — unit.service.ts input type | ✅ Match at line 115 |
| `grep "isActive ? 1 : 0"` — unit.service.ts | ✅ Match at line 157 |
| `grep "isActive: t.Optional(t.Boolean())"` — plasma.controller.ts | ✅ Match at line 116 |
| `grep "isActive?: boolean"` — plasma.service.ts input type | ✅ Match at line 184 |
| `grep "isActive ? 1 : 0"` — plasma.service.ts | ✅ Match at line 197 |
| `grep "deletedAt.*isActive"` — no combined blocks | ✅ No match (separate if-blocks) |
| TypeScript compilation — no NEW errors | ✅ All errors are pre-existing (`ctx.user` type issues) |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None. The threat model (T-13-01 through T-13-04) was already addressed by the plan's design: Elysia schema enforces `t.Boolean()` at the HTTP boundary, and the service layer performs deterministic boolean-to-int coercion.

## Self-Check: PASSED

All modified files exist, all commits verified.
