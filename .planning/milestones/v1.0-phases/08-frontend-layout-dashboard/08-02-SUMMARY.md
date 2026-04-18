# 08-02 Summary: Layout & Dashboard — Wave 2 Complete

**Phase:** 08-frontend-layout-dashboard
**Plan:** 08-02
**Date:** 2026-04-17
**Status:** ✅ Complete

---

## Files Modified

| File | Action | Description |
|------|--------|-------------|
| `client/src/theme/index.ts` | Extended | Added MuiDrawer, MuiTableHead, MuiTableCell, MuiTableRow overrides; typography h1/h3/body1/body2 sizes; exported layout constants |
| `client/src/components/layout/Layout.tsx` | Created | Main layout composing Sidebar + Navbar + Footer + Outlet with responsive sidebar state |
| `client/src/components/layout/Sidebar.tsx` | Created | Collapsible navigation drawer with permission-filtered menu items, MUI v7 drawerClasses pattern |
| `client/src/components/layout/Navbar.tsx` | Created | Top app bar with breadcrumbs, notification bell, user menu with logout |
| `client/src/components/layout/Footer.tsx` | Created | Bottom bar with copyright, version, online status indicator |
| `client/src/pages/Login.tsx` | Created | Login form page with email/password, ApiError handling, returnUrl redirect |
| `client/src/pages/NotFound.tsx` | Created | 404 page with link back to dashboard |
| `client/src/pages/Dashboard.tsx` | Created | Minimal placeholder for Phase 9 replacement |
| `client/src/App.tsx` | Replaced | Route definitions with RequireAuth wrapper, all Phase 9 placeholder routes |

## Verification Results

| Check | Result |
|-------|--------|
| `cd client && bun run build` | ✅ Exits 0 |
| Theme has MuiDrawer override | ✅ 2 occurrences |
| Sidebar uses drawerClasses (MUI v7) | ✅ 3 occurrences |
| Login page imports useAuth | ✅ 2 occurrences |
| App.tsx has RequireAuth wrapper | ✅ 2 occurrences |
| All routes defined | ✅ /login, /, /units, /plasmas, /cycles, /recordings, /feed, /reports, /rbac, /users, * |
| LSP diagnostics | ✅ 0 errors |

## Key Decisions

- **MUI v7 Drawer pattern**: Used `drawerClasses` import from `@mui/material/Drawer` instead of v5 `.MuiDrawer-paperAnchorLeft` CSS class pattern
- **Responsive breakpoints**: xs/sm = temporary drawer (mobile), md = permanent collapsed (72px), lg+ = permanent expanded (240px)
- **Sidebar collapse state**: Persisted to `localStorage` key `sakha_sidebar_collapsed`
- **Tenant switcher**: DEFERRED per CONTEXT.md — not included in Navbar
- **Layout constants**: Exported from `theme/index.ts` (DRAWER_WIDTH=240, DRAWER_WIDTH_COLLAPSED=72, APPBAR_HEIGHT=64, FOOTER_HEIGHT=40)
- **Login redirect**: Uses `returnUrl` query param from RequireAuth, falls back to `/`
- **Phase 9 placeholders**: Inline `<div>` elements for routes not yet implemented

## Threat Mitigations Applied

- T-08-06: Login form uses generic error messages, no client-side password storage
- T-08-07: RequireAuth is UI-only; backend enforces RBAC
- T-08-08: Breadcrumbs show route segments only, no sensitive data
- T-08-09: Sidebar menu items filtered by user permissions from /auth/permissions
- T-08-10: Logout is idempotent via AuthContext