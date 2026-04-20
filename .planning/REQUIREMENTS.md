# REQUIREMENTS.md — v1.2 Bug Fixes & Data Integration

## Overview

Fix all broken UI interactions and connect every page to real backend data.
Zero dummy data, zero 500 errors, correct business logic throughout.

---

## v1 Requirements

### Category: Toggle & Status Fixes (TOGGLE)

- [x] **TOGGLE-01**: Toggle on/off (active/deactivate) works without 500 error on Units page
- [x] **TOGGLE-02**: Toggle on/off (active/deactivate) works without 500 error on Plasmas page
- [ ] **TOGGLE-03**: Cycle status displayed as read-only badge (Active / Completed / Failed) — no toggle
- [ ] **TOGGLE-04**: Cycle edit and delete access rules defined and enforced (business logic documented)

### Category: Plasmas Page (PLASMA)

- [ ] **PLASMA-01**: Phone number column visible in Plasmas table (DataGrid/ResponsiveTable)
- [ ] **PLASMA-02**: Phone input field accepts numeric characters only (validation enforced)

### Category: Recordings Page (REC)

- [ ] **REC-01**: Cycle dropdown on Recordings page populated from active cycles in DB
- [ ] **REC-02**: Deviasi BW only calculated and displayed when recording data exists (no negative value on empty state)

### Category: Feed Page (FEED)

- [ ] **FEED-01**: Feed type (jenis pakan) dropdown connected to DB feed products table
- [ ] **FEED-02**: Supplier dropdown connected to DB (or removed if not in schema)

### Category: Reports (REPORT)

- [ ] **REPORT-01**: Performance report shows real FCR/IP data calculated from recordings (no dummy data)
- [ ] **REPORT-02**: Stock Resume unit/plasma filter dropdowns populated from DB
- [ ] **REPORT-03**: Audit report displays real audit log entries from DB

### Category: RBAC (RBAC)

- [ ] **RBAC-01**: RBAC Roles tab displays correct roles data from API
- [ ] **RBAC-02**: RBAC Permissions tab verified and displays correct data
- [ ] **RBAC-03**: RBAC Role-Permission assignment tab verified and functional

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
| TOGGLE-01 | Phase 13 | TBD | Pending |
| TOGGLE-02 | Phase 13 | TBD | Pending |
| TOGGLE-03 | Phase 14 | TBD | Pending |
| TOGGLE-04 | Phase 14 | TBD | Pending |
| PLASMA-01 | Phase 14 | TBD | Pending |
| PLASMA-02 | Phase 14 | TBD | Pending |
| REC-01 | Phase 15 | TBD | Pending |
| REC-02 | Phase 15 | TBD | Pending |
| FEED-01 | Phase 15 | TBD | Pending |
| FEED-02 | Phase 15 | TBD | Pending |
| RBAC-01 | Phase 15 | TBD | Pending |
| RBAC-02 | Phase 15 | TBD | Pending |
| RBAC-03 | Phase 15 | TBD | Pending |
| REPORT-01 | Phase 16 | TBD | Pending |
| REPORT-02 | Phase 16 | TBD | Pending |
| REPORT-03 | Phase 16 | TBD | Pending |
