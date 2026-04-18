# Phase 6: code-cleanup - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Clean up messy code, add documentation where needed, use MUI only for statistics, modern frontend approach — improving code quality to professional standards.

</domain>

<decisions>
## Implementation Decisions

### Documentation Standards
- **D-01:** API functions and complex logic (calculations, data transformations) require JSDoc documentation
- **D-02:** Simple CRUD operations and basic components do not need full documentation
- **D-03:** Focus on explaining WHY, not WHAT — junior developers should understand without asking

### MUI Usage
- **D-04:** MUI only for charts and statistics (@mui/x-charts)
- **D-05:** All other components (buttons, forms, dialogs, cards) should use custom components
- **D-06:** Existing MUI DataGrid can remain, but new reusable UI should be custom

### File Structure
- **D-07:** Create reusable UI components in `src/components/ui/` only when needed
- **D-08:** Focus on cleaning up existing code first, create new components if time permits
- **D-09:** Hybrid approach — cleanup existing code + add new components where they reduce duplication

### Modern Patterns
- **D-10:** Create standardized patterns (error handling, loading states) only for frequently used patterns
- **D-11:** No wholesale pattern refactoring — add patterns as needed during cleanup
- **D-12:** Prefer custom hooks for reusable logic (like useKpiData)

### Agent's Discretion
- Specific file-by-file cleanup decisions — delegate to planner/researcher based on code analysis
- Which existing files need JSDoc vs which are already clean
- Whether specific components warrant custom replacements vs keeping MUI

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project-Level
- `.planning/PROJECT.md` — Code Quality & Documentation Standards (lines 222-286)
- `.planning/REQUIREMENTS.md` — All functional requirements

### Phase Context
- `.planning/ROADMAP.md` §6 — Phase 6 goal: "Professional code quality"

[No external specs — requirements fully captured in decisions above]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `client/src/api/client.ts` — Typed fetch wrapper with CSRF handling, good base for API patterns
- `client/src/hooks/useKpiData.ts` — Custom hook example with proper loading/error handling
- `client/src/theme/index.ts` — Theme configuration with layout constants

### Established Patterns
- TanStack Query for server state (`useQuery`, `useMutation`)
- MUI DataGrid for tables (already in use)
- Component-level state with `useState` + callbacks
- ErrorBoundary wrapper in Layout

### Integration Points
- API layer in `client/src/api/` — all API calls go through typed client
- Pages in `client/src/pages/` — route-level components
- Layout composition in `client/src/components/layout/`

</code_context>

<specifics>
## Specific Ideas

- Clean up code that's "messy" — prioritize files with inconsistent patterns
- Add documentation to API functions and calculation logic
- Replace non-chart MUI components with custom ones only where it reduces duplication
- Keep it practical — don't over-engineer, focus on readability

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-code-cleanup*
*Context gathered: 2026-04-18*