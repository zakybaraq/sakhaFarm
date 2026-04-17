# 08-03-SUMMARY.md — Wave 3: Dashboard KPI Cards & API Modules

**Phase:** 08-frontend-layout-dashboard  
**Wave:** 3 (final)  
**Date:** 2026-04-17  
**Status:** ✅ Complete

---

## What Was Done

### Task 1: API Modules & TanStack Query Hooks

Created 5 files for dashboard data fetching:

| File | Exports | Purpose |
|------|---------|---------|
| `client/src/api/cycles.ts` | `listActiveCycles`, `Cycle`, `CyclesResponse` | Fetches active cycles from `/cycles?status=active&tenantId=N` |
| `client/src/api/reporting.ts` | `getPerformance`, `getStockResume`, types | Fetches performance data and stock resume from reporting endpoints |
| `client/src/api/feed.ts` | `getFeedStock`, `FeedStockItem`, `FeedStockResponse` | Fetches feed stock from `/feed/stock` with optional filters |
| `client/src/hooks/useActiveCycles.ts` | `useActiveCycles` | TanStack Query hook for active cycles (5-min staleTime, enabled guard) |
| `client/src/hooks/useKpiData.ts` | `useKpiData`, `KpiData` | Aggregates 3 API calls into 4 KPI values |

**Key design decisions:**
- All API modules use `apiClient` from `./client` with `credentials: 'include'`
- `useKpiData` aggregates data from `/cycles`, `/reporting/performance`, and `/feed/stock`
- All hooks have `enabled: !!user` guard — no fetches until authenticated
- StaleTime: 5 min for cycles/performance, 2 min for stock (more volatile)
- `avgFcr` and `avgIp` are rounded to 2 decimal places
- `lowStockAlerts` counts items where `isLow === true`

### Task 2: KpiCard Component & Dashboard Page

Created 2 files for the dashboard UI:

| File | Exports | Purpose |
|------|---------|---------|
| `client/src/components/dashboard/KpiCard.tsx` | `KpiCard` | Reusable KPI card with icon, value, title, subtitle, loading state |
| `client/src/pages/Dashboard.tsx` | `DashboardPage` | Dashboard page with 4 KPI cards in responsive grid |

**KpiCard features:**
- Shows "—" while data is loading
- Hover effect: border turns primary green, shadow appears
- Accepts `icon`, `value`, `title`, `color`, `subtitle`, `loading` props
- Uses MUI Card with custom sx styling matching UI-SPEC

**Dashboard 4 KPI cards:**
1. **Active Cycles** — `AutorenewIcon`, green (#2E7D32), count from API
2. **Avg FCR** — `TrendingDownIcon`, blue (#1976D2), "Feed Conversion Ratio" subtitle
3. **Avg IP** — `SpeedIcon`, green (#2E7D32), "Income Over Feed Cost" subtitle
4. **Low Stock Alerts** — `WarningAmberIcon`, orange (#ED6C02) when alerts > 0, green when 0

**Responsive grid:** Uses MUI v7 `Grid` with `size={{ xs: 12, sm: 6, md: 3 }}` pattern (1 col mobile, 2 col tablet, 4 col desktop).

---

## Verification Results

| Check | Result |
|-------|--------|
| `cd client && bun run build` exits 0 | ✅ Built in 1.54s |
| `KpiCard` export exists | ✅ `export function KpiCard` |
| `DashboardPage` export exists | ✅ `export function DashboardPage` |
| `useKpiData` returns 4 KPI values | ✅ `activeCycles`, `avgFcr`, `avgIp`, `lowStockAlerts` |
| KPI card grid uses MUI v7 `size` prop | ✅ 4 instances of `size={{ xs: 12, sm: 6, md: 3 }}` |
| All API modules use `apiClient` | ✅ cycles, reporting, feed all import from `./client` |
| LSP diagnostics clean | ✅ No errors in any file |

---

## Files Modified

| File | Action |
|------|--------|
| `client/src/api/cycles.ts` | Created |
| `client/src/api/reporting.ts` | Created |
| `client/src/api/feed.ts` | Created |
| `client/src/hooks/useActiveCycles.ts` | Created |
| `client/src/hooks/useKpiData.ts` | Created |
| `client/src/components/dashboard/KpiCard.tsx` | Created |
| `client/src/pages/Dashboard.tsx` | Replaced (was placeholder) |

---

## Threat Mitigations

| Threat | Mitigation |
|--------|------------|
| T-08-11: Information Disclosure | All API endpoints behind `requirePermission` middleware; tenant isolation via `tenant_id`; client only displays authorized data |
| T-08-12: Tampering (KPI calculations) | Client-side averaging is cosmetic; backend is source of truth |
| T-08-13: DoS (multiple API calls) | TanStack Query with staleTime prevents excessive refetching (5-min for cycles/performance, 2-min for stock) |

---

## Phase 08 Complete

This was the final wave of Phase 8. All three waves are now complete:
- **Wave 1 (08-01):** API client, auth context, theme, layout, routing
- **Wave 2 (08-02):** Login page, sidebar, navbar, footer, protected routes
- **Wave 3 (08-03):** Dashboard KPI cards, API modules, TanStack Query hooks