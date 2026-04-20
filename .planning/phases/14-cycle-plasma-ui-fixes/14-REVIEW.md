---
phase: 14-cycle-plasma-ui-fixes
reviewed: 2026-04-21T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - client/src/types/index.ts
  - client/src/pages/cycles/Cycles.tsx
  - client/src/pages/plasmas/Plasmas.tsx
  - client/src/pages/plasmas/PlasmaModal.tsx
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-04-21
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed four files for cycle and plasma UI fixes. The changes add superadmin-gated edit/delete controls to the Cycles page, a phone column to the Plasmas table, and numeric validation to the phone input in PlasmaModal. One critical authorization gap was found: the Plasmas page toggle action has no superadmin check, allowing any authenticated user to activate/deactivate plasmas. Several medium-severity issues exist around deprecated APIs and input validation bypass vectors.

## Critical Issues

### CR-01: Missing authorization on plasma toggle action

**File:** `client/src/pages/plasmas/Plasmas.tsx:111-120`
**Issue:** The `Switch` component in the status column calls `handleToggle(row.original.id)` without any superadmin or permission check. Any authenticated user can toggle the `isActive` status of any plasma. This is inconsistent with the Cycles page (line 121-124) which properly gates edit/delete behind `isSuperadmin`.

**Fix:**
```tsx
// Add superadmin check to handleToggle or the Switch component
const handleToggle = (id: number) => {
  if (!isSuperadmin) {
    setSnackbar({ open: true, message: 'Hanya superadmin yang dapat mengubah status', severity: 'error' });
    return;
  }
  toggleMutation.mutate(id);
};
```

Alternatively, disable the Switch for non-superadmin users:
```tsx
<Switch
  size="small"
  checked={!!row.original.isActive}
  disabled={!isSuperadmin}
  onChange={(e) => {
    e.stopPropagation();
    handleToggle(row.original.id);
  }}
/>
```

## Warnings

### WR-01: Deprecated `e.keyCode` in phone input validation

**File:** `client/src/pages/plasmas/PlasmaModal.tsx:178`
**Issue:** `e.keyCode` is deprecated per the MDN Web Docs and the UI Events specification. Modern browsers still support it for backwards compatibility, but it may be removed in future versions. Should use `e.key` instead.

**Fix:**
```tsx
onKeyDown={(e) => {
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'];
  if (allowedKeys.includes(e.key)) return;
  if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
  }
}}
```

### WR-02: Phone validation bypassed via paste

**File:** `client/src/pages/plasmas/PlasmaModal.tsx:177-183`
**Issue:** The `onKeyDown` handler only prevents non-numeric keyboard input. Users can bypass this by pasting non-numeric text (e.g., right-click paste or Ctrl+V with non-numeric clipboard content). While Ctrl+V is allowed (line 179), the pasted content is never validated.

**Fix:** Add an `onChange` handler that strips non-numeric characters:
```tsx
onChange={(e) => {
  const cleaned = e.target.value.replace(/\D/g, '');
  field.onChange(cleaned);
}}
```

Additionally, consider adding a Zod regex pattern for phone validation when the field is provided:
```ts
phone: z.string().optional().refine(
  (val) => !val || /^\d{10,15}$/.test(val),
  { message: 'Format telepon tidak valid' }
),
```

### WR-03: Capacity field produces `NaN` on empty input

**File:** `client/src/pages/plasmas/PlasmaModal.tsx:198`
**Issue:** When the capacity TextField is cleared, `e.target.value` becomes `''` (empty string). `Number('')` evaluates to `0`, not `NaN` — however, intermediate states during typing (e.g., typing `-` or `.`) produce `NaN`. This `NaN` value is passed to the form state and could be submitted to the API.

**Fix:**
```tsx
onChange={(e) => {
  const val = e.target.value;
  field.onChange(val === '' ? undefined : Number(val));
}}
```

## Info

### IN-01: Redundant superadmin checks in Cycles action handlers

**File:** `client/src/pages/cycles/Cycles.tsx:121-124, 128-131`
**Issue:** The `handleEditClick` and `handleDeleteClick` functions check `isSuperadmin` and show a snackbar error, but the buttons are already `disabled={!isSuperadmin}` (lines 148, 159). The inner checks are unreachable through normal UI interaction. They provide defense-in-depth but are not triggered by any user action.

**Suggestion:** Either remove the inner checks (relying solely on `disabled`) or keep them as defense-in-depth but document the intent. If keeping, consider that a determined user could call these functions programmatically.

### IN-02: Inconsistent status column UI between Cycles and Plasmas

**File:** `client/src/pages/plasmas/Plasmas.tsx:108-121` vs `client/src/pages/cycles/Cycles.tsx:98-113`
**Issue:** The Cycles page uses a `Chip` component to display status (Active/Completed/Failed), while the Plasmas page uses an interactive `Switch` for the same purpose. Since the phase title mentions "Cycle & Plasma UI Fixes" and the Cycles page replaced toggle with badge chip, the Plasmas page should likely follow the same pattern for consistency.

**Suggestion:** If the Plasmas status should also be a read-only badge, replace the `Switch` with a `Chip` similar to Cycles.tsx. If the toggle behavior is intentional, consider adding the superadmin check from CR-01.

---

_Reviewed: 2026-04-21_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
