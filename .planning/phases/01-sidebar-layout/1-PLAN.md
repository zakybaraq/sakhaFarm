# Phase 1: Sidebar Layout Fixes

## Goals
- Fix sidebar divider alignment with Navbar
- Move collapse button to bottom of sidebar
- Logo left-aligned (centered when collapsed)
- Change menu names to singular
- Remove duplicate Users menu

## Status: Done ✅

## Changes Made

### Sidebar.tsx
1. Logo positioned left (centered when collapsed)
2. Toggle button moved to bottom, below List
3. Divider between List and toggle button
4. Menu names: Units→Unit, Plasmas→Plasma, etc.
5. Users menu removed (in RBAC)

### Files Modified
- `client/src/components/layout/Sidebar.tsx`

## Verification
- [x] Build passes
- [x] Toggle button at bottom
- [x] Logo centered when collapsed