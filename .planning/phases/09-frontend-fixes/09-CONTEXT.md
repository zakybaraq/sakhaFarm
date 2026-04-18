# Phase 9: frontend-fixes - Context

**Gathered:** 2026-04-18
**Status:** Ready for execution

<domain>
## Phase Boundary

Fix multiple frontend issues:
- Toggle on/off in action columns not working
- Add delete icon for pages that need it
- Create Reports menu with submenus
- Fix RBAC roles not showing for superadmin

</domain>

<decisions>
## Implementation Decisions

### 1. Toggle Fix
- **Decision:** Toggle switch works but needs error handling
- **Solution:** Added onError handler to toggleMutation with Snackbar feedback
- **Pages affected:** Units, Plasmas, Cycles

### 2. Delete Icons
- **Decision:** Add delete icon button next to edit icon in action column
- **Solution:** Added DeleteIcon button with confirmation dialog in each page
- **Pages affected:** Units, Plasmas, Cycles

### 3. Reports Menu
- **Decision:** Create Reports section header with submenus
- **Solution:** Added isSectionHeader property to MenuItem, render as section header in Sidebar
- **Structure:** Reports (header) → Performance, Stock Resume, Audit Log

### 4. RBAC Roles Fix
- **Decision:** user?.tenantId may be undefined for superadmin
- **Solution:** Changed enabled condition to !!user and added fallback to tenantId=1 if undefined

</decisions>

<canonical_refs>
## References

- client/src/pages/units/Units.tsx
- client/src/pages/plasmas/Plasmas.tsx
- client/src/pages/cycles/Cycles.tsx
- client/src/components/layout/Sidebar.tsx
- client/src/pages/rbac/RbacManager.tsx

</canonical_refs>

<specifics>
## Files Modified

1. **Units.tsx** - Added delete icon, error handling for toggle
2. **Plasmas.tsx** - Added delete icon, error handling for toggle
3. **Cycles.tsx** - Added delete icon, error handling for toggle
4. **Sidebar.tsx** - Added Reports section header with submenus
5. **RbacManager.tsx** - Fixed roles query to handle undefined tenantId

</specifics>

<deferred>
## Deferred

None - all issues addressed

</deferred>

---

*Phase: 09-frontend-fixes*
*Context gathered: 2026-04-18*