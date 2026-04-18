# 12-CONTEXT.md — Phase 12: UI/UX Sidebar Layout Fixes

## Prior Context Applied
- **PROJECT.md**: v1.1 goals - Professional UI/UX
- **ROADMAP.md**: Phase 1 of v1.1 - Sidebar Layout Fixes
- **STATE.md**: v1.1 milestone, Phase 12 pending

---

## Current State (Sidebar Analysis)

### Code Location
File: `client/src/components/layout/Sidebar.tsx`

### Current Layout (lines 72-127)
```
Box (logo container)
  - Box (icon)          <- 36x36 icon
  - Box (text)         <- "Sakha Farm" + "LIVESTOCK"
Box (toggle button)    <- Below logo (WRONG POSITION)
Divider              <- Below toggle (incorrect alignment)
```

### Issues Identified
1. **Toggle button below logo** (line 122-126): Should be beside logo
2. **Divider position** (line 127): Should align with Navbar bottom
3. **Logo too large**: 36x36 but takes full height, should align with toggle

---

## Fix Plan

### F-12-01: Logo + Toggle Alignment
**Current**:
```typescript
<Box>logo</Box>
<Box>toggle button</Box>
<Divider />
```

**Fix**: Put toggle button in same row as logo
```typescript
<Box sx={{display:'flex', alignItems:'center'}}>
  <Box>logo</Box>
  <Box>toggle button</Box>
</Box>
<Divider />
```

### F-12-02: Menu Name Changes
**Current** (line 43-55):
- Units, Plasmas, Cycles, Recordings, Feed Stock, Performance, Stock Resume, Audit Log, RBAC, Users

**Fix** (singular):
- Unit, Plasma, Cycle, Recording, Feed Stock, Performance, Stock Resume, Audit Log, RBAC

### F-12-03: Remove Users Menu
- Users already in RBAC (line 53-54)
- Remove duplicate entry to reduce clutter

---

## Implementation Details

### File to Modify
`client/src/components/layout/Sidebar.tsx`

### Changes
1. Line 72-126: Restructure header layout
2. Line 43-55: Change menu names to singular
3. Remove line 54: Users menu item

### Verification
- Toggle button next to logo (same row)
- Divider aligns with Navbar bottom
- Menu names singular
- No duplicate Users entry

---

## Next Steps
1. Create 12-01-PLAN.md with specific task breakdown
2. Execute sidebar.tsx changes
3. Test alignment with Navbar

---

*CONTEXT created: 2026-04-18*