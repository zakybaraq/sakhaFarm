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
**Status**: Pending

---

_Started: 2026-04-18_
_Next: `/gsd-execute-phase 2` to execute Phase 2_