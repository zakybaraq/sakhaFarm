# ROADMAP.md — Sakha Farm Management System

## Milestones

- **v1.0**: Core Farm Management — [Archived](./milestones/v1.0-ROADMAP.md)
- **v1.1**: UI/UX Improvement — [Archived](./milestones/v1.1-ROADMAP.md) ✅ shipped 2026-04-20
- **v1.2**: Bug Fixes & Data Integration — [Active]

---

<details>
<summary>✅ v1.1 UI/UX Improvement (Phases 1–12) — SHIPPED 2026-04-20</summary>

- [x] Phase 1: Sidebar Layout Fixes — completed 2026-04-18
- [x] Phase 2: DataGrid Improvements — completed 2026-04-18
- [x] Phase 3: Menu & Naming Cleanup — completed 2026-04-18
- [x] Phase 4: Feature Additions — completed 2026-04-18
- [x] Phase 5: Data Integration — completed 2026-04-18
- [x] Phase 6: Code Cleanup — completed 2026-04-18
- [x] Phase 7: Audit Filter UI — completed 2026-04-19
- [x] Phase 8: Modern Responsive Table UI — completed 2026-04-20
- [x] Phase 9: Frontend Fixes — completed 2026-04-18
- [x] Phase 10: Nyquist Validation & Documentation — completed 2026-04-20
- [x] Phase 11: ESLint Warning Cleanup — completed 2026-04-20
- [x] Phase 12: E2E Dropdown & Integration Tests — completed 2026-04-20

Full details: [milestones/v1.1-ROADMAP.md](./milestones/v1.1-ROADMAP.md)

</details>

---

## v1.2 - Bug Fixes & Data Integration

**Goal**: Fix all broken UI interactions and connect every page to real backend data. Zero dummy data, zero 500 errors, correct business logic throughout.

### Phases

- [ ] **Phase 13: Backend Toggle Fix** — Repair 500 errors on Units and Plasmas toggle endpoints
- [ ] **Phase 14: Cycle & Plasma UI Fixes** — Replace cycle status toggle with read-only badge, enforce edit/delete rules, add phone column and numeric validation
- [x] **Phase 15: Recordings, Feed & RBAC Data Integration** — Wire Recordings dropdowns, Feed dropdowns, and all RBAC tabs to real DB data — completed 2026-04-21
- [ ] **Phase 16: Reports Data Integration** — Connect Performance, Stock Resume, and Audit reports to real DB data

## Phase Details

### Phase 13: Backend Toggle Fix

**Goal**: Units and Plasmas toggle actions complete without a 500 error
**Depends on**: Nothing (backend fix, unblocks all UI work)
**Requirements**: TOGGLE-01, TOGGLE-02
**Success Criteria** (what must be TRUE):

1. Clicking the toggle on the Units page activates or deactivates a unit and the row updates without any error toast or network error
2. Clicking the toggle on the Plasmas page activates or deactivates a plasma and the row updates without any error toast or network error
3. A repeated toggle (on → off → on) on the same record succeeds both times with the correct new status reflected in the table
   **Plans**: TBD
   **UI hint**: yes

### Phase 14: Cycle & Plasma UI Fixes

**Goal**: Cycle status is read-only and edit/delete rules are enforced; Plasmas table shows phone number with numeric-only input
**Depends on**: Phase 13
**Requirements**: TOGGLE-03, TOGGLE-04, PLASMA-01, PLASMA-02
**Success Criteria** (what must be TRUE):

1. The Cycles table shows status as a colored read-only badge (Active / Completed / Failed) with no toggle control rendered
2. Attempting to edit or delete a cycle that business rules prohibit results in a clear, descriptive error or disabled control — not a silent failure
3. The Plasmas table displays a "Phone" column with the correct phone number for each plasma record
4. The phone input field in the Plasma form rejects non-numeric characters (letters, symbols) and only accepts digits
   **Plans**: TBD
   **UI hint**: yes

### Phase 15: Recordings, Feed & RBAC Data Integration

**Goal**: All dropdowns on the Recordings and Feed pages, and all three RBAC tabs, are populated from real DB data with no dummy values
**Depends on**: Phase 13
**Requirements**: REC-01, REC-02, FEED-01, FEED-02, RBAC-01, RBAC-02, RBAC-03
**Success Criteria** (what must be TRUE):

1. The cycle dropdown on the Recordings page lists only active cycles fetched from the database — creating a new recording pre-selects a valid cycle
2. Deviasi BW is blank (or shows a dash) on the Recordings page when no recording data exists; it only shows a calculated value when recordings are present
3. The feed type dropdown on the Feed page lists products fetched from the DB feed products table; no hardcoded options remain
4. All three RBAC tabs (Roles, Permissions, Role-Permission assignment) load data from the API and display correct rows without errors
   **Plans**: 2 plans
   Plans:

- [x] 15-01-PLAN.md — Wire Recordings page to DB standards, fix Deviasi BW dash display
- [x] 15-02-PLAN.md — Wire Feed page and RBAC tabs to real DB APIs

### Phase 16: Reports Data Integration

**Goal**: All three report pages display real data from the database with no dummy placeholders
**Depends on**: Phase 15
**Requirements**: REPORT-01, REPORT-02, REPORT-03
**Success Criteria** (what must be TRUE):

1. The Performance report calculates and displays FCR and IP values derived from actual recording entries — no hardcoded or placeholder numbers appear
2. The Stock Resume page's unit and plasma filter dropdowns are populated from DB; selecting a filter updates the displayed stock data
3. The Audit report page displays real audit log entries (user, action, timestamp, entity) retrieved from the backend — the table is not empty on a system with activity
   **Plans**: 3 plans
   Plans:

- [x] 16-01-PLAN.md — Wire Performance report to real FCR/IP data from API
- [x] 16-02-PLAN.md — Wire Stock Resume to real data with populated filter dropdowns
- [x] 16-03-PLAN.md — Close gaps: tenantId from auth, date filter wiring, IP chart
      **UI hint**: yes

### Phase 17: Feed Types & Brands Management

**Goal**: Add ability to manage feed product types (e.g., Starter, Finisher, Grower) and their brands (e.g., Charoen Pokphand, Wonokoyo)
**Depends on**: Phase 15
**Requirements**: FEED-TYPE-01, FEED-BRAND-01
**Success Criteria** (what must be TRUE):

1. A new "Feed Types" section/page exists to manage feed categories/types
2. A new "Feed Brands" section/page exists to manage feed brands/vendors
3. Feed products can be associated with a type and brand
4. Dropdowns in Feed page are populated from these new tables
   **Plans**: TBD
   **UI hint**: yes

### Phase 18: Supplier Management

**Goal**: Add ability to manage suppliers/vendors for feed, vitamins, and other farm supplies
**Depends on**: Phase 17
**Requirements**: SUPPLIER-01, SUPPLIER-02
**Success Criteria** (what must be TRUE):

1. A "Suppliers" page exists to CRUD supplier records
2. Supplier data includes: name, contact person, phone, address, category (feed/vitamin/medicine/other)
3. Suppliers can be linked to purchase transactions (Surat Jalan)
   **Plans**: 2 plans
   Plans:

- [ ] 18-01-PLAN.md — Backend CRUD for suppliers
- [ ] 18-02-PLAN.md — Frontend supplier page + Surat Jalan integration
      **UI hint**: yes

### Phase 19: Vitamins/Medicines Management

**Goal**: Add inventory management for vitamins and medicines used in farm operations
**Depends on**: Phase 18
**Requirements**: VITAMIN-01, VITAMIN-02
**Success Criteria** (what must be TRUE):

1. A "Vitamins/Medicines" page exists to manage pharmaceutical supplies
2. Can track inventory levels, unit of measure, and expiration dates
3. Can record usage/consumption per cycle
**Plans**: 2 plans
   Plans:

- [ ] 19-01-PLAN.md — Backend: schemas, service layer, REST API
- [ ] 19-02-PLAN.md — Frontend: CRUD page, modal, daily recording integration

   **UI hint**: yes

### Phase 20: Sidebar Reorganization

**Goal**: Group sidebar menu items by function for better usability
**Depends on**: Phase 19
**Requirements**: UI-01, UI-02
**Success Criteria** (what must be TRUE):

1. Sidebar menus are grouped into logical categories (e.g., "Master Data", "Operations", "Reports", "Settings")
2. Master Data: Units, Plasmas, Feed Types, Feed Brands, Suppliers, Vitamins/Medicines
3. Operations: Cycles, Recordings, Feed Stock
4. Reports: Performance, Stock Resume
5. Settings: RBAC (Users, Roles, Permissions)
   **Plans**: TBD
   **UI hint**: yes

## Progress

| Phase                                        | Plans Complete | Status      | Completed  |
| -------------------------------------------- | -------------- | ----------- | ---------- |
| 13. Backend Toggle Fix                       | 0/1            | Not started | -          |
| 14. Cycle & Plasma UI Fixes                  | 1/1            | Not started | -          |
| 15. Recordings, Feed & RBAC Data Integration | 2/2            | Completed   | 2026-04-21 |
| 16. Reports Data Integration                 | 3/3            | Planned     | -          |
| 17. Feed Types & Brands Management           | 3/3            | Complete    | 2026-04-20 |
| 18. Supplier Management                      | 2/2            | Planned     | -          |
| 19. Vitamins/Medicines Management            | 2/2            | Ready to execute | -          |
| 20. Sidebar Reorganization                   | 0/1            | Not started | -          |

---

_v1.2 Started: 2026-04-20_
