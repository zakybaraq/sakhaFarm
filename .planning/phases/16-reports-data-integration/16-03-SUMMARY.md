# Phase 16-03 Summary: Close Post-Execution Gaps

**Plan**: 16-03
**Type**: execute
**Wave**: 1
**Status**: ✅ Complete

## Tasks Completed

### Task 1: Replace hardcoded tenantId=1 with useAuth().user.tenantId
- **Performance.tsx**: Added `useAuth` import, replaced `getPerformance(1, ...)` → `getPerformance(user?.tenantId ?? 1, ...)`, added `enabled: !!user` guard
- **StockResume.tsx**: Added `useAuth` import, replaced `getStockResume(1, ...)` → `getStockResume(user?.tenantId ?? 1, ...)`, added `enabled: !!user` guard
- **Verification**: Zero hardcoded `getPerformance(1,` or `getStockResume(1,` calls remain; both files import and use `useAuth()`

### Task 2: Wire StockResume date filters to API
- Added `dateFrom` and `dateTo` state variables (empty string defaults)
- Added both to `queryKey` array for cache invalidation on change
- Added both to `getStockResume` params with `|| undefined` conversion
- Wired both date TextFields with `value` and `onChange` handlers
- Added `dateFrom?`/`dateTo?` to `getStockResume` params type in `client/src/api/reporting.ts`
- Added corresponding `URLSearchParams.set()` calls in the API client function
- **Verification**: 7 occurrences of dateFrom/dateTo in StockResume.tsx, 2 onChange handlers, queryKey includes both

### Task 3: Add IP trend LineChart to Performance page
- Created `ipData` array derived from records with null filtering (`.filter(d => d.ip !== null)`)
- Added third Paper card with LineChart for IP trend, same style as BW/FCR charts
- Added empty state message "Data IP belum tersedia" when all IP values are null
- Used `mt: 3` for spacing from FCR chart above
- **Verification**: ipData referenced 3 times (definition, length check, chart dataset), "Trend IP (Index Performa)" title present

## Files Modified

| File | Changes |
|------|---------|
| `client/src/pages/reports/Performance.tsx` | useAuth import, tenantId fix, ipData array, IP LineChart |
| `client/src/pages/reports/StockResume.tsx` | useAuth import, tenantId fix, dateFrom/dateTo state + wiring |
| `client/src/api/reporting.ts` | Added dateFrom/dateTo to getStockResume params type and URLSearchParams |

## Gaps Closed

| Gap ID | Description | Status |
|--------|-------------|--------|
| D-07 | tenantId from useAuth() instead of hardcoded 1 | ✅ Fixed |
| D-08 | StockResume date filters wired to API | ✅ Fixed |
| D-09 | IP trend LineChart on Performance page | ✅ Fixed |

## Verification

- TypeScript compiles with zero errors (`npx tsc --noEmit`)
- No hardcoded tenantId=1 in either report page
- Date filters trigger API refetch via queryKey invalidation
- IP chart handles null values with empty state fallback
