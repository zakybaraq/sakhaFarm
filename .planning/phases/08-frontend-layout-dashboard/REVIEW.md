# Phase 8 Code Review — Frontend Layout & Dashboard

**Reviewer**: Automated Code Review  
**Date**: 2026-04-17  
**Files Reviewed**: 24 files (client + server auth controller)

---

## Summary

**Found 28 issues: 3 CRITICAL, 7 HIGH, 10 MEDIUM, 8 LOW**

---

## CRITICAL (3)

### C-01: Open Redirect Vulnerability in Login Page
**File**: `client/src/pages/Login.tsx` (lines 27-28, 39-40)  
**Category**: Security

The `returnUrl` query parameter is used directly in `navigate()` without any validation or sanitization. An attacker can craft a URL like `/login?returnUrl=https://evil.com` to redirect users to a malicious site after login.

```tsx
// VULNERABLE — no validation of returnUrl
const returnUrl = searchParams.get('returnUrl') || '/'
navigate(returnUrl, { replace: true })
```

**Fix**: Validate that `returnUrl` is a relative path starting with `/` and does not contain `//` or protocol prefixes:
```tsx
function sanitizeReturnUrl(url: string): string {
  if (url.startsWith('/') && !url.startsWith('//')) return url
  return '/'
}
const returnUrl = sanitizeReturnUrl(searchParams.get('returnUrl') || '/')
```

---

### C-02: Unauthenticated /register Endpoint Without Rate Limiting
**File**: `server/src/modules/auth/auth.controller.ts` (lines 44-63, 64)  
**Category**: Security

The `/register` endpoint allows creating users without authentication and is defined **before** the `loginRateLimit` middleware (line 64). This means:
1. Anyone can create user accounts without auth
2. The endpoint has no rate limiting, allowing mass account creation bots

```ts
.post('/register', async ({ body, cookie }) => { ... })  // NO AUTH, NO RATE LIMIT
.use(loginRateLimit)  // Rate limiting only applies to routes AFTER this line
.post('/login', ...)
```

**Fix**: Either add authentication requirement to `/register` (admin-only), or move the rate limit middleware before `/register`, or add a separate rate limit for registration.

---

### C-03: Server Returns HTTP 200 for Auth Failures
**File**: `server/src/modules/auth/auth.controller.ts` (lines 94-116)  
**Category**: Security

The `/me` and `/permissions` endpoints return HTTP 200 with `{ error: 'Not authenticated' }` instead of proper 401/403 status codes. This is a security anti-pattern because:
1. Browsers and CDNs may cache 200 responses
2. Security scanners won't detect auth failures
3. Middleware/proxies can't intercept auth failures by status code
4. The client must parse response bodies to detect auth failures

```ts
.get('/me', async ({ cookie }) => {
  if (!sessionId) {
    return { error: 'Not authenticated' }  // Should be 401!
  }
})
```

**Fix**: Return proper HTTP status codes (401 for unauthenticated, 403 for forbidden) and update the client to handle them via the existing 401 redirect logic.

---

## HIGH (7)

### H-01: React Render-Side Effect in Login Page
**File**: `client/src/pages/Login.tsx` (lines 26-29)  
**Category**: Bug / React Rules

`navigate()` is called during render (before `return null`). This violates React's rules — side effects must not occur during rendering. It can cause issues with React StrictMode and concurrent features.

```tsx
// BUG: side effect during render
if (isAuthenticated) {
  const returnUrl = searchParams.get('returnUrl') || '/'
  navigate(returnUrl, { replace: true })  // ← called during render
  return null
}
```

**Fix**: Use `useEffect` for the redirect:
```tsx
useEffect(() => {
  if (isAuthenticated) {
    const returnUrl = sanitizeReturnUrl(searchParams.get('returnUrl') || '/')
    navigate(returnUrl, { replace: true })
  }
}, [isAuthenticated])
if (isAuthenticated) return null  // still return null to prevent flash
```

---

### H-02: Rate Limiting Middleware Placement Skips /register
**File**: `server/src/modules/auth/auth.controller.ts` (line 64)  
**Category**: Security

The `loginRateLimit` middleware is applied via `.use()` **after** the `/register` route definition. In Elysia's middleware chain, `.use()` only applies to routes defined **after** it. This means `/register` is completely unprotected from brute force.

**Fix**: Move `.use(loginRateLimit)` before the `/register` route, or add a separate rate limit for registration.

---

### H-03: No CSRF Token in API Client
**File**: `client/src/api/client.ts`  
**Category**: Security

PROJECT.md specifies "Double-submit cookie pattern for state-changing requests" but the API client sends no CSRF token. All POST/PUT/DELETE requests use `credentials: 'include'` but without CSRF protection, the app is vulnerable to cross-site request forgery attacks.

**Fix**: Implement double-submit cookie pattern — read a CSRF token from a cookie and send it as a header on all mutating requests.

---

### H-04: Permissions State Desync in AuthContext
**File**: `client/src/contexts/AuthContext.tsx` (lines 32-44)  
**Category**: Bug / Race Condition

Permissions are stored in a separate `useState` rather than in TanStack Query cache. This creates a desync risk:
1. `loginMutation.onSuccess` invalidates `['auth']` queries
2. The `/me` query refetches, updating `user`
3. The `useEffect` fires and fetches permissions
4. But between steps 2 and 3, the component renders with the new user but **old/stale permissions**

This means after login, the sidebar may briefly show/hide wrong menu items.

**Fix**: Move permissions into TanStack Query cache (e.g., `['auth', 'permissions']` query) so they're co-located with user data and invalidated together.

---

### H-05: FCR/IP Average Calculation Includes Null Records
**File**: `client/src/hooks/useKpiData.ts` (lines 44-49)  
**Category**: Bug

The average FCR and IP calculations use `r.fcr ?? 0` and `r.ip ?? 0`, treating null values as 0. This skews averages downward — a record with `ip: null` (no data) is treated as `ip: 0` (terrible performance), dragging the average down.

```ts
const avgFcr = performanceQuery.data.data.reduce((sum, r) => sum + (r.fcr ?? 0), 0) / (length || 1)
```

**Fix**: Filter out null records before averaging:
```ts
const validFcrRecords = performanceQuery.data.data.filter((r) => r.fcr !== null)
const avgFcr = validFcrRecords.length > 0
  ? validFcrRecords.reduce((sum, r) => sum + r.fcr!, 0) / validFcrRecords.length
  : null
```

---

### H-06: Variable Shadowing in /sessions/:id Handler
**File**: `server/src/modules/auth/auth.controller.ts` (line 213)  
**Category**: Bug

The local `sessions` variable (result of `db.select(...)`) shadows the imported `sessions` table from `../../db/schema`. While it works because the shadowed variable is only used locally, it creates confusion and could lead to bugs if someone later references `sessions` expecting the table.

```ts
const sessions = await db.select({ userId: sessions.userId }).from(sessions)...
//     ^^^^^^^^ shadows imported `sessions` table
```

**Fix**: Rename the local variable to `targetSessions` or `existingSessions`.

---

### H-07: /reset-password Has Redundant Auth Check
**File**: `server/src/modules/auth/auth.controller.ts` (lines 170-190)  
**Category**: Code Quality / Security

The `/reset-password` endpoint has both `beforeHandle: requirePermission('users.reset-password')` and a manual session validation block. The `requirePermission` plugin should already validate the session, making the manual check redundant. If the manual check is needed as defense-in-depth, it should be documented.

---

## MEDIUM (10)

### M-01: tenantId=0 Fallback in Hooks
**Files**: `client/src/hooks/useActiveCycles.ts` (line 7), `client/src/hooks/useKpiData.ts` (line 18)  
**Category**: Bug

When `user` is null, `tenantId` falls back to `0`. While the `enabled: !!user` flag should prevent queries, if the flag is somehow bypassed, API calls with `tenantId=0` could leak data from a tenant with ID 0 or cause unexpected behavior.

**Fix**: Use a sentinel value or throw if tenantId is unavailable:
```ts
const tenantId = user?.tenantId
const enabled = !!user && !!tenantId
```

---

### M-02: Empty Catch Block in Layout.tsx
**File**: `client/src/components/layout/Layout.tsx` (line 43)  
**Category**: Code Quality (PROJECT.md violation)

```ts
try {
  localStorage.setItem('sakha_sidebar_collapsed', String(next))
} catch {}  // ← swallowed error
```

PROJECT.md states: "Never swallow errors with empty catch blocks."

**Fix**: At minimum, log the error: `catch { /* localStorage unavailable in private mode */ }`

---

### M-03: Missing JSDoc on Exported Functions/Components
**Files**: Multiple  
**Category**: Code Quality (PROJECT.md violation)

PROJECT.md mandates "JSDoc on every exported function/class". The following exports lack JSDoc:
- `useActiveCycles` hook
- `useKpiData` hook / `KpiData` interface
- `LoginPage` component
- `NotFoundPage` component
- `DashboardPage` component
- `Layout` component
- `Sidebar` component / `SidebarContent` function
- `Navbar` component
- `Footer` component
- `KpiCard` component
- `formatSegment` helper in Navbar.tsx

---

### M-04: Index Signatures Weaken Type Safety
**Files**: `client/src/api/reporting.ts` (line 13), `client/src/api/feed.ts` (line 12)  
**Category**: Code Quality (PROJECT.md violation)

`PerformanceRecord` and `FeedStockItem` have `[key: string]: unknown` index signatures. This allows accessing any property without type checking, violating PROJECT.md's "Proper TypeScript types everywhere" rule.

**Fix**: Remove index signatures and define all needed properties explicitly, or use a generic `Record<string, unknown>` for truly dynamic data.

---

### M-05: Duplicated Query Key for Active Cycles
**Files**: `client/src/hooks/useActiveCycles.ts`, `client/src/hooks/useKpiData.ts`  
**Category**: Code Quality (DRY violation)

Both hooks define the same query with key `['cycles', 'active', tenantId]`. While TanStack Query deduplicates, this violates DRY — if the API function or query key changes, both must be updated.

**Fix**: Extract a shared query factory or have `useKpiData` call `useActiveCycles()` instead of redefining the query.

---

### M-06: Hardcoded Colors Outside Theme
**Files**: `client/src/components/layout/Footer.tsx` (lines 14, 34), `client/src/components/dashboard/KpiCard.tsx` (line 24)  
**Category**: Code Quality

Colors like `#f8fafc`, `#e2e8f0`, `#4CAF50`, `rgba(22,163,74,0.1)` are hardcoded instead of using the MUI theme palette. This makes the theme inconsistent and harder to update.

**Fix**: Use theme tokens: `theme.palette.success.main`, `theme.palette.divider`, etc.

---

### M-07: Badge Shows Zero Count
**File**: `client/src/components/layout/Navbar.tsx` (line 103)  
**Category**: Bug (UX)

```tsx
<Badge badgeContent={0} color="error">
```

MUI Badge with `badgeContent={0}` renders a "0" badge. It should be hidden when there are no notifications.

**Fix**: Use `badgeContent={undefined}` or conditionally render: `badgeContent={count > 0 ? count : undefined}`.

---

### M-08: Hardcoded "Online" Status in Footer
**File**: `client/src/components/layout/Footer.tsx` (lines 28-40)  
**Category**: Bug (UX)

The footer always shows "Online" with a green dot. This is misleading — it doesn't actually check connectivity.

**Fix**: Either implement actual connectivity detection (e.g., via `navigator.onLine` or a health-check ping), or change the label to something like "SakhaFarm v1.0.0" without implying connectivity status.

---

### M-09: Hardcoded App Version
**File**: `client/src/components/layout/Footer.tsx` (line 5)  
**Category**: Code Quality

`const APP_VERSION = 'v1.0.0'` is hardcoded. It should be read from `package.json` or an environment variable to stay in sync with releases.

**Fix**: Use `import { version } from '../../package.json'` or `import.meta.env.VITE_APP_VERSION`.

---

### M-10: No React Error Boundary
**File**: `client/src/App.tsx`  
**Category**: React Best Practice

There's no Error Boundary component. If any child component throws during rendering, the entire app crashes with a white screen.

**Fix**: Add a top-level Error Boundary with a user-friendly fallback UI.

---

## LOW (8)

### L-01: Sidebar Uses navigate() Instead of Link
**File**: `client/src/components/layout/Sidebar.tsx` (line 83)  
**Category**: Accessibility

Using `navigate()` instead of `<Link>` or `<NavLink>` means:
- No right-click → "Open in new tab"
- No keyboard accessibility hints
- No prefetching

**Fix**: Use `useNavigate` only for programmatic navigation; use `<Link>` for user-facing navigation.

---

### L-02: useAuth Re-export Indirection
**File**: `client/src/hooks/useAuth.ts`  
**Category**: Code Quality

The file just re-exports `useAuth` from `AuthContext`. This is fine as a convenience but adds an unnecessary indirection layer. Consumers could import directly from `AuthContext`.

---

### L-03: Password Complexity Not Enforced
**File**: `server/src/modules/auth/auth.controller.ts` (line 78)  
**Category**: Security

Password validation only requires `minLength: 8` without complexity rules (uppercase, lowercase, numbers, special chars). Per PROJECT.md cybersecurity measures, "password complexity rules" are mentioned but not implemented.

---

### L-04: StrictMode Double API Calls
**File**: `client/src/main.tsx`  
**Category**: React

Using `<StrictMode>` in development causes the `useEffect` in `AuthContext` to fire twice, making two permission API calls. This is expected React behavior but worth noting for development debugging.

---

### L-05: Login "Remember Me" Checkbox is Disabled
**File**: `client/src/pages/Login.tsx` (line 101)  
**Category**: UX

The "Remember me" checkbox is always disabled with no explanation. Either implement the feature or remove it to avoid confusing users.

---

### L-06: Placeholder Routes in App.tsx
**File**: `client/src/App.tsx` (lines 14-21)  
**Category**: Code Quality

Routes like `/units` render `<div>Units (coming in Phase 9)</div>`. These should at minimum render a proper "Coming Soon" component instead of raw divs.

---

### L-07: Magic Number for Stale Time
**Files**: Multiple hooks  
**Category**: Code Quality

`1000 * 60 * 5` (5 minutes) and `1000 * 60 * 2` (2 minutes) are repeated across multiple hooks. These should be extracted to a shared constant (e.g., `STALE_TIME = 5 * 60 * 1000`).

---

### L-08: ApiError Status 200 for Auth Errors
**File**: `client/src/api/client.ts` (line 73)  
**Category**: Code Quality

`throw new ApiError(200, data.error)` creates an error with HTTP status 200, which is semantically incorrect. Once the server returns proper 401 status codes (C-03), this should be removed.

---

## Files Requiring Fixes

| File | Issues | Priority |
|------|--------|----------|
| `client/src/pages/Login.tsx` | C-01, H-01 | **Immediate** |
| `server/src/modules/auth/auth.controller.ts` | C-02, C-03, H-02, H-06, H-07, L-03 | **Immediate** |
| `client/src/api/client.ts` | H-03, L-08 | **High** |
| `client/src/contexts/AuthContext.tsx` | H-04 | **High** |
| `client/src/hooks/useKpiData.ts` | H-05, M-01, M-05 | **High** |
| `client/src/hooks/useActiveCycles.ts` | M-01, M-05 | **Medium** |
| `client/src/components/layout/Layout.tsx` | M-02 | **Medium** |
| `client/src/components/layout/Sidebar.tsx` | L-01 | **Low** |
| `client/src/components/layout/Navbar.tsx` | M-07 | **Medium** |
| `client/src/components/layout/Footer.tsx` | M-06, M-08, M-09 | **Medium** |
| `client/src/components/dashboard/KpiCard.tsx` | M-06 | **Medium** |
| `client/src/api/reporting.ts` | M-04 | **Medium** |
| `client/src/api/feed.ts` | M-04 | **Medium** |
| `client/src/App.tsx` | M-10, L-06 | **Medium** |
| `client/src/main.tsx` | L-04 | **Low** |

---

## Next Step Recommendation

1. **Fix CRITICAL issues first** (C-01, C-02, C-03) — these are security vulnerabilities that should not ship to production.
2. **Fix HIGH issues** (H-01 through H-07) — these are bugs that affect correctness and security.
3. **Address MEDIUM issues** in a follow-up pass — these are code quality and UX issues.
4. **LOW issues** can be tracked as tech debt and addressed incrementally.

**Suggested order**: C-01 (open redirect) → C-02/C-03 (server auth) → H-01 (React render effect) → H-03 (CSRF) → H-04 (permissions desync) → H-05 (null average) → remaining issues.