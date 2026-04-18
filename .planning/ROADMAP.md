# ROADMAP.md — Sakha Farm Management System

## Milestones

- **v1.0**: Core Farm Management — [Archived](./milestones/v1.0-ROADMAP.md)
- **v1.1**: UI/UX Improvement — [Active]

---

## v1.1 - UI/UX Improvement

### Phase 1: Sidebar Layout Fixes
**Goal**: Fix sidebar divider alignment, collapse button position, logo size.
- Fix divider alignment with Navbar
- Move collapse button to bottom of sidebar
- Logo left-aligned (center when collapsed)
- Change plural menu names to singular (Units → Unit, Plasmas → Plasma)
- Remove duplicate Users menu (in RBAC)
**Status**: Done
**Plans**: [1-PLAN.md](./phases/01-sidebar-layout/1-PLAN.md)

### Phase 2: DataGrid Improvements
**Goal**: Fix DataGrid resizing issues across all modules.
- Fixed dimensions (disable resize)
- Consistent styling across all pages
**Status**: Pending
**Plans**: [2-PLAN.md](./phases/02-datagrid-improvements/2-PLAN.md)

### Phase 3: Menu & Naming Cleanup
**Goal**: Clean up sidebar menu names and structure.
- Singular menu names
- Clear menu hierarchy
**Status**: Done
**Plans**: [3-PLAN.md](./phases/03-menu-cleanup/3-PLAN.md)

### Phase 4: Feature Additions
**Goal**: Add missing UI features.
- Toggle for active/deactivate
- Edit data functionality
- Dropdown relations
**Status**: Done ✅
**Plans**: (completed)
- [04-01-PLAN.md](./phases/04-feature-additions/04-01-PLAN.md) — Units (toggle + edit)
- [04-02-PLAN.md](./phases/04-feature-additions/04-02-PLAN.md) — Plasmas (toggle + edit + dropdown)
- [04-03-PLAN.md](./phases/04-feature-additions/04-03-PLAN.md) — Cycles (toggle + edit)
- [04-04-PLAN.md](./phases/04-feature-additions/04-04-PLAN.md) — Users (edit button)
- [04-05-PLAN.md](./phases/04-feature-additions/04-05-PLAN.md) — RBAC (verify toggle/edit)

### Phase 5: Data Integration
**Goal**: Connect UI to real backend API.
- Remove dummy data
- Connect CRUD to API
**Status**: ⚠️ Partial (2/3 complete — audit API blocker)

**Plans**:
- ✅ [05-01-PLAN.md](./phases/05-data-integration/05-01-PLAN.md) — RbacManager API (roles + users)
- ✅ [05-02-PLAN.md](./phases/05-data-integration/05-02-PLAN.md) — DailyRecording API (active cycles)
- ⚠️ [05-03-PLAN.md](./phases/05-data-integration/05-03-PLAN.md) — AuditLog API (blocked: `/api/audit` endpoint missing — requires backend audit module)

### Phase 6: Code Cleanup
**Goal**: Professional code quality.
- Clean up messy code
- Add documentation where needed
- Use MUI only for statistics
- Modern frontend approach
**Status**: Ready

**Plans**:
- [06-01-PLAN.md](./phases/06-code-cleanup/06-01-PLAN.md) — ESLint infrastructure
- [06-02-PLAN.md](./phases/06-code-cleanup/06-02-PLAN.md) — API JSDoc documentation
- [06-03-PLAN.md](./phases/06-code-cleanup/06-03-PLAN.md) — Component refactoring

### Phase 7: Audit Filter UI
**Goal**: Add filtering capabilities to audit log page.
- Implement filter controls for date ranges, user actions, and entity types
- Add search functionality for audit entries
- Improve audit log usability with filtering options

**Status**: Pending

**Plans**:
- [07-01-PLAN.md](./phases/07-audit-filter-ui/07-01-PLAN.md) — Audit filter UI implementation

### Phase 8: Modern Responsive Table UI
**Goal**: Replace MUI DataGrid with modern, responsive table that works well on mobile devices.
- Replace MUI DataGrid with modern table library (TanStack Table v8)
- Implement mobile-responsive design with touch-friendly controls
- Ensure excellent UI/UX on all screen sizes (desktop, tablet, mobile)
- Preserve all existing table functionality (sort, filter, pagination)

**Status**: Pending

**Plans**:
- [08-01-PLAN.md](./phases/08-responsive-table-ui/08-01-PLAN.md) — Responsive table implementation

### Phase 9: Frontend Fixes
**Goal**: Fix multiple frontend issues.
- Fix toggle on/off in action columns across all pages
- Add delete icon for pages that require it
- Create Reports menu with appropriate submenus
- Fix RBAC roles data not showing (superadmin issue)

**Status**: Pending

**Plans**:
- [09-01-PLAN.md](./phases/09-frontend-fixes/09-01-PLAN.md) — Frontend fixes

---
_Started: 2026-04-18_
_Next: `/gsd-execute-phase 6` to execute Phase 6_