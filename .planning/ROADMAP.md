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
- [ ] **Phase 15: Recordings, Feed & RBAC Data Integration** — Wire Recordings dropdowns, Feed dropdowns, and all RBAC tabs to real DB data
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
**Plans**: TBD
**UI hint**: yes

### Phase 16: Reports Data Integration
**Goal**: All three report pages display real data from the database with no dummy placeholders
**Depends on**: Phase 15
**Requirements**: REPORT-01, REPORT-02, REPORT-03
**Success Criteria** (what must be TRUE):
  1. The Performance report calculates and displays FCR and IP values derived from actual recording entries — no hardcoded or placeholder numbers appear
  2. The Stock Resume page's unit and plasma filter dropdowns are populated from DB; selecting a filter updates the displayed stock data
  3. The Audit report page displays real audit log entries (user, action, timestamp, entity) retrieved from the backend — the table is not empty on a system with activity
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 13. Backend Toggle Fix | 0/1 | Not started | - |
| 14. Cycle & Plasma UI Fixes | 1/1 | Not started | - |
| 15. Recordings, Feed & RBAC Data Integration | 2/2 | Planned | - |
| 16. Reports Data Integration | 0/1 | Not started | - |

---
_v1.2 Started: 2026-04-20_
