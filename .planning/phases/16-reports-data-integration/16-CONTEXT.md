# Phase 16: Reports Data Integration - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Connect Performance, Stock Resume, and Audit report pages to real backend data. Zero mock/placeholder data in all three reports. Includes open gaps discovered post-initial-execution: tenantId wiring, date filter wiring, and IP metric display.

</domain>

<decisions>
## Implementation Decisions

### Completed (Plans 16-01 and 16-02 executed)
- **D-01-done:** Performance.tsx uses `useQuery` with `getPerformance()` — BW and FCR charts show real recording data
- **D-02-done:** Cycle dropdown populated from `listCycles()` API — auto-selects first cycle on load
- **D-03-done:** StockResume.tsx uses `useQuery` with `getStockResume()` — stock table shows real data
- **D-04-done:** Unit, Plasma, Feed filter Autocompletes populated from `listUnits()`, `listPlasmas()`, `listFeedProducts()` APIs
- **D-05-done:** Audit report already uses real API — no changes needed (REPORT-03)
- **D-06-done:** `listFeedProducts()` added to `client/src/api/feed.ts`

### Open Gaps (discovered post-execution — must be fixed)
- **D-07:** tenantId should come from `useAuth().user.tenantId`, NOT hardcoded as `1`. Both Performance.tsx and StockResume.tsx currently hardcode `tenantId=1` in API calls. Fix: call `const { user } = useAuth()` and pass `user?.tenantId ?? 1` to all reporting API functions.

- **D-08:** StockResume date filters (Tanggal Mulai / Tanggal Akhir) are present in the UI but NOT wired to the API. Backend already supports `dateFrom`/`dateTo` in `getStockResume`. Fix needed:
  1. Add `dateFrom?: string` and `dateTo?: string` to `getStockResume` params in `client/src/api/reporting.ts`
  2. Add state + onChange handlers in StockResume.tsx
  3. Add `dateFrom`, `dateTo` to `queryKey` array

- **D-09:** IP (Index Performa) metric should be displayed on the Performance page as a third LineChart, same style as the existing FCR chart. The API already returns `ip: number | null` per PerformanceRecord. Add a "Trend IP (Index Performa)" LineChart card below the FCR chart.

### Export Strategy
- **D-10:** Client-side `exportToXlsx()` is the final approach for Stock Resume export. No server-side export endpoint needed. When date filters are wired (D-08), export will operate on the already-loaded `rows` array.

### Claude's Discretion
- IP chart null handling: when `ip` is `null` for some records, decide whether to skip those points or show 0 — follow same pattern as any existing null-safe chart handling in the codebase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Reports API
- `client/src/api/reporting.ts` — `getPerformance`, `getStockResume` clients; need to add `dateFrom`/`dateTo` to `getStockResume` params
- `server/src/modules/reporting/reporting.service.ts` — backend already supports `dateFrom`/`dateTo` for both endpoints (lines 18-19, 27-28)

### Auth Context
- `client/src/contexts/AuthContext.tsx` — exposes `user: User | null`; `User.tenantId: number` is available via `useAuth().user.tenantId`
- `client/src/types/index.ts` — `User` interface includes `tenantId: number`

### Report Pages
- `client/src/pages/reports/Performance.tsx` — current implementation; needs tenantId fix + IP chart
- `client/src/pages/reports/StockResume.tsx` — current implementation; needs tenantId fix + date filter wiring

### Feed API
- `client/src/api/feed.ts` — `listFeedProducts()` already added here

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MUI LineChart` (from `@mui/x-charts/LineChart`): already used for BW and FCR — reuse same pattern for IP chart
- `useAuth()` hook: available from `AuthContext` — call `const { user } = useAuth()` to get `user.tenantId`
- `exportToXlsx`: already imported and used in StockResume — keep as-is

### Established Patterns
- TanStack Query `useQuery` with `queryKey` arrays for cache invalidation on filter changes
- `useEffect` to auto-select first cycle when cycles load (Performance.tsx pattern)
- `useMemo` for derived arrays from API responses (StockResume.tsx pattern)

### Integration Points
- `client/src/api/reporting.ts` → `getStockResume` needs `dateFrom?`/`dateTo?` param additions
- `Performance.tsx` + `StockResume.tsx` → replace `getPerformance(1, ...)` / `getStockResume(1, ...)` with `getPerformance(user?.tenantId ?? 1, ...)` pattern

</code_context>

<specifics>
## Specific Ideas

- IP chart should be a third `<Paper>` card below the FCR card, titled "Trend IP (Index Performa)" — consistent with existing card style
- Tenant ID should be `user?.tenantId ?? 1` (fallback to 1 only if user not yet loaded) to avoid breaking the loading state

</specifics>

<deferred>
## Deferred Ideas

- Server-side Excel export endpoint (`/api/reporting/stock-resume/export`) — not needed; client-side export is sufficient
- Performance page IP KPI summary cards (Latest BW / FCR / IP at top) — only the IP chart is in scope, not summary cards

</deferred>

---

*Phase: 16-reports-data-integration*
*Context gathered: 2026-04-21*
