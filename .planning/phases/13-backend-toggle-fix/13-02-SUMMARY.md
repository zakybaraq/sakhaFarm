---
phase: 13-backend-toggle-fix
plan: 02
subsystem: frontend
tags:
  - toggle-fix
  - type-migration
  - isActive
dependency_graph:
  requires: []
  provides:
    - "Unit interface with isActive: number"
    - "Plasma interface with isActive: number"
    - "Toggle mutations sending { isActive: 0/1 }"
    - "Switch checked props using !!row.original.isActive"
  affects:
    - "client/src/api/units.ts"
    - "client/src/api/plasmas.ts"
    - "client/src/pages/units/Units.tsx"
    - "client/src/pages/plasmas/Plasmas.tsx"
tech_stack:
  added: []
  patterns:
    - "isActive number (0/1) instead of isDeleted boolean"
    - "Double-negation !! for int→bool coercion in Switch checked prop"
key_files:
  created: []
  modified:
    - client/src/api/units.ts
    - client/src/api/plasmas.ts
    - client/src/pages/units/Units.tsx
    - client/src/pages/plasmas/Plasmas.tsx
decisions:
  - "Replaced isDeleted: boolean with isActive: number in both Unit and Plasma interfaces to match DB schema"
  - "Toggle mutation uses ternary unit.isActive ? 0 : 1 to flip active state"
  - "Switch checked prop uses !!row.original.isActive to coerce int to boolean"
  - "Added unitName?: string | null to Plasma interface (backend join returns this field)"
metrics:
  duration: "~10min"
  completed_date: "2026-04-20"
---

# Phase 13 Plan 02: Frontend — Fix interfaces, toggle mutations, Switch props for units & plasmas toggle

## One-liner

Replaced `isDeleted: boolean` with `isActive: number` in Unit/Plasma TypeScript interfaces, fixed toggle mutations to send `{ isActive: 0/1 }`, and updated Switch `checked` props to use `!!row.original.isActive` in both Units and Plasmas pages.

## Changes Summary

### Task 1: Fix Unit and Plasma API interfaces

**client/src/api/units.ts:**
- `Unit` interface: `isDeleted: boolean` → `isActive: number`
- `updateUnit` data param: `isDeleted?: boolean` → `isActive?: number`

**client/src/api/plasmas.ts:**
- `Plasma` interface: `isDeleted: boolean` → `isActive: number`, added `unitName?: string | null`
- `updatePlasma` data param: `isDeleted?: boolean` → `isActive?: number`

### Task 2: Fix toggle mutations and Switch checked props

**client/src/pages/units/Units.tsx:**
- toggleMutation: `updateUnit(id, { isDeleted: !unit.isDeleted })` → `updateUnit(id, { isActive: unit.isActive ? 0 : 1 })`
- Status column accessorKey: `'isDeleted'` → `'isActive'`
- Switch checked: `{!isDeleted}` → `{!!row.original.isActive}`

**client/src/pages/plasmas/Plasmas.tsx:**
- toggleMutation: `updatePlasma(id, { isDeleted: !plasma.isDeleted })` → `updatePlasma(id, { isActive: plasma.isActive ? 0 : 1 })`
- Status column accessorKey: `'isDeleted'` → `'isActive'`
- Switch checked: `{!isDeleted}` → `{!!row.original.isActive}`

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| `grep "isDeleted"` in all 4 files | 0 matches ✅ |
| `grep "isActive"` in all 4 files | 4 files listed ✅ |
| TypeScript compilation (`tsc --noEmit`) | 0 errors ✅ |
| Vitest (`vitest run`) | 17/17 tests pass ✅ |

## Self-Check: PASSED
