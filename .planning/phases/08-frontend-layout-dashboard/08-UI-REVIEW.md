# 08-UI-REVIEW.md — SakhaFarm Frontend Phase 8

**Date**: 2026-04-17  
**Reviewer**: Code audit (automated)  
**Scope**: Phase 8 — Frontend Layout & Dashboard  
**Files**: 25 TypeScript/TSX files in `client/src/`

---

## Pillar Grades

| Pillar | Grade | Summary |
|-------|-------|---------|
| **Visual Consistency** | 🟢 4/4 | Excellent MUI theme, consistent palette, spacing, and typography |
| **Interaction Design** | 🟡 3/4 | Good layout transitions, but missing loading skeletons and optimistic updates |
| **Accessibility** | 🟡 2/4 | Minimal ARIA attributes, no focus management, no screen reader testing |
| **Performance** | 🟢 3/4 | Good TanStack Query caching, but no lazy loading or code splitting |
| **Code Quality** | 🟢 3/4 | Clean types, good separation, but some hardcoded values and missing error boundaries |
| **Error Handling** | 🟡 2/4 | Login has error handling, but no ErrorBoundary component, no toast notifications |

---

## Pillar 1: Visual Consistency (4/4) ✅

**Strengths:**
- Centralized MUI theme with green accent (#2E7D32) matching farm domain
- Consistent palette: `primary.main/light/dark`, `secondary`, `error`, `warning`, `success`
- Layout constants (`DRAWER_WIDTH`, `APPBAR_HEIGHT`, `FOOTER_HEIGHT`) properly shared from theme file
- Consistent card styling: subtle shadows, rounded corners (borderRadius: 8)
- Table styling: uppercase headers, slate background, hover states
- Button styling: `textTransform: 'none'` preventing ALL CAPS
- Properly separated Layout → Sidebar + Navbar + Footer components following project architecture

**Issues:**
- None significant. Theme is well-structured and consistently applied.

---

## Pillar 2: Interaction Design (3/4)

**Strengths:**
- Sidebar collapses/expands with smooth transitions and localStorage persistence
- Mobile-responsive: temporary drawer on xs, permanent on md+
- Tablet auto-collapse (`isTablet` forces collapsed state)
- Active menu item has green highlight with left border indicator
- Breadcrumbs in Navbar provide navigation context
- Dashboard KPI cards show "—" during loading

**Issues:**
- **[MEDIUM] No loading skeletons**: KPI cards show `—` text instead of MUI `<Skeleton>` components during loading. This creates layout shift and feels jarring.
- **[MEDIUM] No error state in Dashboard**: If `useKpiData` returns an error, there's no visual feedback — the user sees `—` forever.
- **[LOW] "Remember me" checkbox is always disabled**: `Login.tsx:112` uses `<Checkbox disabled />` — non-functional, should be removed or implemented.
- **[LOW] Notification badge always 0**: `Navbar.tsx:103` hardcodes `badgeContent={0}` — should be dynamic or hidden.
- **[LOW] Profile/Settings menu items are disabled**: `Navbar.tsx:121-125` — disabled menu items are frustrating; either implement or remove.

**Recommendations:**
1. Replace `loading ? "—" : value` in KpiCard with `<Skeleton>` animation
2. Add error state to Dashboard: show `<Alert severity="error">` when queries fail
3. Remove or implement the "Remember me" checkbox
4. Import `Badge` with `badgeContent={0}` → conditionally hide when 0: `<Badge badgeContent={count} invisible={count === 0}>`

---

## Pillar 3: Accessibility (2/4) ⚠️

**Strengths:**
- Login form uses proper `<form>` with `onSubmit` and `<label>` via MUI TextField
- Breadcrumbs use semantic `<Link>` components
- MUI components have built-in keyboard navigation
- Semantic `<footer>`, `<main>` (`component="main"`), `<nav>` (Drawer) elements

**Issues:**
- **[HIGH] No ARIA labels on sidebar navigation items**: `Sidebar.tsx:82-114` — `<ListItemButton>` has no `aria-label`. When collapsed, only `<Tooltip>` provides context, which is mouse-only.
- **[HIGH] No skip-to-content link**: No way for keyboard users to skip past the sidebar to main content.
- **[MEDIUM] No focus trap in mobile drawer**: When the temporary drawer opens on mobile, focus doesn't trap inside it, and Tab key can escape to the background.
- **[MEDIUM] Login form has no `aria-live` region**: Error messages appear but aren't announced to screen readers.
- **[MEDIUM] No heading hierarchy**: Dashboard page has `<h4>` but no `<h1>` — screen readers can't navigate by headings.
- **[LOW] Color-only active state**: Active sidebar item uses green background (#2E7D32) as the only differentiator — not distinguishable for colorblind users without additional indicators.

**Recommendations:**
1. Add `aria-label` to all `<ListItemButton>` in Sidebar: `aria-label={item.text}`
2. Add skip-to-content link: `<a href="#main-content" className="skip-link">Skip to main</a>` with CSS focus style
3. Add `role="navigation" aria-label="Main navigation"` to sidebar drawer
4. Add `aria-live="polite"` to login error alert container
5. Add `<h1>` heading (`visuallyHidden` or `sr-only`) to Dashboard page
6. Add non-color indicator for active nav item (use border-left weight or icon change)

---

## Pillar 4: Performance (3/4)

**Strengths:**
- TanStack Query with `staleTime: 5 minutes` for auth and KPI data
- TanStack Query with `staleTime: 2 minutes` for feed stock (more volatile)
- `credentials: 'include'` properly set on API client for cookie auth
- CSRF token read from cookie and sent as header on mutations
- `retry: false` on auth query — no infinite retry loops on 401
- Sidebar collapsed state persisted in localStorage

**Issues:**
- **[HIGH] No code splitting or lazy loading**: All routes load in a single bundle. `App.tsx` imports everything eagerly — Dashboard, Login, NotFound all loaded upfront. Phase 9 pages will make this worse.
- **[MEDIUM] No React.lazy for route components**: Should use `React.lazy(() => import('./pages/Dashboard'))` for all route-level components.
- **[LOW] No `Suspense` boundary**: No loading UI during route transitions since everything is eagerly loaded.
- **[LOW] Auth callback has empty dependency array issue**: `AuthContext.tsx:63-68` — `login` and `logout` callbacks depend on mutation objects but `useCallback` has stale closures.

**Recommendations:**
1. Wrap each `<Route>` in `React.lazy()` + `<Suspense>`:
   ```tsx
   const DashboardPage = React.lazy(() => import('./pages/Dashboard'))
   ```
2. Add `<Suspense fallback={<CircularProgress />}>` around `<Outlet />` in Layout
3. Consider `queryClient.prefetchQuery` for KPI data when user hovers sidebar items

---

## Pillar 5: Code Quality (3/4)

**Strengths:**
- Clean TypeScript types in `types/index.ts` mirroring API shapes
- JSDoc on all exported API functions
- Proper custom hooks pattern: `useAuth`, `useKpiData`, `useActiveCycles`
- MUI imports are granular (not `@mui/material`)
- `ApiError` class for typed error handling
- `{ throwOnError: false }` on auth query prevents unhandled promise rejections

**Issues:**
- **[MEDIUM] Hardcoded magic values**: KpiCard colors `#2E7D32`, `#1976D2`, `#ED6C02` should reference theme palette
- **[MEDIUM] `useKpiData` returns raw calculation results inline**: The IIFEs for `avgFcr` and `avgIp` are hard to read. Should extract to utility functions.
- **[LOW] No ESLint/Prettier config visible**: No `.eslintrc` or `.prettierrc` in the project
- **[LOW] `ApiContext` vs prop drilling**: `userPermissions` is passed as prop from Layout → Sidebar. Could use context instead.
- **[LOW] `useCallback` dependencies suspicious**: `AuthContext.tsx:63-68` — `loginMutation` and `logoutMutation` are stable references but listed as dependencies, which generates unnecessary re-renders.

**Recommendations:**
1. Replace hardcoded colors in `Dashboard.tsx` with `theme.palette.primary.main`, etc.
2. Extract avgFcr/avgIp calculations into `lib/calculations.ts`
3. Consider using `useMemo` for KPI calculations rather than IIFEs

---

## Pillar 6: Error Handling (2/4) ⚠️

**Strengths:**
- Login form properly catches and displays `ApiError` messages
- `RequireAuth` component redirects unauthenticated users to login with return URL
- Open redirect protection via `sanitizeReturnUrl()` — excellent security practice
- API client handles 401/403 globally before parsing response body
- TanStack Query `retry: false` on auth endpoints prevents loops

**Issues:**
- **[CRITICAL] No React Error Boundary**: If any component throws during render, the entire app crashes with a white screen. No fallback UI.
- **[HIGH] No toast/notification system**: API errors on CRUD operations (Phase 9) have no user-facing notification mechanism.
- **[HIGH] Dashboard silently fails on error**: `useKpiData` returns `error` field but `Dashboard.tsx` never renders it — the user sees `—` with no explanation.
- **[MEDIUM] No retry mechanism on failed queries**: TanStack Query defaults to 3 retries, but for the dashboard, failed queries should show a "Retry" button.
- **[LOW] Auth context silently swallows permission errors**: `AuthContext.tsx:39` — `catch(() => { setPermissions([]) })` gives user full access on permission fetch failure AND logs nothing.

**Recommendations:**
1. **Add an ErrorBoundary component** wrapping `<Outlet />` in Layout:
   ```tsx
   <ErrorBoundary fallback={<ErrorFallback />}>
     <Outlet />
   </ErrorBoundary>
   ```
2. **Add toast notifications**: Install `notistack` or use MUI `<Snackbar>` for operation feedback
3. **Handle KPI errors in Dashboard**:
   ```tsx
   {error && <Alert severity="error">Failed to load dashboard data</Alert>}
   ```
4. **Log permission errors** and consider redirecting to a "no permissions" page instead of granting empty permissions

---

## Summary

| Pillar | Grade | Key Gaps |
|-------|-------|----------|
| Visual Consistency | 🟢 4/4 | — |
| Interaction Design | 🟡 3/4 | No skeletons, no error state in Dashboard |
| Accessibility | 🟡 2/4 | No ARIA labels, no skip link, no heading hierarchy |
| Performance | 🟢 3/4 | No code splitting, no lazy loading |
| Code Quality | 🟢 3/4 | Hardcoded colors, IIFE calculations |
| Error Handling | 🟡 2/4 | No ErrorBoundary, no toast system, silent failures |

**Overall**: 🟡 **2.8/4** — Solid foundation with room for improvement in accessibility and error handling.

### Priority Fixes for Phase 9
1. 🔴 Add `<ErrorBoundary>` component (critical — prevents white screen of death)
2. 🔴 Add ARIA labels to sidebar navigation items
3. 🟡 Add `<Skeleton>` loading states to Dashboard/KpiCard
4. 🟡 Add toast notification system (notistack) for CRUD feedback
5. 🟡 Lazy-load route components with `React.lazy()`
6. 🟢 Handle KPI error state in Dashboard with `<Alert>`