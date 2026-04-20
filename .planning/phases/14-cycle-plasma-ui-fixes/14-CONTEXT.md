# Phase 14 Context - Cycle & Plasma UI Fixes

## Decisions Made

### TOGGLE-03: Cycle Status Read-Only Badge
- Status displayed as badge (Active/Completed/Failed)
- **No toggle switch** - read-only display
- Badge color: Green (Active), Blue (Completed), Red (Failed)

### TOGGLE-04: Cycle Edit/Delete Business Rules
- **Regular users**: NO edit, NO delete permissions on cycles
- **Superadmin**: Full edit and delete permissions
- Implementation: Check `isSuperadmin` flag, disable/hide buttons for non-superadmin users

### PLASMA-01: Phone Column Visible
- Add phone column to Plasmas table
- Display format: as-stored (numeric)

### PLASMA-02: Phone Numeric Validation
- **Numeric-only input** - reject any non-numeric character at input time
- Store exactly as entered (all digits)

## Excluded from Phase 14
- No edit/delete restrictions applied to Plasmas (Cycles only)
- No phone formatting - strict numeric storage

## Technical Notes
- Cycle badge: implement in cycle-row.tsx as conditional rendering
- Edit/delete buttons: wire isSuperadmin check in CycleModal.tsx or via API
- Phone column: add to PlasmaTable/PlasmaRow components
- Phone validation: HTML pattern or JS keypress handler

## Prior Context
- Phase 13 bug fixes applied (isActive toggles, inactive visibility)
- Phase 13 verified with UAT and VERIFICATION docs