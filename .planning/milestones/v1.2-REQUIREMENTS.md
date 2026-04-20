# REQUIREMENTS.md — v1.2 Bug Fixes & Data Integration

## Overview

Fix all broken UI interactions and connect every page to real backend data.
Zero dummy data, zero 500 errors, correct business logic throughout.

---

## v1 Requirements

### Category: Toggle & Status Fixes (TOGGLE)

- [x] **TOGGLE-01**: Toggle on/off (active/deactivate) works without 500 error on Units page
- [x] **TOGGLE-02**: Toggle on/off (active/deactivate) works without 500 error on Plasmas page
- [x] **TOGGLE-03**: Cycle status displayed as read-only badge (Active / Completed / Failed) — no toggle
- [x] **TOGGLE-04**: Cycle edit and delete access rules defined and enforced (business logic documented)

### Category: Plasmas Page (PLASMA)

- [x] **PLASMA-01**: Phone number column visible in Plasmas table (DataGrid/ResponsiveTable)
- [x] **PLASMA-02**: Phone input field accepts numeric characters only (validation enforced)

### Category: Recordings Page (REC)

- [x] **REC-01**: Cycle dropdown on Recordings page populated from active cycles in DB
- [x] **REC-02**: Deviasi BW only calculated and displayed when recording data exists (no negative value on empty state)

### Category: Feed Page (FEED)

- [x] **FEED-01**: Feed type (jenis pakan) dropdown connected to DB feed products table
- [x] **FEED-02**: Supplier dropdown connected to DB (or removed if not in schema)

### Category: Reports (REPORT)

- [x] **REPORT-01**: Performance report shows real FCR/IP data calculated from recordings (no dummy data)
- [x] **REPORT-02**: Stock Resume unit/plasma filter dropdowns populated from DB
- [x] **REPORT-03**: Audit report displays real audit log entries from DB

### Category: RBAC (RBAC)

- [x] **RBAC-01**: RBAC Roles tab displays correct roles data from API
- [x] **RBAC-02**: RBAC Permissions tab verified and displays correct data
- [x] **RBAC-03**: RBAC Role-Permission assignment tab verified and functional

---

## Future Requirements (Deferred)

- Dark mode toggle
- CSV/Excel export for reports
- Performance optimization (virtual scrolling)
- Server API smoke tests (blocked by Drizzle mock infrastructure)

---

## Out of Scope

- New features — this milestone is bug fixes and data integration only
- Mobile app, IoT, ML/predictive analytics
- Billing, notifications (WhatsApp/Email)

---

## Traceability

| REQ-ID | Phase | Plan | Status |
|--------|-------|------|--------|
| TOGGLE-01 | Phase 13 | 13-01 | ✅ Complete |
| TOGGLE-02 | Phase 13 | 13-02 | ✅ Complete |
| TOGGLE-03 | Phase 14 | 14-01 | ✅ Complete |
| TOGGLE-04 | Phase 14 | 14-01 | ✅ Complete |
| PLASMA-01 | Phase 14 | 14-01 | ✅ Complete |
| PLASMA-02 | Phase 14 | 14-01 | ✅ Complete |
| REC-01 | Phase 15 | 15-01 | ✅ Complete |
| REC-02 | Phase 15 | 15-01 | ✅ Complete |
| FEED-01 | Phase 15 | 15-02 | ✅ Complete |
| FEED-02 | Phase 15 | 15-02 | ✅ Complete |
| RBAC-01 | Phase 15 | 15-02 | ✅ Complete |
| RBAC-02 | Phase 15 | 15-02 | ✅ Complete |
| RBAC-03 | Phase 15 | 15-02 | ✅ Complete |
| REPORT-01 | Phase 16 | 16-01 | ✅ Complete |
| REPORT-02 | Phase 16 | 16-02 | ✅ Complete |
| REPORT-03 | Phase 16 | N/A | ✅ Already done |
