# 05-CONTEXT.md — Phase 5: Data Integration

## Background

Phase 5 connects the frontend UI to backend APIs, removing dummy/mocked data.

## Current State

### Pages USING API (already connected ✅):
- Units.tsx - uses `listUnits`, `createUnit`, `updateUnit`, `deleteUnit`
- UnitModal.tsx - uses API through modal
- Plasmas.tsx - uses `listPlasmas`, `createPlasma`, `updatePlasma`, `deletePlasma`
- PlasmaModal.tsx - uses API through modal
- Cycles.tsx - uses `listCycles`, `createCycle`, `updateCycle`, `deleteCycle`
- CycleModal.tsx - uses API through modal
- Users.tsx - uses `listUsers`, `createUser`, `activateUser`, `deactivateUser`

### Pages with MOCK/DUMMY data (needs connection ❌):

| File | Mock Data | Type |
|------|-----------|------|
| RbacManager.tsx | mockRoles, mockUsers | Hardcoded arrays |
| DailyRecording.tsx | mockCycles, mockStandards | Hardcoded arrays |
| Performance.tsx | DUMMY_RECORDINGS | Hardcoded array |
| StockResume.tsx | DUMMY_STOCK | Hardcoded array |
| FeedStock.tsx | LOW_STOCK_ALERT | Hardcoded data |
| AuditLog.tsx | DUMMY_AUDIT | Hardcoded array |

## Gray Areas

### 1. API Availability
**Question**: Apakah semua backend API endpoints sudah tersedia untuk:
- Roles CRUD (`/api/roles`)
- Users CRUD already done in Phase 3
- Audit logs (`/api/audit`)
- Feed stock (`/api/feed/stock`)
- Performance reports (`/api/recordings/summary`)

### 2. Error Handling
**Decision**: 
- Use existing Alert component for errors
- Show toast/snackbar untuk success
- Reuse pattern dari existing pages

### 3. Loading States
**Decision**:
- Use `isLoading` dari react-query
- Show MUI Skeleton untuk table loading
- Existing pages sudah ada pattern-nya

### 4. Caching Strategy
**Decision**:
- Keep react-query default (5 min stale time)
- Invalidate on mutations
- Existing pattern works fine

## Priority for Implementation

| Priority | Page | Complexity | Notes |
|-----------|------|------------|-------|
| 1 | RbacManager | Medium | Roles CRUD needed |
| 2 | DailyRecording | Low | Just replace cycles dropdown |
| 3 | AuditLog | Medium | Audit trail API |
| 4 | Performance | High | Complex calculations |
| 5 | StockResume | High | Complex calculations |
| 6 | FeedStock | Low | Just stock display |

## Dependencies

- Backend API `/api/roles` — belum ada di Phase 3
- Backend API `/api/audit` — perlu check
- Existing API client pattern — reuse

## Locked Decisions

1. **API Pattern**: Use existing `apiClient` from `./client`
2. **React Query**: Keep existing pattern
3. **Error Display**: Use MUI Alert component
4. **Loading**: Use Skeleton from MUI

## Next Steps

1. Create API functions for missing endpoints
2. Replace mock data dengan useQuery calls
3. Test end-to-end

---

_Date: 2026-04-18_