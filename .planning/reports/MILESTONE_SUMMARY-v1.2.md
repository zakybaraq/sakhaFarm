# Milestone v1.2 — Project Summary

**Generated:** 2026-04-21  
**Purpose:** Team onboarding and project review  
**Milestone:** v1.2 — Bug Fixes & Data Integration  
**Status:** Complete (8/8 phases)

---

## 1. Project Overview

**Sakha Farm Management System** is a multi-tenant poultry farm management application for the Indonesian plasma-inti (contract farming) model. It tracks flock cycles, daily recordings (mortality, body weight, feed consumption), feed inventory, and supplier relationships across one or more tenant farms.

v1.2 had a single, focused goal: **zero dummy data, zero 500 errors, correct business logic throughout.** It also expanded the data model with four new master-data domains — Feed Types & Brands, Suppliers, and Vitamins/Medicines — and reorganized the sidebar navigation.

**Target users:** Farm managers and admin staff managing broiler production cycles under the plasma-inti contract model.

**Tech stack:** Bun runtime · Elysia.js backend · Drizzle ORM · MySQL · Redis (sessions, rate limiting) · React 18 + Vite + MUI + TanStack Query

---

## 2. Architecture & Technical Decisions

- **Feature-based module structure (all milestones)**
  - Why: Keeps controller/service/schema co-located per domain; prevents cross-module coupling.

- **isActive (int 0/1) separate from deletedAt (soft delete) — Phase 13**
  - Why: Toggle = set `isActive=0`, record stays visible as inactive. Hard delete = set `deletedAt`. Originally conflated; Phase 13 fixed the backend to treat them as distinct concerns.

- **PATCH-free toggle: reuse PUT /:id endpoint — Phase 13**
  - Why: Avoids route proliferation; `isActive` is just another updatable field.

- **Client-side Excel export via exportToXlsx() — Phase 16**
  - Why: No server-side export endpoint needed; the already-loaded `rows` array is sufficient for the volumes involved.

- **tenantId sourced from useAuth().user.tenantId — Phase 16**
  - Why: Performance.tsx and StockResume.tsx were hardcoding `tenantId=1`. Fixed to use auth context; fallback `?? 1` only while user is loading.

- **Unified vitamins_medicines table with category enum — Phase 19**
  - Why: Vitamins and medicines share the same CRUD pattern and UX; separate tables would double the code with no model benefit.

- **FIFO/FEFO batch deduction for pharmaceutical stock — Phase 19**
  - Why: Compliance with expiry-based dispensing practices; oldest batches consumed first, expired batches rejected.

- **Collapsible sidebar sections with hybrid default state — Phase 20**
  - Why: Master Data and Operations expanded by default (daily use); Reports and Settings collapsed (less frequent). Each section independently togglable.

- **Supplier category enum (feed/vitamin/medicine/other) — Phase 18**
  - Why: Enables context-aware filtering (e.g., only feed suppliers appear in Surat Jalan modal; only vitamin/medicine suppliers appear in pharmaceutical item form).

- **feed_products schema migration: phase varchar → typeId + brandId FKs — Phase 17**
  - Why: Normalizes feed product classification from a free-text string into relational master data; enables dropdown-driven selection.

---

## 3. Phases Delivered

| Phase | Name | Status | One-Liner |
|-------|------|--------|-----------|
| 13 | Backend Toggle Fix | ✅ Complete | Fixed 500 errors on Units/Plasmas toggle by adding isActive to PUT schemas |
| 14 | Cycle & Plasma UI Fixes | ✅ Complete | Cycle status read-only badge; phone column + numeric validation on Plasmas |
| 15 | Recordings, Feed & RBAC Data Integration | ✅ Complete | Wired Recordings cycle dropdown, Feed product dropdown, and all RBAC tabs to real DB data |
| 16 | Reports Data Integration | ✅ Complete | Connected Performance (FCR/IP charts), Stock Resume (date filters + real filters), and Audit report to real APIs |
| 17 | Feed Types & Brands Management | ✅ Complete | New feed_types/feed_brands tables + full CRUD pages + Feed Products page with type/brand selectors |
| 18 | Supplier Management | ✅ Complete | New suppliers table + CRUD page + Surat Jalan supplier autocomplete (7/7 UAT tests pass) |
| 19 | Vitamins/Medicines Management | ✅ Complete | New pharmaceuticals module with batch/stock tracking + CRUD page + daily recording integration (9/9 UAT tests pass) |
| 20 | Sidebar Reorganization | ✅ Complete | 4 collapsible grouped sections (Master Data / Operations / Reports / Settings) (10/10 UAT tests pass) |

---

## 4. Requirements Coverage

### Original v1.2 Requirements (Bug Fixes & Data Integration)

| REQ-ID | Requirement | Phase | Status |
|--------|-------------|-------|--------|
| TOGGLE-01 | Units toggle works without 500 error | 13 | ✅ Met |
| TOGGLE-02 | Plasmas toggle works without 500 error | 13 | ✅ Met |
| TOGGLE-03 | Cycle status as read-only badge | 14 | ✅ Met |
| TOGGLE-04 | Cycle edit/delete rules enforced | 14 | ✅ Met |
| PLASMA-01 | Phone column visible in Plasmas table | 14 | ✅ Met |
| PLASMA-02 | Phone input accepts numeric only | 14 | ✅ Met |
| REC-01 | Recordings cycle dropdown from DB | 15 | ✅ Met |
| REC-02 | Deviasi BW blank when no data | 15 | ✅ Met |
| FEED-01 | Feed type dropdown from DB | 15 | ✅ Met |
| FEED-02 | Supplier dropdown from DB | 15 | ✅ Met |
| REPORT-01 | Performance report with real FCR/IP | 16 | ✅ Met |
| REPORT-02 | Stock Resume filters from DB | 16 | ✅ Met |
| REPORT-03 | Audit report displays real entries | 16 | ✅ Met |
| RBAC-01 | RBAC Roles tab from API | 15 | ✅ Met |
| RBAC-02 | RBAC Permissions tab from API | 15 | ✅ Met |
| RBAC-03 | RBAC Role-Permission tab functional | 15 | ✅ Met |

### Added Scope (Feature Additions)

| REQ-ID | Requirement | Phase | Status |
|--------|-------------|-------|--------|
| FEED-TYPE-01/02 | Feed Types CRUD (backend + frontend) | 17 | ✅ Met |
| FEED-BRAND-01/02 | Feed Brands CRUD (backend + frontend) | 17 | ✅ Met |
| FEED-PRODUCT-01 | Feed Products CRUD with type/brand FKs | 17 | ✅ Met |
| SUPPLIER-01/02 | Supplier management (backend + frontend) | 18 | ✅ Met |
| VITAMIN-01/02 | Vitamins/Medicines management | 19 | ✅ Met |
| UI-01/02 | Sidebar collapsible grouped sections | 20 | ✅ Met |

### Deferred (Explicitly Out of Scope)

- Dark mode toggle
- CSV/Excel server-side export endpoint
- Performance optimization (virtual scrolling)
- Supplier-specific pricing/contracts
- Expiry alert dashboard widget
- Batch-level usage traceability report

---

## 5. Key Decisions Log

| ID | Decision | Phase | Rationale |
|----|----------|-------|-----------|
| D-01 | isActive int(0/1) vs boolean in DB | 13 | Drizzle ORM expects int; boolean mapping in service layer |
| D-02 | Reuse PUT /:id for toggle, no PATCH endpoint | 13 | Fewer routes; isActive is just another updatable field |
| D-03 | tenantId from useAuth().user.tenantId | 16 | Reports were hardcoding tenantId=1; auth context is the single source of truth |
| D-04 | Client-side exportToXlsx | 16 | Stock Resume volumes don't justify a server export endpoint |
| D-05 | IP (Index Performa) as a third LineChart on Performance page | 16 | API already returns ip per record; reuse same MUI LineChart pattern |
| D-06 | feed_products.phase → typeId + brandId FK migration | 17 | Normalize classification; enables dropdown-driven type/brand selection |
| D-07 | Supplier category enum (feed/vitamin/medicine/other) | 18 | Enables context-aware filtering across modules |
| D-08 | Unified vitamins_medicines table with category field | 19 | Vitamins and medicines share identical CRUD; separate tables add no model value |
| D-09 | FIFO batch deduction for pharmaceutical consumption | 19 | Expiry-based dispensing compliance; oldest non-expired batch consumed first |
| D-10 | Sidebar: Master Data + Operations expanded, Reports + Settings collapsed by default | 20 | Matches daily usage frequency; all sections independently togglable |

---

## 6. Tech Debt & Deferred Items

### Known Tech Debt

| Item | Source | Notes |
|------|--------|-------|
| Server-side API integration tests for new modules (17–20) | Phase 17-19 plans | Deferred to next milestone; MSW infrastructure exists from Phase 12 |
| Pharmaceutical inventory management UI (stock balances per plasma) | Phase 19 deferred | Full inventory view deferred; CRUD page + batch tracking only in scope |
| Phase 10 (Testing, Cybersecurity & Docs) still pending from v1.0 | STATE.md | Vitest security tests not yet executed |

### From v1.1 Audit (Carried Forward)

| Item | Status |
|------|--------|
| 3 stale debug sessions (react-key-warnings, tanstack-table-gettableprops, typescript-error-rbac) | Resolved by v1.1 phases; debug sessions are stale |
| 9 UAT status-field false positives from v1.1 phases | Not real gaps; UAT all passed |

### Deferred Feature Ideas

- Supplier-specific pricing and purchase-order linkage
- Expiry alert widget for pharmaceutical stock
- Nutritional attributes on Feed Types/Brands
- Full inventory management page (stock adjustments, per-plasma view)
- Cost tracking (unit cost × qty) for pharmaceutical inventory

---

## 7. Getting Started

**Run the project:**
```bash
# Backend (from repo root)
bun run dev

# Frontend (from client/)
bun run dev
```

**Build:**
```bash
npm run build
```

**Tests:**
```bash
npm test        # full test suite (Vitest)
npm run lint    # ESLint (0 warnings target)
```

**Key directories:**
```
server/src/modules/         — feature modules (controller/service/schema)
server/src/db/schema/       — Drizzle ORM table definitions
client/src/pages/           — React page components
client/src/api/             — TanStack Query API clients
client/src/components/      — shared UI components
.planning/phases/           — GSD phase plans, context, UAT, summaries
```

**Where to look first for each domain:**
| Domain | Backend | Frontend |
|--------|---------|----------|
| Auth/RBAC | `server/src/modules/auth/` + `rbac/` | `client/src/contexts/AuthContext.tsx` |
| Units/Plasmas | `server/src/modules/unit/` + `plasma/` | `client/src/pages/units/` + `plasmas/` |
| Feed Types/Brands | `server/src/modules/feed-types/` + `feed-brands/` | `client/src/pages/feed/FeedTypes.tsx` etc. |
| Suppliers | `server/src/modules/suppliers/` | `client/src/pages/suppliers/` |
| Pharmaceuticals | `server/src/modules/pharmaceuticals/` | `client/src/pages/pharmaceuticals/` |
| Reports | `server/src/modules/reporting/` | `client/src/pages/reports/` |
| Sidebar | — | `client/src/components/layout/Sidebar.tsx` |

**New contributor onboarding path:**
1. Read `STATE.md` — current milestone state and key decisions
2. Read `.planning/REQUIREMENTS.md` — what v1.2 was supposed to fix
3. Pick a domain module and read its `CONTEXT.md` in `.planning/phases/`
4. Run `bun run dev` (backend) + `bun run dev` (frontend) and log in

---

## Stats

- **Timeline:** 2026-04-20 → 2026-04-21 (2 days)
- **Phases:** 8/8 complete
- **Commits:** 51 (since 2026-04-20)
- **Contributors:** Muhammad Zaki
- **UAT results:** Phase 17 (6/6) · Phase 18 (7/7) · Phase 19 (9/9) · Phase 20 (10/10)
- **All v1.2 requirements:** 16/16 original + 6/6 added scope = 22/22 ✅

---

_Generated by /gsd-milestone-summary — 2026-04-21_
