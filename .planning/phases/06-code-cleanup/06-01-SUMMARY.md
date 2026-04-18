---
phase: 06-code-cleanup
plan: 01
subsystem: client
tags: [eslint, linting, code-quality]
dependency_graph:
  requires: []
  provides: [CR-01, CR-04]
  affects: [client/src]
tech_stack:
  added: [eslint, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh]
  patterns: [ESLint flat config, TDD]
key_files:
  created:
    - path: client/eslint.config.js
  modified:
    - path: client/package.json
decisions:
  - ESLint flat config format for ESLint 9.x+ compatibility
  - Prettier for code formatting (1524 auto-fixable errors)
  - Warning-level for unused vars (allows incremental fix)
metrics:
  duration: 3m
  completed_date: 2026-04-18T12:54:04+07:00
---

# Phase 6 Plan 1: ESLint Infrastructure Summary

## Overview

Set up ESLint infrastructure with TypeScript and React hooks support to enable automated code quality detection.

## What Was Built

- **client/eslint.config.js** - ESLint flat config using typescript-eslint
- **Lint scripts** - `npm run lint` and `npm run lint:fix` in package.json
- **Dependencies** - 8 ESLint-related packages installed

## Initial Lint Results

| Category | Count | Status |
|----------|-------|--------|
| Auto-fixable (prettier) | 1524 | Fixed |
| Warnings (unused vars) | 32 | Remain |
| Errors | 0 | - |

## Remaining Warnings (for Task 4 prioritization)

### Unused Variables (25 files)
- Navbar.tsx: `SakhaFarmLogo`, `sidebarCollapsed`
- AuthContext.tsx: missing useEffect dependency
- Units.tsx, Cycles.tsx, Plasmas.tsx: `handleDelete` unused
- Multiple pages: `err` variable unused

### React Hooks Issues (4 warnings)
- AuthContext.tsx line 45: missing `user` dependency
- AuditLog.tsx line 62: useMemo dependencies

### React Refresh (2 warnings)
- AuthContext.tsx line 90: mixed exports

## Verification

- [x] ESLint config created and valid (`node -e "require('./client/eslint.config.js')"`)
- [x] Lint script runs without errors (1556 problems → 0 errors)
- [x] Initial scan identifies files needing cleanup (32 warnings)

## Deviation from Plan

None - plan executed exactly as written.

## Threat Flags

None - ESLint config has no security-relevant surface.