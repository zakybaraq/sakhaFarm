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

## Locked Decisions

These choices are **FINAL** — researcher and planner must NOT revisit alternatives:

| ID | Choice | Rationale |
|----|--------|-----------|
| L-01 | MUI DataGrid for all tabular data | Enterprise-grade sorting/filtering, consistent with Phase 8 |
| L-02 | Modal popup for Surat Jalan form | Quick entry workflow, stays on current page |
| L-03 | @mui/x-charts for charts | Official MUI library, consistent theme |
| L-04 | xlsx library for Excel export | Better formatting, multiple sheets support |
| L-05 | Single-page RBAC Manager with tabs | Modern dashboard pattern |
| L-06 | Green accent #2E7D32 | From PROJECT.md design system |
| L-07 | TanStack Query for data fetching | Already implemented in Phase 8 |
| L-08 | React Hook Form + Zod for forms | Matches server-side validation |
| L-09 | Desktop-first responsive | From PROJECT.md |
| L-10 | Line chart for BW, area chart for FCR | Clear visual comparison of actual vs standard |

---

## the agent's Discretion

These areas are delegated to implementation judgment — no need to ask user:

- **Loading states:** Use MUI Skeleton components
- **Empty states:** Custom empty state components
- **Chart colors:** Green (#2E7D32) for actual, gray for standard
- **DataGrid pagination:** Default 25 rows, user-configurable

---

## Deferred Ideas (OUT OF SCOPE)

These were discussed but NOT locked — lower priority, can revisit later:

- Mobile app (out of scope per REQUIREMENTS.md)
- IoT integration / sensor data
- Predictive analytics / ML
- Billing & invoicing
- Push notification system (WhatsApp/Email)

---

## Dependencies

- **Depends on:** Phase 8 (Frontend Layout & Dashboard) — completed
- **Auth ready:** `/api/auth/login`, `/api/auth/me`, `/api/auth/permissions`
- **API clients ready:** `client/src/api/feed.ts`, `client/src/api/reporting.ts`

---

## Deliverables (from ROADMAP.md)

1. Surat Jalan form (modal) — feed delivery input with validation
2. Feed stock dashboard — DataGrid per unit/plasma
3. Low stock alerts — color-coded severity panel
4. Resume Stock report — filters (DatePicker, Select, Autocomplete)
5. Daily Performance report — @mui/x-charts (BW curve, FCR trend)
6. Export buttons — Excel via xlsx library
7. Audit log viewer — searchable DataGrid (admin only)
8. RBAC Manager — roles, permissions, users tabs

---

## API Endpoints to Consume

| Feature | Endpoint | Method |
|---------|----------|--------|
| Feed Stock | `/api/feed/stock` | GET |
| Surat Jalan (create) | `/api/feed/surat-jalan` | POST |
| Stock Resume | `/api/reporting/stock-resume` | GET |
| Performance | `/api/reporting/performance` | GET |
| Audit Logs | `/api/audit/logs` | GET |
| RBAC Roles | `/api/rbac/roles` | GET/POST/PUT/DELETE |
| RBAC Permissions | `/api/rbac/permissions` | GET |
| Users | `/api/users` | GET/POST/PUT/DELETE |

---

## Patterns to Follow

- **Data fetching:** TanStack Query hooks (from Phase 8)
- **Forms:** React Hook Form + Zod
- **Charts:** @mui/x-charts line/area charts
- **Export:** xlsx with Workbook → Worksheet → cells
- **Layout:** Use existing Layout.tsx component
- **Theme:** Extend MUI theme with green #2E7D32

---

*Phase: 09-frontend-inventory-reporting-ui*
*Context: 2026-04-17*