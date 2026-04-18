# 5-RESEARCH.md — Phase 5: Data Integration

## Phase Description
**Goal**: Connect UI to real backend API - remove dummy data, connect CRUD to API.

## Standard Stack

| Component | Library | Used In |
|-----------|---------|--------|
| Data Fetching | @tanstack/react-query | ✅ Already in use |
| API Client | Custom `apiClient` | ✅ Already in use |
| HTTP | Fetch API | ✅ Already in use |
| State Management | React Query | ✅ Already in use |
| Error Handling | MUI Alert | ✅ Already in use |

## Architecture Patterns

### Existing Pattern (REUSE this)
```
// Data fetching
const { data, isLoading } = useQuery({
  queryKey: ['units'],
  queryFn: listUnits,
  enabled: !!user,
})

// CRUD mutation
const mutation = useMutation({
  mutationFn: createUnit,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['units'] })
  },
})
```

### Files to Reference
- `client/src/pages/units/Units.tsx` — Full CRUD pattern
- `client/src/pages/plasmas/Plasmas.tsx` — Full CRUD pattern
- `client/src/api/client.ts` — API client setup

## Don't Hand-Roll

1. **API Client** - Use existing `client/src/api/client.ts`
2. **Query Configuration** - Keep react-query defaults (works)
3. **Error Handling** - Reuse MUI Alert pattern from Units.tsx
4. **Loading States** - Use MUI Skeleton

## Pages to Connect

| Priority | Page | Current State | Target API |
|----------|------|-------------|-----------|
| 1 | RbacManager | mockRoles, mockUsers | `/api/roles` |
| 2 | DailyRecording | mockCycles | `/api/cycles?status=active` |
| 3 | AuditLog | DUMMY_AUDIT | `/api/audit` |
| 4 | Performance | DUMMY_RECORDINGS | `/api/recordings/summary` |
| 5 | StockResume | DUMMY_STOCK | `/api/feed/summary` |
| 6 | FeedStock | LOW_STOCK_ALERT | `/api/feed/stock` |

## Backend API Endpoints Needed

### Already Available (confirmed via code)
- ✅ `/api/units` — CRUD
- ✅ `/api/plasmas` — CRUD
- ✅ `/api/cycles` — CRUD + `?status=active`
- ✅ `/api/users` — CRUD
- ✅ `/api/recordings` — CRUD

### Need Verification
- ❓ `/api/roles` — Not in v1.0
- ❓ `/api/audit` — Not in v1.0
- ❓ `/api/feed/stock` — Need verify
- ❓ `/api/recordings/summary` — Need verify

## Common Pitfalls

1. **Missing Backend APIs** - Some endpoints may not exist
   - Mitigation: Check server routes first
2. **CORS Issues** - Frontend/backend on different ports
   - Status: Already handled (same origin via Vite proxy)
3. **Auth Token** - Need to include in requests
   - Status: Already handled in apiClient
4. **Cycle Status** - Recording only for active cycles
   - Status: Already enforced in backend

## Implementation Approach

### Step by Step

1. **Check backend routes** - What endpoints exist?
2. **Create API functions** - In `client/src/api/`
3. **Replace mock** - `useQuery({ queryFn: ... })`
4. **Test** - Verify data loads

### Reference Files

| Task | Reference |
|------|-----------|
| Create API client | `client/src/api/units.ts` |
| Add useQuery | `client/src/pages/units/Units.tsx` |
| Add useMutation | `client/src/pages/units/Units.tsx` |
| Error handling | `client/src/pages/plasmas/PlasmaModal.tsx` |

## Code Examples

### API Function Pattern
```typescript
// client/src/api/roles.ts
import { apiClient } from './client'

export function listRoles(): Promise<RolesResponse> {
  return apiClient<RolesResponse>('/roles')
}

export function createRole(data: RoleData): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>('/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
```

### Page Integration
```typescript
// In RbacManager.tsx
const { data, isLoading } = useQuery({
  queryKey: ['roles'],
  queryFn: listRoles,
})
```

## Risks & Mitigation

| Risk | Severity | Mitigation |
|------|-----------|------------|
| Backend endpoint missing | High | Verify first, then create |
| Auth issues | Medium | Already working in other pages |
| Data format mismatch | Low | Match existing types |

---

_Date: 2026-04-18_
_Researcher: Manual (gsd-phase-researcher not available)_