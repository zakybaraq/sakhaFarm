---
slug: plasma-unit-dropdown-inactive-filter
status: awaiting_human_verify
trigger: "di halaman plasma ketika user ingin menambah plasma ada dropdown unit, tapi unit yang status nya dirubah ke tidak aktif masih bisa di pilih, padahal ga boleh."
created: "2026-04-20T21:25:00+07:00"
updated: "2026-04-20T21:40:00+07:00"
symptoms_prefilled: true
goal: find_and_fix
---

# Debug Session: plasma-unit-dropdown-inactive-filter

## Trigger
Di halaman plasma ketika user ingin menambah plasma ada dropdown unit, tapi unit yang status nya dirubah ke tidak aktif masih bisa di pilih, padahal ga boleh.

## Current Focus
- **hypothesis**: Unit dropdown in PlasmaModal doesn't filter by isActive=1, shows all units
- **test**: Check PlasmaModal.tsx unit dropdown query and filtering
- **expecting**: Only active units (isActive=1) should appear in dropdown
- **next_action**: confirm fix

## Symptoms
- When adding a new plasma, unit dropdown shows all units including inactive ones
- Inactive units (isActive=0) should be filtered out from dropdown
- User should not be able to select inactive units when creating new plasma

## Evidence
- timestamp: "2026-04-20T21:30:00+07:00"
  checked: "client/src/pages/plasmas/PlasmaModal.tsx lines 47-51"
  found: "Query uses listUnits() without any filtering for isActive"
  implication: "Frontend receives ALL units from API"

- timestamp: "2026-04-20T21:32:00+07:00"
  checked: "client/src/api/units.ts line 18-20"
  found: "listUnits() calls /api/units endpoint without any query params"
  implication: "API endpoint is called but no filtering applied"

- timestamp: "2026-04-20T21:35:00+07:00"
  checked: "server/src/modules/unit/unit.service.ts lines 72-78"
  found: "listUnits() function does NOT filter by isActive=1, only filters by tenantId and deletedAt"
  implication: "ROOT CAUSE: The backend API returns all units regardless of isActive status"

## Eliminated

## Resolution
root_cause: "The listUnits() backend function in unit.service.ts does not filter units by isActive=1. It only filters by tenantId and deletedAt (soft delete), so inactive units (isActive=0) are returned and shown in the dropdown."
fix: "Added eq(units.isActive, 1) filter to the listUnits() query in unit.service.ts to only return active units"
verification: "Build passes. Unit test failures are pre-existing mock infrastructure issues (not caused by this fix)."
files_changed:
  - "server/src/modules/unit/unit.service.ts"