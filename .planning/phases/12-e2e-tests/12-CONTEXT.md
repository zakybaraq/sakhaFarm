---
phase: 12-e2e-tests
type: testing
tags: [integration-tests, msw, dropdowns, toggle, edit-modals, api-smoke-tests]
dependency_graph:
  requires: [04-feature-additions, 08-responsive-table-ui, 11-eslint-warning-cleanup]
  provides: [integration-tests, api-smoke-tests]
  affects: [client/src/**/*.test.tsx, tests/unit/*.test.ts]
---

# Phase 12: E2E Dropdown & Integration Tests — Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Add integration tests for dropdown relationships, toggle switches, edit modal flows, and basic API smoke tests. Uses Vitest + @testing-library/react + MSW (Mock Service Worker) for client-side integration tests, and Vitest for server-side API smoke tests.

This phase does NOT add new features — it adds test coverage for existing functionality implemented in Phases 4, 8, and 9.
</domain>

<decisions>
## Implementation Decisions

### D-01: Test Framework — Integration Tests with MSW
**Decision**: Use Vitest + @testing-library/react + MSW (Mock Service Worker) for client-side integration tests.

**Rationale**: 
- Codebase already has Vitest + @testing-library/react set up
- MSW mocks API responses at the network level — tests verify realistic data flows
- No browser/server needed — fast, runs in CI
- Consistent with existing test patterns (QueryClientProvider wrapper)
- Playwright would require a running dev server and is slower

**Setup needed**:
- Install `msw` package in client
- Create MSW handlers file (`client/src/mocks/handlers.ts`)
- Create test setup file that starts MSW before tests
- Create shared test utilities (renderWithProviders helper)

### D-02: Test Scope — All 4 Areas
**Decision**: All 4 test areas from the roadmap will be covered:
1. **Unit→Plasma dropdown**: PlasmaModal populates Unit dropdown from API, selection works
2. **Plasma→Cycle dropdown**: CycleModal populates Plasma dropdown based on Unit selection
3. **Toggle switches**: Status toggle in Units, Plasmas, Cycles, Users — verifies mutation calls and UI updates
4. **Edit modal flows**: Opening edit modal, pre-filling data, submitting update

### D-03: Server API Smoke Tests
**Decision**: Add basic API endpoint smoke tests alongside client tests.

**Rationale**: Server already has Vitest + Drizzle mocks in `tests/unit/`. Add a few integration-level smoke tests that verify endpoint routing and response structure.

**Scope**: Login flow, basic CRUD for each entity (list, create, update, delete), not exhaustive coverage.

### D-04: Test File Organization
**Decision**: Organize tests alongside the components they test, in `__tests__` directories.

**Pattern**:
- `client/src/pages/units/__tests__/Units.test.tsx` — Toggle, edit
- `client/src/pages/plasmas/__tests__/Plasmas.test.tsx` — Toggle, edit, dropdown
- `client/src/pages/cycles/__tests__/Cycles.test.tsx` — Toggle, edit
- `client/src/pages/admin/__tests__/Users.test.tsx` — Toggle, edit
- `tests/integration/` — Server API smoke tests

### D-05: MSW Handler Patterns
**Decision**: Create a shared handlers file that mocks all API endpoints used in tests.

**Pattern**:
```typescript
// client/src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/units', () => HttpResponse.json({ units: mockUnits })),
  http.get('/api/plasmas', () => HttpResponse.json({ plasmas: mockPlasmas })),
  http.get('/api/cycles', () => HttpResponse.json({ cycles: mockCycles })),
  http.patch('/api/units/:id', async ({ params, request }) => {
    const body = await request.json()
    return HttpResponse.json({ unit: { ...mockUnits[0], ...body } })
  }),
  // ... other handlers
]
```

### D-06: Shared Test Utilities
**Decision**: Create a shared `renderWithProviders` helper that wraps components with QueryClientProvider + AuthProvider + MemoryRouter + MSW.

**Pattern**:
```typescript
// client/src/test-utils.tsx
export function renderWithProviders(ui: React.ReactElement, options?: { route?: string }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[options?.route || '/']}>
          {ui}
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
```

</decisions>

<canonical_refs>
## References

- `client/vitest.config.ts` — Existing Vitest config (jsdom, globals=true)
- `client/src/components/__tests__/UnitModal.test.tsx` — Existing smoke test pattern
- `client/src/components/__tests__/PlasmaModal.test.tsx` — Existing smoke test pattern
- `client/src/components/__tests__/DataGrid.test.tsx` — Existing smoke test pattern (now ResponsiveTable)
- `tests/unit/unit.service.test.ts` — Server-side test pattern (Drizzle mocks)
- `.planning/phases/11-eslint-warning-cleanup/11-CONTEXT.md` — Phase 11 (prerequisite, code quality)

## Existing Test Infrastructure

| Component | Tool | Config |
|-----------|------|--------|
| Client tests | Vitest 3.1 + @testing-library/react 16.3 | `client/vitest.config.ts` (jsdom, globals) |
| Server tests | Vitest 3.1 + Drizzle mocks | `server/vitest.config.ts` |
| Auth mocking | `vi.mock('../../contexts/AuthContext')` | Manual mock in test files |
| QueryClient | Manual wrapper per test | `QueryClientProvider` in each test |

## Dropdown Implementations to Test

### PlasmaModal — Unit Dropdown
- **File**: `client/src/pages/plasmas/PlasmaModal.tsx`
- **Query**: `useQuery({ queryKey: ['units'], queryFn: listUnits })`
- **UI**: `Select` component with `unitsData?.units.map()`
- **Validation**: `z.number().min(1, 'Unit wajib dipilih')`

### CycleModal — Plasma Dropdown
- **File**: `client/src/pages/cycles/CycleModal.tsx`
- **Query**: `useQuery({ queryKey: ['plasmas'], queryFn: listPlasmas })`
- **UI**: Select/MenuItem for Plasma

### Toggle Switches
- **Units.tsx**: `Switch checked={!isDeleted}` with `handleToggle(id)` → `updateUnit`
- **Plasmas.tsx**: `Switch checked={!isDeleted}` with `handleToggle(id)` → `updatePlasma`
- **Cycles.tsx**: `Switch checked={isActive}` with `handleToggle(id)` → `updateCycle` (toggles Active/Completed)
- **Users.tsx**: `Switch checked={isActive}` with `handleToggleUserStatus(id)`

### Edit Modal Flows
- **Units**: `EditIcon` → `setSelectedId(id)` → `UnitModal open with selectedId`
- **Plasmas**: `EditIcon` → `setEditId(id)` → `PlasmaModal open with editId`
- **Cycles**: `EditIcon` → `setEditId(id)` → `CycleModal open with editId`
- **Users**: `EditIcon` → `setEditId(id)` → `UserModal open with editId`

</canonical_refs>

<specifics>
## Task Breakdown

### Task 1: Install MSW and Create Test Infrastructure
1. `cd client && bun add -D msw` 
2. Create `client/src/mocks/handlers.ts` — MSW request handlers for all API endpoints
3. Create `client/src/mocks/server.ts` — MSW setup for Vitest (start/stop per test)
4. Create `client/src/test-utils.tsx` — Shared `renderWithProviders` helper
5. Update `client/vitest.config.ts` — Add setup file for MSW

### Task 2: Unit Dropdown Integration Test
1. Create `client/src/pages/plasmas/__tests__/PlasmaModal.test.tsx`
2. Test: PlasmaModal renders Unit dropdown with mock units data
3. Test: Unit dropdown selection updates form value
4. Test: Unit dropdown validation (required field)

### Task 3: Plasma Dropdown Integration Test
1. Create `client/src/pages/cycles/__tests__/CycleModal.test.tsx`
2. Test: CycleModal renders Plasma dropdown with mock data
3. Test: Plasma dropdown selection updates form value

### Task 4: Toggle Switch Integration Tests
1. Create `client/src/pages/units/__tests__/Units.test.tsx` — Toggle + edit
2. Create `client/src/pages/plasmas/__tests__/Plasmas.test.tsx` — Toggle + edit
3. Create `client/src/pages/cycles/__tests__/Cycles.test.tsx` — Toggle + edit
4. Create/update `client/src/pages/admin/__tests__/Users.test.tsx` — Toggle + edit
5. Each test: renders page, finds switch, clicks toggle, verifies mutation called

### Task 5: Edit Modal Flow Integration Tests
1. Extend test files from Task 4 to also test edit flows
2. Each test: click edit icon, verify modal opens with pre-filled data, verify update API called

### Task 6: Server API Smoke Tests
1. Create `tests/integration/` directory
2. Create `tests/integration/auth.test.ts` — Login/logout API flow
3. Create `tests/integration/crud.test.ts` — Basic CRUD pattern for each entity
4. Use Elysia test helper or supertest-style approach

### Task 7: Final Verification
1. Run `bun run test` in client — all tests pass
2. Run `bun run test` in server — all tests pass
3. Verify no TypeScript errors
4. Verify build still passes

</specifics>

<deferred>
## Deferred Ideas

- Playwright browser E2E tests (separate future milestone)
- Full end-to-end dropdown cascade tests (Unit → Plasma → Cycle in a single flow)
- Performance/load tests
- Accessibility (a11y) tests
- Visual regression tests
- Dark mode toggle tests (explicitly deferred by Phase 01)
</deferred>