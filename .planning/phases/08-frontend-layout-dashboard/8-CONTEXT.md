---
phase: 08-frontend-layout-dashboard
plan: 01
tags: [frontend, react, layout, dashboard, ui]
key_files:
  existing:
    - client/src/App.tsx (empty routing)
    - client/src/theme/index.ts (MUI theme exists)
    - server/src/modules/reporting/ (API ready for KPIs)
  to_create:
    - client/src/components/layout/Layout.tsx
    - client/src/components/layout/Sidebar.tsx
    - client/src/components/layout/Navbar.tsx
    - client/src/components/layout/Footer.tsx
    - client/src/pages/Login.tsx
    - client/src/pages/Dashboard.tsx
    - client/src/hooks/useAuth.ts
    - client/src/contexts/AuthContext.tsx
technologies: [React 18, Vite, React Router v6, TanStack Query, MUI v5]
metrics:
  duration: ~15min
  files: 8
  tasks: 4
date: "2026-04-17"
---

# Phase 08: Frontend — Layout & Dashboard

## Context

### From ROADMAP.md

**Depends on**: Phase 7 (Inventory Resume & Reporting) ✅

**Deliverables:**
- Vite + React 18 setup with React Router + TanStack Query
- MUI theme: custom minimalist design (neutral palette, green accent, subtle shadows)
- Layout components (separated):
  - `Sidebar.tsx` — Collapsible navigation, role-aware menu items, active state highlighting
  - `Navbar.tsx` — Top bar with breadcrumbs, user dropdown, tenant switcher, notification bell
  - `Footer.tsx` — App version, copyright, system status indicator
  - `Layout.tsx` — Composes all three + content outlet with responsive breakpoints
- Login page with clean minimalist form
- Dashboard: KPI cards (active cycles, avg FCR, avg IP, low stock alerts)
- Unit list → Plasma list → Cycle detail navigation
- Protected route wrapper with auth check

### From PROJECT.md (Locked Decisions)

- **UI/UX Design**: Modern minimalist — clean whitespace, subtle shadows, consistent spacing
- **Layout**: Sidebar + Navbar + Footer as independent components (separated)
- **Color Palette**: Neutral base (slate/gray) with green accent (farm theme)
- **Typography**: Inter or system font stack, clear hierarchy
- **Components**: MUI with custom theme override for minimalist aesthetic
- **Responsive**: Desktop-first, tablet-friendly, mobile-adaptive
- **Component Separation**:
  - `Sidebar.tsx` — Navigation menu, collapsible, role-aware items
  - `Navbar.tsx` — User menu, notifications, tenant switcher, breadcrumbs
  - `Footer.tsx` — App version, copyright, system status
  - `Layout.tsx` — Composes Sidebar + Navbar + Footer + content outlet

### From Prior Phases

- Backend APIs are implemented:
  - Auth: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
  - Reporting: `/api/reporting/performance`, `/api/reporting/stock-resume`
  - Units, Plasmas, Cycles, Recordings CRUD endpoints ready
  - RBAC permissions system ready
- Session: Redis-backed, cookie-based (httpOnly, Secure, SameSite=Strict)

---

## Gray Areas

### 1. Authentication Flow
**Decision needed:** How to handle login state and redirects?

Options:
- A) Store auth token in localStorage + context (simplest)
- B) Use TanStack Query + React Context for auth state
- C) Rely on session cookie entirely (no token storage needed)

**Recommendation:** Use TanStack Query + React Context for auth state. TanStack Query handles token refresh automatically.

### 2. Dashboard KPI Data
**Decision needed:** What metrics to show and from which endpoints?

- Active cycles count → GET `/api/cycles?status=active`
- Average FCR → GET `/api/reporting/performance` + calculate
- Average IP → Calculate from cycle data
- Low stock alerts → GET `/api/feed/stock?low=true`

**Decision:** Dashboard shows 4 KPI cards from existing APIs. No new backend needed.

### 3. Role-Based Menu Items
**Decision needed:** What menu items per role?

| Role | Menu Items |
|------|-----------|
| Super Admin | Dashboard, Units, Plasmas, Cycles, Recordings, Feed, Reports, RBAC, Users |
| Admin Unit | Dashboard, Units, My Plasmas, Cycles, Recordings, Feed |
| Admin Plasma | Dashboard, My Cycles, My Recordings |
| Viewer | Dashboard, Reports only |

**Decision:** Menu items driven by permissions from `/api/rbac/permissions` endpoint.

### 4. Protected Routes
**Decision needed:** How to guard routes?

- Use `RequireAuth` wrapper component
- Redirect to `/login` with `returnUrl` query param
- Check auth state from context

**Decision:** Create `RequireAuth.tsx` component that wraps protected routes.

### 5. API Client Setup
**Decision needed:** How to structure API calls?

- Create `client/src/api/` folder with endpoints
- Use TanStack Query hooks (e.g., `useQuery`, `useMutation`)
- Handle auth headers via interceptor pattern

**Decision:** Use TanStack Query v5 with custom hooks per feature.

---

## API Endpoints to Consume

| Feature | Endpoint | Method |
|---------|----------|--------|
| Login | `/api/auth/login` | POST |
| Logout | `/api/auth/logout` | POST |
| Current User | `/api/auth/me` | GET |
| Active Cycles | `/api/cycles?status=active` | GET |
| Performance | `/api/reporting/performance` | GET |
| Stock Alert | `/api/feed/stock?low=true` | GET |
| Permissions | `/api/rbac/permissions` | GET |

---

## Patterns to Follow

- **Layout**: Follow PROJECT.md's layout structure (Navbar top, Sidebar left, Footer bottom)
- **Theme**: Extend existing `client/src/theme/index.ts` with custom palette
- **Routing**: Use React Router v6 with `createBrowserRouter` or `<Routes>` in App
- **Auth**: TanStack Query + React Context pattern
- **State**: Server state via TanStack Query, UI state via useState

---

## Next Steps

1. Run `/gsd-plan-phase 8` to create detailed execution plan
2. Planner uses this CONTEXT.md to know all decisions are locked
3. Implement Layout components first, then Login, then Dashboard