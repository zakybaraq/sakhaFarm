---
phase: 09-frontend-inventory-reporting-ui
plan: 00
tags: [frontend, react, inventory, reporting, ui]
key_files:
  existing:
    - client/src/api/feed.ts (Feed stock API client)
    - client/src/api/reporting.ts (Reporting API client)
    - client/src/components/layout/Layout.tsx
    - client/src/App.tsx (routing ready)
  to_create:
    - client/src/pages/feed/SuratJalan.tsx (modal form)
    - client/src/pages/feed/FeedStock.tsx (DataGrid)
    - client/src/pages/reports/Performance.tsx (charts)
    - client/src/pages/reports/StockResume.tsx (filters)
    - client/src/pages/reports/AuditLog.tsx (DataGrid)
    - client/src/pages/rbac/RbacManager.tsx (tabs)
    - client/src/components/charts/BwChart.tsx (@mui/x-charts)
    - client/src/components/charts/FcrChart.tsx (@mui/x-charts)
technologies: [React 18, Vite, TanStack Query, MUI v7, @mui/x-charts, xlsx]
metrics:
  duration: ~20min
  files: 10
  tasks: 6
date: "2026-04-17"
---

# Phase 09: Frontend — Inventory & Reporting UI

## Context

### From ROADMAP.md

**Depends on**: Phase 8 (Frontend Layout & Dashboard) ✅

**Deliverables:**
- Surat Jalan form (feed delivery input) with MUI form components + validation
- Feed stock dashboard (per unit, per plasma) with MUI DataGrid
- Low stock alerts panel with color-coded severity
- Resume Stock report page with filters (MUI DatePicker, Select, Autocomplete)
- Daily Performance report page with charts (@mui/x-charts: BW curve, FCR trend)
- Export buttons (CSV/Excel) using xlsx library
- Audit log viewer (admin only) with searchable DataGrid
- Daily recording form with live FCR/IP/deviation calculations
- Standard comparison chart: Actual vs Standard BW overlay
- RBAC Manager pages (roles, permissions, users)

### From PROJECT.md (Locked Decisions)

- **UI/UX Design**: Modern minimalist — clean whitespace, subtle shadows, consistent spacing
- **Color Palette**: Neutral base (slate/gray) with green accent (#2E7D32 for farm theme)
- **Components**: MUI with custom theme override for minimalist aesthetic
- **Responsive**: Desktop-first, tablet-friendly, mobile-adaptive

### From Prior Phases

- Phase 8 CONTEXT.md already exists with layout decisions
- Auth system ready: `/api/auth/login`, `/api/auth/me`, `/api/auth/permissions`
- API clients ready: `client/src/api/feed.ts`, `client/src/api/reporting.ts`
- Dashboard KPIs implemented in Phase 8

---

## Gray Areas (Discussed & Resolved)

### 1. Surat Jalan Entry
**Decision:** Modal popup for quick entry

- **D-01:** Surat Jalan form opens as a modal dialog
- **D-02:** Modal stays on current page for quick entry
- **D-03:** Best for daily feed deliveries workflow

### 2. Feed Stock Display
**Decision:** DataGrid with filters

- **D-04:** Feed stock displayed in MUI DataGrid
- **D-05:** Column filters for unit, plasma, feed type
- **D-06:** Sortable columns for large datasets

### 3. Performance Charts
**Decision:** Line chart for BW (with FCR area chart)

- **D-07:** BW growth curve shows deviation from standard
- **D-08:** Line chart provides clear visual comparison
- **D-09:** FCR trend shown as area chart on same page

### 4. Export Format
**Decision:** Excel (xlsx library)

- **D-10:** Export produces .xlsx files
- **D-11:** Better formatting, cell styling, multiple sheets support
- **D-12:** Matches enterprise use case

### 5. Audit Log Viewer
**Decision:** DataGrid with filters

- **D-13:** Standard MUI DataGrid with column filters
- **D-14:** Date, action, user filters available
- **D-15:** Admin-only access (enforced by backend)

### 6. RBAC Manager Structure
**Decision:** Single page with tabs

- **D-16:** Roles, permissions, users in one page
- **D-17:** Tabs for fast switching between sections
- **D-18:** Consistent with modern dashboard patterns

---

## Agent's Discretion

The following areas are delegated to the agent's judgment during implementation:

- **Loading states:** Use MUI Skeleton components for all async data
- **Empty states:** Custom empty state components with illustrations
- **Form validation:** Use React Hook Form + Zod for Surat Jalan form
- **Chart colors:** Green accent (#2E7D32) for actual data, gray for standard
- **DataGrid pagination:** Default 25 rows, user-configurable

---

## API Endpoints to Consume

| Feature | Endpoint | Method |
|---------|----------|--------|
| Feed Stock | `/api/feed/stock` | GET |
| Surat Jalan (create) | `/api/feed/surat-jalan` | POST |
| Stock Resume | `/api/reporting/stock-resume` | GET |
| Performance | `/api/reporting/performance` | GET |
| Audit Logs | `/api/audit/logs` | GET |
| Roles | `/api/rbac/roles` | GET/POST/PUT/DELETE |
| Permissions | `/api/rbac/permissions` | GET |
| Users | `/api/users` | GET/POST/PUT/DELETE |

---

## Patterns to Follow

- **Data fetching:** TanStack Query hooks (existing pattern from Phase 8)
- **Forms:** React Hook Form + Zod validation (following server-side Zod schemas)
- **Charts:** @mui/x-charts line chart components
- **Export:** xlsx library with Workbook → Worksheet → cell building
- **Layout:** Use existing Layout.tsx component structure
- **Theme:** Extend existing MUI theme (green accent #2E7D32)

---

## Next Steps

1. Run `/gsd-plan-phase 9` to create detailed execution plan
2. Planner uses this CONTEXT.md to implement all 6 areas
3. Implement Surat Jalan modal first, then Feed stock DataGrid, then charts

---

*Phase: 09-frontend-inventory-reporting-ui*
*Context gathered: 2026-04-17*