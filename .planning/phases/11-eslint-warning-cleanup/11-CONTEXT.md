---
phase: 11-eslint-warning-cleanup
type: code-cleanup
tags: [eslint, code-quality, linting, warnings]
dependency_graph:
  requires: [06-code-cleanup]
  provides: [zero-warnings-build]
  affects: [client/src/**/*.tsx, client/src/**/*.ts]
---

# Phase 11: ESLint Warning Cleanup — Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix all ESLint warnings and prettier errors so `bun run lint` passes with 0 problems. This is a pure code quality phase — no new features, no UI changes, no behavior changes. Only removing dead code, fixing lint rules, and auto-formatting.

Current state: **158 problems (130 errors, 28 warnings)**
- 130 prettier formatting errors (auto-fixable)
- 20 unused variables/imports (`no-unused-vars`)
- 2 React hooks dependency warnings (`exhaustive-deps`)
- 1 mixed export warning (`react-refresh/only-export-components`)
- 1 explicit `any` warning (`no-explicit-any`)
</domain>

<decisions>
## Implementation Decisions

### D-01: Prettier Auto-Fix Strategy
**Decision**: Run `eslint --fix` first to auto-fix all 130 prettier formatting errors in one pass. Then manually fix remaining 28 warnings.

**Rationale**: Prettier errors are purely formatting and safe to auto-fix. Doing this first means remaining warnings are easier to see and fix.

### D-02: Catch Block Error Handling
**Decision**: Prefix unused catch parameters with `_` (e.g., `catch (_err)`).

**Rationale**: Standard ESLint convention for intentionally unused catch parameters. Doesn't suppress actual errors, just acknowledges they're caught but not used.

**Files affected**: UnitModal.tsx, CycleModal.tsx, PlasmaModal.tsx, SuratJalanModal.tsx, UserModal.tsx

### D-03: React Hooks Exhaustive Deps
**Decision**: Add missing dependencies to useEffect/useMemo hooks rather than suppressing with comments.

**Rationale**: Proper fix prevents stale closure bugs. Must verify no infinite loops after adding deps.

**Files affected**:
- `AuthContext.tsx` line 45: Add `user` to useEffect dependency array
- `AuditLog.tsx` line 63: Wrap `auditLogs` computing expression in its own `useMemo` before using in filter useMemo

### D-04: Mixed Exports in AuthContext
**Decision**: Suppress with `// eslint-disable-next-line react-refresh/only-export-components` comment.

**Rationale**: AuthContext is an auth context — splitting the `useAuth` hook and `AuthProvider` component into separate files is overkill for this pattern. The suppression is justified because this is a context provider, not a UI component.

### D-05: Dead Code Removal (Phase 9 Remnants)
**Decision**: Remove unused variables that are clearly dead code from Phase 9 refactoring.

**Removals**:
- `getStatusColor` function in Cycles.tsx — Phase 9 replaced Chip badges with Switch; this function is unused legacy
- `selectedId` state in Cycles.tsx — replaced by `editId` in Phase 4; only `setSelectedId(null)` calls remain
- `selectedId` state in Users.tsx — same pattern, replaced by `editId`
- `SakhaFarmLogo` function in Navbar.tsx — defined but never rendered or referenced; logo lives in Sidebar instead
- `Typography` import in SuratJalanModal.tsx — unused import
- `FormControl`, `InputLabel`, `Select`, `MenuItem` imports in StockResume.tsx — unused from Phase 8 refactor
- `ApiUser` type import in RbacManager.tsx — unused
- `Unit` type import in UnitModal.tsx — unused
- `drawerClasses` import in theme/index.ts — unused
- `useEffect` import in AuditLog.tsx — unused import

### D-06: Keep but Prefix with Underscore
**Decision**: Keep `noApiFilters` and `hasFilters` in AuditLog.tsx but prefix with underscore since they're prepared for future filter UI wiring.

**Rationale**: These variables represent intentional forward-looking code for the audit filter feature. Prefixing acknowledges they're unused today but needed soon. Will be wired when filter UI is fully connected.

### D-07: Use Loading States in RBAC
**Decision**: Use `rolesLoading` and `usersLoading` from useQuery destructuring — add loading indicators (CircularProgress) to RBAC tables.

**Rationale**: These are genuine UX improvements. Tables should show loading state while data is fetching. Rather than removing or prefixing, use them properly.

### D-08: Explicit `any` Type Fix
**Decision**: Replace `data: any` with proper TypeScript interface in RbacManager.tsx line 161.

**Rationale**: Define a proper `{ id: number; data: RoleUpdateData }` or similar typed interface instead of `any`.

### D-09: Navbar `sidebarCollapsed` Prop
**Decision**: Prefix with underscore in the destructuring `_sidebarCollapsed` since it's part of the NavbarProps interface but not currently used in the component body.

**Rationale**: Can't remove from the interface without checking all callers, but the prop itself isn't used. Underscore prefix satisfies ESLint while preserving the type contract.

</decisions>

<canonical_refs>
## References

- `.planning/phases/06-code-cleanup/06-VERIFICATION.md` — Phase 6 verification (ESLint infrastructure established)
- `.planning/phases/06-code-cleanup/06-UAT.md` — Phase 6 UAT (32 warnings acknowledged)
- `.planning/phases/09-frontend-fixes/09-VERIFICATION.md` — Phase 9 where Chip→Switch refactoring may have left dead code
- `client/eslint.config.js` — Current ESLint configuration (flat config)

## Full ESLint Warning Inventory

### Unused Variables/Imports (20 warnings)

| File | Line | Variable | Action |
|------|------|----------|--------|
| Navbar.tsx | 25 | `SakhaFarmLogo` | Remove function (logo in Sidebar) |
| Navbar.tsx | 81 | `sidebarCollapsed` | Prefix `_sidebarCollapsed` |
| AuditLog.tsx | 1 | `useEffect` import | Remove import |
| AuditLog.tsx | 67 | `noApiFilters` | Prefix `_noApiFilters` |
| AuditLog.tsx | 195 | `hasFilters` | Prefix `_hasFilters` |
| UserModal.tsx | 1 | `useEffect` import | Check if needed — if not, remove |
| UserModal.tsx | 95 | `err` | Prefix `_err` |
| Users.tsx | 15 | `selectedId` | Remove entire useState |
| CycleModal.tsx | 117 | `err` | Prefix `_err` |
| Cycles.tsx | 27 | `selectedId` | Remove entire useState |
| Cycles.tsx | 82 | `getStatusColor` | Remove function |
| SuratJalanModal.tsx | 14 | `Typography` import | Remove import |
| SuratJalanModal.tsx | 76 | `err` | Prefix `_err` |
| PlasmaModal.tsx | 110 | `err` | Prefix `_err` |
| RbacManager.tsx | 33 | `ApiUser` type import | Remove import |
| RbacManager.tsx | 106 | `rolesLoading` | Use: add CircularProgress |
| RbacManager.tsx | 119 | `usersLoading` | Use: add CircularProgress |
| RbacManager.tsx | 161 | `data: any` | Replace with proper type |
| StockResume.tsx | 8-11 | `FormControl`, `InputLabel`, `Select`, `MenuItem` | Remove imports |
| UnitModal.tsx | 16 | `Unit` type import | Remove import |
| UnitModal.tsx | 90 | `err` | Prefix `_err` |
| theme/index.ts | 2 | `drawerClasses` | Remove import |

### React Hooks Warnings (2 warnings)

| File | Line | Issue | Action |
|------|------|-------|--------|
| AuthContext.tsx | 45 | useEffect missing `user` dep | Add `user` to deps array |
| AuditLog.tsx | 63 | `auditLogs` expression in useMemo deps | Wrap in separate useMemo |

### Mixed Exports (1 warning)

| File | Line | Issue | Action |
|------|------|-------|--------|
| AuthContext.tsx | 90 | Exports component + `useAuth` hook | Add eslint-disable comment |

### Explicit Any (1 warning)

| File | Line | Issue | Action |
|------|------|-------|--------|
| RbacManager.tsx | 161 | `{ id: number; data: any }` | Define proper type interface |

</canonical_refs>

<specifics>
## Task Breakdown

### Task 1: Auto-fix Prettier (Wave 1 — Quick Win)
Run `cd client && npx eslint src/ --fix` to auto-fix all 130 prettier formatting errors.

**Verify**: `npx eslint src/` shows only the 28 warnings remaining (0 errors).

### Task 2: Remove Dead Code (Wave 2 — File-by-file)
Remove unused variables, functions, and imports identified in D-05:
- Remove `SakhaFarmLogo` function from Navbar.tsx
- Remove `getStatusColor` function from Cycles.tsx
- Remove `selectedId` useState from Cycles.tsx (keep `editId`)
- Remove `selectedId` useState from Users.tsx (keep `editId`)
- Remove unused imports: `useEffect` from AuditLog.tsx, `Typography` from SuratJalanModal.tsx, `FormControl/InputLabel/Select/MenuItem` from StockResume.tsx, `ApiUser` from RbacManager.tsx, `Unit` from UnitModal.tsx, `drawerClasses` from theme/index.ts, `useEffect` from UserModal.tsx (if confirmed unused)

**Verify**: `npx eslint src/` shows fewer warnings.

### Task 3: Prefix Intentionally Unused Variables (Wave 3)
- Prefix `_err` in catch blocks: UnitModal.tsx, CycleModal.tsx, PlasmaModal.tsx, SuratJalanModal.tsx, UserModal.tsx
- Prefix `_sidebarCollapsed` in Navbar.tsx
- Prefix `_noApiFilters` and `_hasFilters` in AuditLog.tsx
- Prefix `_useEffect` if still imported but unused in UserModal.tsx (or remove)

**Verify**: Fewer warnings in ESLint output.

### Task 4: Fix React Hooks Dependencies (Wave 4)
- AuthContext.tsx: Add `user` to useEffect dependency array (verify no infinite loop)
- AuditLog.tsx: Extract `auditLogs` into its own useMemo before the filter useMemo

**Verify**: No `react-hooks/exhaustive-deps` warnings.

### Task 5: Use Loading States + Fix `any` Type (Wave 5)
- RbacManager.tsx: Add `<CircularProgress>` loading indicators to role and user tables using `rolesLoading`/`usersLoading`
- RbacManager.tsx line 161: Replace `data: any` with proper TypeScript interface `{ id: number; data: RoleUpdateData }` or similar

**Verify**: No `no-unused-vars` warnings for loading states. No `no-explicit-any`.

### Task 6: Suppress Mixed Exports (Wave 6 — Quick Fix)
- AuthContext.tsx: Add `// eslint-disable-next-line react-refresh/only-export-components` above export line

**Verify**: 0 warnings in `npx eslint src/`.

### Task 7: Verify Zero Warnings + Build Passes (Final)
- Run `npx eslint src/` — expect 0 problems
- Run `npx tsc --noEmit` — expect 0 errors
- Run `bun run build` — expect success

</specifics>

<deferred>
## Deferred Ideas

- Adding ESLint to CI/CD pipeline (Phase 6 established config, but CI integration is separate)
- More aggressive ESLint rules (strict TypeScript checks, import ordering)
- Adding tests for loading states in RBAC (belongs in Phase 12)
- Full error handling for catch blocks (logging, user-facing errors) — separate future phase
</deferred>