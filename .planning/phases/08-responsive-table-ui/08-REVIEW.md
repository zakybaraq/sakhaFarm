---
phase: 08-responsive-table-ui
depth: standard
reviewer: sisyphus
date: 2026-04-20
status: complete
files_reviewed:
  - client/src/components/ui/ResponsiveTable.tsx
  - client/src/types/table.ts
  - client/src/hooks/useResponsiveTable.ts
  - client/src/pages/units/Units.tsx
  - client/src/pages/plasmas/Plasmas.tsx
  - client/src/pages/cycles/Cycles.tsx
  - client/src/pages/admin/Users.tsx
  - client/src/pages/admin/AuditLog.tsx
  - client/src/pages/feed/FeedStock.tsx
  - client/src/pages/reports/StockResume.tsx
  - client/src/pages/rbac/RbacManager.tsx
---

# Code Review: Phase 08 + UI Fixes

## Summary

Reviewed 11 files across 2 change sets:
1. **ResponsiveTable rewrite** — MUI DataGrid → TanStack Table v8
2. **Toggle/Status column refactor** — moved Switch from actions to status column

## Findings

### 🔴 CRITICAL (0)

None.

### 🟠 HIGH (2)

#### H01: `useResponsiveTable` hook is defined but never imported
**File:** `client/src/hooks/useResponsiveTable.ts`
**Severity:** High (dead code)
**Detail:** The hook exports `useResponsiveTable` with sorting/pagination state, but `ResponsiveTable.tsx` manages its own state internally via TanStack's `useReactTable`. No file imports this hook.
**Impact:** Increases bundle size. Could confuse future developers who expect to use it.
**Recommendation:** Either integrate it into ResponsiveTable as external state control, or delete it. If keeping for future controlled-mode use, add a comment explaining it's not yet used.

#### H02: Sorting is single-column only (no multi-sort toggle)
**File:** `client/src/components/ui/ResponsiveTable.tsx` (line 162-168)
**Severity:** High (UX limitation)
**Detail:** `handleSort` always replaces the entire sorting state with a single column (`newSorting = [{ id: columnId, desc: newDesc }]`). This means:
- Clicking column A sorts by A → clicking column B sorts by B (A sort is lost)
- No way to sort by multiple columns
- The sort direction toggle only cycles: unsorted → asc → desc → unsorted (would need 3 clicks to go from asc to desc)
**Impact:** Regression from DataGrid which supported multi-sort. Users lose previous sort when clicking a new column.
**Recommendation:** Either add shift-click for multi-sort, or at minimum preserve previous sort with toggle behavior. Consider using TanStack's built-in `onSortingChange` with `getSortedRowModel()` which handles multi-sort natively.

### 🟡 MEDIUM (4)

#### M01: `excludeFromExport` not handled in column visibility
**File:** `client/src/components/ui/ResponsiveTable.tsx` (lines 182-185)
**Severity:** Medium (incomplete feature)
**Detail:** Mobile priority filtering uses `priority === undefined || priority <= 1`, but no page currently sets `priority` on columns. This means on mobile, ALL columns show (since `priority === undefined` passes the filter for every column).
**Impact:** Mobile column hiding is effectively a no-op until columns get `priority` values.
**Recommendation:** Either: (a) assign default priorities (e.g., `actions` → priority 3, `status` → priority 2) in `convertColumns`, or (b) document that pages need to set priorities.

#### M02: `pageCount` variable is computed but unused
**File:** `client/src/components/ui/ResponsiveTable.tsx` (line 158)
**Severity:** Medium (dead code)
**Detail:** `const pageCount = table.getPageCount()` is computed but never referenced. `TablePagination` uses `data.length` for count, not `pageCount`.
**Recommendation:** Remove the unused variable.

#### M03: `cellAlign` is computed but not used
**File:** `client/src/components/ui/ResponsiveTable.tsx` (line 206)
**Severity:** Low (dead variable)
**Detail:** `const cellAlign = colDef?.align ?? 'left'` is computed in the header rendering loop but never referenced. The cell rendering at line 270 correctly uses `colDef?.align`, so this variable in the header block is unused.
**Recommendation:** Remove the unused variable from the header map.

#### M04: TanStack Table `initialState` vs `state`管理模式冲突
**File:** `client/src/components/ui/ResponsiveTable.tsx` (lines 145-154)
**Severity:** Medium (potential bug)
**Detail:** The table uses `initialState: { pagination: { pageSize: initialPageSize } }` but also has `onSortChange`, `onPageChange`, `onPageSizeChange` callback props suggesting controlled mode. However, pagination and sorting state is fully managed internally by TanStack Table via `getPaginationRowModel()` and `getSortedRowModel()`. The callback props fire but the component never reads the external state — it's "semi-controlled."
**Impact:** If a parent tries to control pagination externally via `pagination` prop, it won't work since `initialState` only applies on mount.
**Recommendation:** Either remove the unused controlled props (`onPageChange`, `onPageSizeChange`, `onSortChange`, `pagination`, `sorting`) from `TableProps`, or implement proper controlled mode using TanStack's `state` and `onSortingChange`/`onPaginationChange`.

### 🟢 LOW (3)

#### L01: Hardcoded color values instead of theme tokens
**File:** `client/src/components/ui/ResponsiveTable.tsx` (lines 219, 259-260)
**Severity:** Low (consistency)
**Detail:** Uses hardcoded colors `#64748b` (header text), `#fafafa` (zebra stripe), `#f8fafc` (row hover) instead of theme palette tokens. These match the MUI theme overrides in `theme/index.ts` but are duplicated as magic strings.
**Recommendation:** Use `theme.palette.text.secondary`, `theme.palette.grey[50]`, etc. for consistency and theme-ability.

#### L02: `enableFiltering` prop is accepted but never used
**File:** `client/src/types/table.ts` (line 89)
**Severity:** Low (unused prop)
**Detail:** `TableProps` declares `enableFiltering?: boolean` and ResponsiveTable accepts it, but no filtering UI or logic exists. This is inherited from the DataGrid API but has no implementation.
**Recommendation:** Either implement column filtering or remove the prop to avoid confusing API consumers.

#### L03: Indonesian language hardcoded in empty state
**File:** `client/src/components/ui/ResponsiveTable.tsx` (line 250)
**Severity:** Low (i18n)
**Detail:** "Tidak ada data" is hardcoded in Indonesian. Same for pagination labels "Baris per halaman:" and "dari".
**Recommendation:** Accept an `emptyMessage` prop for customizability, or at minimum document this is intentional Indonesian localization.

---

## Review Verdict

| Category | Count |
|----------|-------|
| 🔴 Critical | 0 |
| 🟠 High | 2 |
| 🟡 Medium | 4 |
| 🟢 Low | 3 |
| **Total** | **9** |

### Key Recommendations (Priority Order)

1. **H02** — Fix sorting behavior: Use TanStack's built-in multi-sort instead of replacing the entire sort state. This is a UX regression.
2. **H01** — Delete `useResponsiveTable.ts` or document it as reserved for future controlled mode.
3. **M04** — Clean up semi-controlled props: Either implement proper controlled mode or remove unused `onPageChange`/`onPageSizeChange`/`onSortChange` props.
4. **M02/M03** — Remove unused `pageCount` and `cellAlign` variables.
5. **M01** — Add default priority values for mobile column hiding, or document that `priority` must be set by pages.

### Build & Type Check

- ✅ `tsc --noEmit` — 0 errors
- ✅ `bun run build` — Successful (2.67s, 1,450.34 KB)
- ✅ No unused imports (Chip removed from Units, Plasmas, Cycles)
- ⚠️ `getStatusColor` removed from Cycles (unused after Chip removal — correct)

---

_Review completed: 2026-04-20_