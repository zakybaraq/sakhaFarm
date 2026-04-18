# 12-RESEARCH.md — Phase 12: Sidebar Layout Fixes

## Phase Overview
- **Phase**: 12 (v1.1 Phase 1) - Sidebar Layout Fixes
- **Goal**: Fix sidebar divider, toggle button, logo alignment, menu names

## Standard Stack
- **Frontend**: React 18 + Vite + MUI
- **No new libraries needed** - Just React/MUI refactoring

## Architecture Patterns
- **MUI Drawer**: Already in use (Sidebar.tsx)
- **Flexbox layout**: For logo + toggle alignment
- **MUI List**: For menu items

## Implementation Approach

### Fix 1: Logo + Toggle Same Row
```typescript
// Current (wrong):
<Box>logo</Box>
<Box>toggle</Box>
<Divider />

// Fix:
<Box sx={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
  <Box>logo</Box>
  <Box>toggle</Box>
</Box>
<Divider />
```

### Fix 2: Menu Names Singular
```typescript
// Current:
{ text: 'Units', ... }
{ text: 'Plasmas', ... }

// Fix:
{ text: 'Unit', ... }
{ text: 'Plasma', ... }
```

### Fix 3: Remove Duplicate Users
- Remove Users menu item (already in RBAC)

## Common Pitfalls
- **Alignment**: Use flexbox with `justifyContent: 'space-between'`
- **Divider**: Should be at same y-position as Navbar bottom
- **Toggle**: Use same row as logo, not below

## Confidence Levels
| Fix | Confidence |
|-----|------------|
| Logo + toggle alignment | HIGH - Simple flexbox |
| Menu names | HIGH - Simple string change |
| Remove Users | HIGH - Remove array item |

---

*RESEARCH created: 2026-04-18*