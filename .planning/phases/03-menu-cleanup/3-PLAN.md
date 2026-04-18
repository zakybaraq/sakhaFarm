# Phase 3: Menu & Naming Cleanup

## Goals
- Singular menu names (not plural)
- Clear menu hierarchy
- Remove Users menu (integrated into RBAC)

## Status: Done ✅

## Changes Made

### Sidebar.tsx
- Menu names: Units→Unit, Plasmas→Plasma, Cycles→Cycle, Recordings→Recording
- Feed Stock→Feed
- Performance, Stock Resume, Audit Log kept as is (proper nouns)
- Users menu removed

### Files Modified
- `client/src/components/layout/Sidebar.tsx`

## Verification
- [x] All menu names singular
- [x] No duplicate Users menu