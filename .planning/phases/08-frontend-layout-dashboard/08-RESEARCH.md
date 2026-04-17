# Phase 08: Frontend — Layout & Dashboard - Research

**Researched:** 2026-04-17
**Domain:** React + MUI + TanStack Query + React Router v7 — SPA layout, auth, dashboard
**Confidence:** HIGH

## Summary

This phase builds the complete frontend shell: a modern minimalist MUI layout with Sidebar, Navbar, Footer, a cookie-based auth flow with React Context + TanStack Query, and a dashboard with 4 KPI cards consuming existing backend APIs. The project already has React 19.1.0, React Router DOM 7.6.0+ (resolves to 7.14.1), TanStack Query 5.76.0+ (resolves to 5.99.0), and MUI 7.1.0+ (resolves to 7.3.10) installed with empty directories ready for population.

**Critical finding:** React Router DOM v7 still fully supports the `<BrowserRouter>` + `<Routes>` + `<Route>` declarative pattern used in the existing `App.tsx` and `main.tsx`. The `react-router-dom` package continues to work — there is no need to migrate to `createBrowserRouter` data router or the new `react-router` package. This is a compatibility win that eliminates a major migration risk.

**Critical finding:** MUI v7 has breaking changes from v5 in Drawer CSS class names (anchor selectors changed from `.MuiDrawer-paperAnchor*` to `.MuiDrawer-anchor* > .MuiDrawer-paper`) and in component prop APIs (Backdrop/Paper/Slide props moved to `slots`/`slotProps`). The existing theme at `client/src/theme/index.ts` uses the v5-compatible `components.MuiDrawer.styleOverrides` structure — it will need updating if any Drawer overrides are added.

**Primary recommendation:** Use the existing `<BrowserRouter>` + `<Routes>` pattern for routing, extend the existing MUI theme (don't replace it), build auth context with TanStack Query mutations, and use cookie-based `credentials: 'include'` for all API calls.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: MUI theme with green accent (#2E7D32), neutral slate base
- D-02: Sidebar + Navbar + Footer as independent separated components
- D-03: Cookie-based auth (no localStorage token) — session via httpOnly cookie
- D-04: TanStack Query + React Context for auth state
- D-05: Fetch wrapper API client (NOT Eden Treaty)
- D-06: Permission-driven menu items from `/api/rbac/permissions`
- D-07: RequireAuth component for route guards
- D-08: Dashboard shows 4 KPI cards from existing backend APIs
- D-09: Responsive layout: desktop-first, mobile-adaptive

### Agent's Discretion
- Exact implementation patterns for hooks, contexts, and layout
- Error handling and loading state specifics
- Dashboard card styling details beyond UI-SPEC

### Deferred Ideas (OUT OF SCOPE)
- Detailed page implementations (Units, Plasmas, Cycles, etc.) — Phase 9
- DataGrid tables for list views
- Chart components (BW curve, FCR trend)
- RBAC Manager UI
- User Management UI
- CSV/Excel export buttons
- Notification system
- Tenant switcher (backend multi-tenant)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| D-01 | MUI theme with green accent palette | Theme extensions documented; existing theme at `client/src/theme/index.ts` confirmed |
| D-02 | Sidebar + Navbar + Footer as separated components | MUI Drawer + AppBar responsive layout patterns documented |
| D-03 | Cookie-based auth — httpOnly session cookie | Server confirms `auth_session` cookie with httpOnly, Secure, SameSite=Strict; CORS configured with `credentials: true` |
| D-04 | TanStack Query + React Context for auth | Auth context + useQuery/useMutation patterns documented; provider order confirmed |
| D-05 | Fetch wrapper API client | `apiClient<T>` pattern documented with `credentials: 'include'` |
| D-06 | Permission-driven menu from `/api/rbac/permissions` | API response shape `{ permissions: [...] }` confirmed from server controller |
| D-07 | RequireAuth route guard | `<Outlet>` + redirect pattern documented for React Router v7 |
| D-08 | Dashboard KPI cards | 4 endpoints mapped: cycles, reporting/performance, reporting/stock-resume, feed/stock |
| D-09 | Responsive layout | MUI breakpoint system (xs/sm/md/lg) documented with Drawer patterns |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Routing & layout | Browser/Client | — | SPA routing is purely client-side |
| Auth state (session cookie) | API/Backend | Browser/Client | Backend owns session validation; client reads via /me endpoint |
| Auth context (user state) | Browser/Client | — | React Context manages UI auth state |
| Data fetching & caching | Browser/Client | API/Backend | TanStack Query caches; backend serves data |
| Permission filtering | Browser/Client | API/Backend | Backend enforces RBAC; client filters menu UI |
| Layout responsive behavior | Browser/Client | — | MUI breakpoints and CSS media queries |
| KPI data aggregation | Browser/Client | — | Dashboard computes averages from multiple API responses |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.1.0+ | UI framework | Already installed; project standard |
| react-dom | 19.1.0+ | React DOM renderer | Paired with React |
| react-router-dom | 7.6.0+ (resolves to 7.14.1) | Client-side routing | Already installed; supports `<BrowserRouter>` + `<Routes>` pattern [VERIFIED: Context7 + installed node_modules] |
| @tanstack/react-query | 5.76.0+ (resolves to 5.99.0) | Server state management | Already installed; async data fetching standard |
| @mui/material | 7.1.0+ (resolves to 7.3.10) | UI component library | Already installed; project UI standard |
| @mui/icons-material | 7.1.0+ | Material icons | Paired with MUI; already installed |
| @emotion/react | 11.14.0 | CSS-in-JS engine for MUI | Required peer dep of MUI v7 |
| @emotion/styled | 11.14.0 | Styled components for MUI | Required peer dep of MUI v7 |
| @mui/x-data-grid | 8.5.0+ (resolves to 8.28.2) | Data tables | Already installed; for dashboard recent items |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @mui/x-charts | 8.5.0+ | Chart components | Phase 9+ when charts needed |
| vitest | 3.1.0 | Test runner | Already configured in client |
| @testing-library/react | 16.3.0 | Component testing | Already installed; for testing layout/auth |
| jsdom | 26.1.0 | DOM environment for tests | Already installed; paired with vitest |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-router-dom | react-router (v7 unified package) | Both work; `react-router-dom` is already installed and provides identical v7 API. Migration not needed. |
| Eden Treaty | Fetch wrapper | Eden creates tight coupling between server/client types; fetch wrapper is more portable [LOCKED by D-05] |
| localStorage tokens | Cookie-based sessions | Security: httpOnly cookies can't be read by XSS; already locked by D-03 |

**Installation:**
No new packages needed — all core dependencies are already installed in `client/package.json`.

**Version verification:**
```
react: 19.2.5 (installed, package.json: ^19.1.0)
react-router-dom: 7.14.1 (installed, package.json: ^7.6.0)
@tanstack/react-query: 5.99.0 (installed, package.json: ^5.76.0)
@mui/material: 7.3.10 (installed, package.json: ^7.1.0)
@mui/x-data-grid: 8.28.2 (installed, package.json: ^8.5.0)
```
[VERIFIED: node_modules package.json files checked 2026-04-17]

## Architecture Patterns

### System Architecture Diagram

```
Browser (React SPA)
┌─────────────────────────────────────────────────────────────┐
│ main.tsx                                                     │
│ ┌─StrictMode─┐                                              │
│ │  BrowserRouter                                             │
│ │   └─ QueryClientProvider                                   │
│ │       └─ ThemeProvider                                     │
│ │           └─ CssBaseline                                   │
│ │               └─ AuthProvider  ◄── GET /api/auth/me       │
│ │                   └─ App (<Routes>)                        │
│ │                       ├─ /login → LoginPage               │
│ │                       └─ <RequireAuth>                     │
│ │                           └─ <Layout>                      │
│ │                               ├─ Sidebar (Drawer)         │
│ │                               ├─ Navbar (AppBar)           │
│ │                               ├─ <Outlet />                │
│ │                               └─ Footer                    │
│ │                                   │                       │
│ └───────────────────────────────────┼───────────────────────┘
│                                     │                       │
└─────────────────────────────────────┼───────────────────────┘
                                      │ credentials: 'include'
                                      ▼
                            ┌─────────────────┐
                            │  Elysia API     │
                            │  :3000/api/*    │
                            │  ┌────────────┐ │
                            │  │ Session    │ │
                            │  │ (Redis)    │ │
                            │  └────────────┘ │
                            │  ┌────────────┐ │
                            │  │ MySQL DB   │ │
                            │  └────────────┘ │
                            └─────────────────┘
                              Vite proxy :5173 → :3000
```

### Recommended Project Structure
```
client/src/
├── api/
│   ├── client.ts               # Fetch wrapper + error classes
│   ├── auth.ts                 # login, logout, getCurrentUser
│   ├── cycles.ts               # listCycles (active)
│   ├── reporting.ts            # getPerformance, getStockResume
│   └── rbac.ts                 # listPermissions
├── components/
│   ├── layout/
│   │   ├── Layout.tsx           # Composes Sidebar+Navbar+Footer+Outlet
│   │   ├── Sidebar.tsx          # Collapsible navigation drawer
│   │   ├── Navbar.tsx           # Top app bar
│   │   └── Footer.tsx           # Bottom bar
│   ├── RequireAuth.tsx          # Auth guard wrapper
│   └── dashboard/
│       └── KpiCard.tsx          # Reusable KPI card component
├── contexts/
│   └── AuthContext.tsx          # Auth state provider + useAuth hook
├── hooks/
│   ├── useActiveCycles.ts       # TanStack Query hook
│   └── useKpiData.ts           # Dashboard KPI data aggregation
├── pages/
│   ├── Login.tsx                # Login form
│   ├── Dashboard.tsx            # Dashboard with KPI cards + recent items
│   └── NotFound.tsx             # 404 page
├── theme/
│   └── index.ts                 # (existing, extend with component overrides)
├── types/
│   └── index.ts                 # Shared TypeScript interfaces
├── main.tsx                     # (update provider stack)
└── App.tsx                      # (update with route definitions)
```

### Pattern 1: React Router v7 Declarative Routes with `<BrowserRouter>`

**What:** Use `<BrowserRouter>` with nested `<Routes>` and `<Route>` components for routing. This is the simplest pattern and is fully supported in React Router v7.

**When to use:** This IS the pattern for this project — already established in `main.tsx`.

**Key insight:** React Router v7 still exports `BrowserRouter`, `Routes`, `Route`, `Outlet`, `Navigate`, `useNavigate`, `useLocation` etc. from `react-router-dom`. No migration to `createBrowserRouter` needed. The data router (`createBrowserRouter` + `RouterProvider`) is an alternative pattern for SSR/data-loading scenarios, which we don't need.

```typescript
// App.tsx — Declarative route pattern (VERIFIED: React Router v7.x supports this)
import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { RequireAuth } from './components/RequireAuth'
import { LoginPage } from './pages/Login'
import { DashboardPage } from './pages/Dashboard'
import { NotFoundPage } from './pages/NotFound'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/" element={<DashboardPage />} />
        {/* Phase 9 will add more routes here */}
        <Route path="/units" element={<div>Units (coming soon)</div>} />
        <Route path="/plasmas" element={<div>Plasmas (coming soon)</div>} />
        <Route path="/cycles" element={<div>Cycles (coming soon)</div>} />
        <Route path="/recordings" element={<div>Recordings (coming soon)</div>} />
        <Route path="/feed" element={<div>Feed (coming soon)</div>} />
        <Route path="/reports" element={<div>Reports (coming soon)</div>} />
        <Route path="/rbac" element={<div>RBAC (coming soon)</div>} />
        <Route path="/users" element={<div>Users (coming soon)</div>} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
```

### Pattern 2: MUI v7 Responsive Drawer + AppBar Layout

**What:** MUI's recommended pattern for a responsive sidebar layout uses `AppBar` (fixed top) + `Drawer` (side navigation) with `useMediaQuery` for responsive behavior.

**When to use:** This is the standard pattern for admin dashboards with a collapsible sidebar.

```typescript
// Layout.tsx — Responsive sidebar + navbar + footer pattern
import { Box, useMediaQuery, useTheme } from '@mui/material'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'

const DRAWER_WIDTH = 240
const DRAWER_WIDTH_COLLAPSED = 72
const APPBAR_HEIGHT = 64
const FOOTER_HEIGHT = 40

export function Layout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const sidebarWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar onMenuClick={() => setMobileOpen(!mobileOpen)} />
      <Sidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        variant={isMobile ? 'temporary' : 'permanent'}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: isMobile ? 0 : `${sidebarWidth}px`,
          mt: `${APPBAR_HEIGHT}px`,
          minHeight: `calc(100vh - ${APPBAR_HEIGHT}px)`,
        }}
      >
        <Box sx={{ flex: 1, p: 3 }}>
          <Outlet />
        </Box>
        <Footer />
      </Box>
    </Box>
  )
}
```

### Pattern 3: Auth Context + TanStack Query

**What:** React Context provides `user`, `isAuthenticated`, `permissions`, `login()`, `logout()`. TanStack Query handles async operations inside context.

**When to use:** Standard pattern for auth state in React SPA with server session.

```typescript
// AuthContext.tsx — Cookie-based auth with TanStack Query mutations
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  permissions: string[]
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [permissions, setPermissions] = useState<string[]>([])

  // Check session on mount
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiClient<{ user: User }>('/auth/me'),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 min
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (creds: { email: string; password: string }) =>
      apiClient<{ success: boolean; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(creds),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })

  // ... logout, permissions fetching similarly

  return (
    <AuthContext.Provider value={{
      user: user?.user ?? null,
      isAuthenticated: !!user?.user,
      isLoading,
      permissions,
      login: loginMutation.mutateAsync,
      logout: logoutMutation.mutateAsync,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

### Pattern 4: Fetch Wrapper API Client

**What:** A typed fetch wrapper that automatically includes credentials and handles 401 redirects.

```typescript
// client/src/api/client.ts
const API_BASE = import.meta.env.VITE_API_URL || '/api'

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // CRITICAL: sends httpOnly cookie
  })

  if (!response.ok) {
    if (response.status === 401) {
      // Let AuthContext handle via queryCache
      throw new ApiError(401, 'UNAUTHORIZED', 'Session expired')
    }
    const error = await response.json().catch(() => ({ message: 'Network error' }))
    throw new ApiError(
      response.status,
      error.code ?? 'UNKNOWN',
      error.message ?? 'Unknown error'
    )
  }

  return response.json()
}
```

### Pattern 5: RequireAuth Route Guard

```typescript
// client/src/components/RequireAuth.tsx
import { Navigate, useLocation } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <>{children}</>
}
```

### Anti-Patterns to Avoid

- **Storing auth token in localStorage:** Use httpOnly cookie only — localStorage is vulnerable to XSS [LOCKED by D-03]
- **Using Eden Treaty in the client:** Creates tight coupling; fetch wrapper is more portable [LOCKED by D-05]
- **MUI v5 Drawer CSS class names:** v7 changed `.MuiDrawer-paperAnchorLeft` to `.MuiDrawer-anchorLeft > .MuiDrawer-paper` — use `drawerClasses` from MUI imports
- **Passing props through Layout for auth:** Use React Context — avoids deep prop drilling
- **Skipping `credentials: 'include'` in fetch:** Without this, cookies won't be sent cross-origin (even through Vite proxy in some cases)
- **Using `Grid` from `@mui/material/Grid` (legacy):** In MUI v7, use `Grid` from `@mui/material/Grid` (now Grid v2 by default) or explicit `Grid2` import

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth state management | Custom auth reducer + localStorage | TanStack Query + React Context | Handles loading, error, caching; prevents stale auth state |
| Data fetching & caching | Custom fetch + useState | TanStack Query `useQuery` | Caching, stale-while-revalidate, background refetch, retry |
| Session persistence | Custom token storage | Browser cookie (httpOnly, set by server) | Server manages session; no XSS-exposed tokens |
| Form validation in Login | Manual validation | MUI TextField `error` + `helperText` with controlled state | Simple, accessible, no need for heavy form library |
| Responsive breakpoints | Custom media queries | MUI `useMediaQuery` + `theme.breakpoints` | Consistent with MUI's breakpoint system |
| Route protection | Custom `useEffect` + redirect | `RequireAuth` wrapper with `Navigate` | React Router native pattern; handles loading state |
| Permission filtering | Custom RBAC logic in each component | Permission array from context + filter function | Single source of truth; server-enforced RBAC already exists |

**Key insight:** The backend already enforces RBAC via `requirePermission()` middleware. The frontend's permission check is purely for UI filtering (hiding menu items, disabling buttons). Never rely on frontend-only permissions for security.

## Common Pitfalls

### Pitfall 1: MUI v7 Drawer CSS Class Changes
**What goes wrong:** Using v5 class selectors like `.MuiDrawer-paperAnchorLeft` in theme overrides — these don't work in v7.
**Why it happens:** MUI v7 changed Drawer CSS class structure. Anchor selectors now require parent-child combinators.
**How to avoid:** Import `drawerClasses` from `@mui/material/Drawer` and use the new pattern: `&.${drawerClasses.anchorLeft} > .${drawerClasses.paper}`.
**Warning signs:** Theme overrides on `MuiDrawer` not applied; sidebar styling broken.

### Pitfall 2: Vite Proxy Cookie Handling
**What goes wrong:** Cookies not being sent with API requests in development despite `credentials: 'include'`.
**Why it happens:** The Vite proxy at `/api → http://localhost:3000` forwards requests but the browser sees same-origin for `/api` paths, so cookies should work. However, if `VITE_API_URL` is set to `http://localhost:3000/api` instead of using the proxy, cookies won't be sent because it's cross-origin.
**How to avoid:** Use relative path `/api` as `API_BASE` (not full URL) so requests go through Vite proxy, which handles cookies transparently. Only use full URL in production where CORS is properly configured.
**Warning signs:** Login succeeds (200 response) but `/api/auth/me` returns 401; cookies not visible in DevTools.

### Pitfall 3: TanStack Query Auth Check Infinite Loop
**What goes wrong:** `useQuery` for `/auth/me` triggering infinite re-fetches when user is unauthenticated.
**Why it happens:** 401 response causes query to error, query retries by default, creating loops.
**How to avoid:** Set `retry: false` on the auth query and `staleTime: 1000 * 60 * 5` to prevent unnecessary re-fetches.
**Warning signs:** Network tab shows repeated `/auth/me` requests; loading spinner never resolves.

### Pitfall 4: React Router v7 Import Confusion
**What goes wrong:** Mixing imports from `react-router` and `react-router-dom`.
**Why it happens:** React Router v7 has both `react-router` and `react-router-dom` packages. `react-router-dom` re-exports everything from `react-router` plus adds browser-specific components.
**How to avoid:** Import everything from `react-router-dom` only — this is the established pattern and matches existing code.
**Warning signs:** TypeScript errors about missing exports; components not rendering.

### Pitfall 5: MUI Drawer Permanent Variant on Mobile
**What goes wrong:** Permanent Drawer visible on mobile, pushing content off-screen.
**Why it happens:** Permanent Drawer is always visible; it doesn't auto-hide on small screens.
**How to avoid:** Use `variant="temporary"` for mobile (xs/sm) and `variant="permanent"` for desktop (lg+); use `variant="persistent"` or collapsed 72px for md. Match UI-SPEC responsive behavior table.
**Warning signs:** Horizontal scroll on mobile; content area too narrow.

### Pitfall 6: Auth Context Provider Order
**What goes wrong:** `AuthProvider` can't access `useQueryClient()` because it's rendered outside `QueryClientProvider`.
**Why it happens:** Provider nesting order matters — `AuthProvider` needs TanStack Query context.
**How to avoid:** Provider order: `StrictMode > BrowserRouter > QueryClientProvider > ThemeProvider > CssBaseline > AuthProvider > App`.
**Warning signs:** `useQueryClient` or `useMutation` throws "No QueryClient set" error.

## Code Examples

### Login Page Pattern (from UI-SPEC)

```typescript
// pages/Login.tsx — Centered card on slate-50 background
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Box, Card, CardContent, TextField, Button, Alert, Checkbox, FormControlLabel } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      navigate(searchParams.get('returnUrl') || '/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          {/* ... form fields */}
        </CardContent>
      </Card>
    </Box>
  )
}
```

### KPI Card Component (from UI-SPEC)

```typescript
// components/dashboard/KpiCard.tsx
import { Card, CardContent, Typography, Box } from '@mui/material'
import { SvgIconComponent } from '@mui/icons-material'

interface KpiCardProps {
  title: string
  value: string | number
  icon: SvgIconComponent
  color: string
  subtitle?: string
}

export function KpiCard({ title, value, icon: Icon, color, subtitle }: KpiCardProps) {
  return (
    <Card sx={{ border: '1px solid', borderColor: 'border', borderRadius: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 600 }}>{value}</Typography>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
          <Icon sx={{ fontSize: 40, color }} />
        </Box>
      </CardContent>
    </Card>
  )
}
```

### MUI v7 Theme Extension (from existing theme + UI-SPEC additions)

```typescript
// theme/index.ts — Add to existing theme
// Existing theme has: primary (green), secondary (blue), shape.borderRadius: 8,
// MuiButton textTransform: 'none', MuiCard shadow, MuiAppBar shadow
// Add these component overrides per UI-SPEC:

declare module '@mui/material/styles' {
  interface Theme {
    // Custom theme extensions if needed
  }
  interface ThemeOptions {
    // Custom theme options
  }
}

// In createTheme() object, add under 'components':
{
  MuiTableHead: {
    styleOverrides: {
      root: {
        backgroundColor: '#f8fafc', // slate-50
        '& .MuiTableCell-head': {
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          color: '#64748b', // slate-500
          fontWeight: 600,
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        padding: '12px 16px',
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        '&:hover': {
          backgroundColor: '#f8fafc', // slate-50
        },
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
      },
    },
  },
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MUI v5 `Grid` component | MUI v7 `Grid` (Grid v2 default) | MUI v7 (2025) | Import from `@mui/material/Grid` now gets Grid v2; legacy Grid available as `GridLegacy` |
| MUI Drawer `PaperProps` | Drawer `slotProps.paper` | MUI v7 | Component-specific props → unified slots/slotProps API |
| MUI Drawer `.MuiDrawer-paperAnchorLeft` | `.MuiDrawer-anchorLeft > .MuiDrawer-paper` | MUI v6+ | CSS class structure changed for anchor selectors |
| `react-router-dom` v6 API | `react-router-dom` v7 API (same) | v7 (2024) | `<BrowserRouter>` + `<Routes>` still works; no breaking change for declarative routing |
| TanStack Query v4 `useQuery([key], fn)` | TanStack Query v5 `useQuery({ queryKey, queryFn })` | v5 (2024) | Object syntax required; array key syntax removed |
| MUI v5 `createTheme` → v7 | `createTheme` unchanged API | v7 | `createTheme()` function API is stable; component overrides use `styleOverrides` |
| Auth via localStorage token | Cookie-based httpOnly sessions | — | Server already uses Lucia with httpOnly cookies; client just needs `credentials: 'include'` |

**Deprecated/outdated:**
- MUI v5 `Grid` component: Renamed to `GridLegacy` in v7. Use `Grid` (v2) or `Grid2` import.
- MUI Drawer `BackdropComponent`, `BackdropProps`, `PaperProps`: Deprecated in v7. Use `slots` and `slotProps` instead. [CITED: MUI codemod documentation]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | React Router v7 `<BrowserRouter>` + `<Routes>` pattern fully works without migration | Routing Patterns | Medium — would need createBrowserRouter refactor |
| A2 | Server `/api/auth/me` returns proper JSON on 401 (not redirect) | Auth Context | Medium — would need error handling adjustment |
| A3 | Vite proxy correctly forwards cookies for `/api` requests | API Client | Low — standard Vite proxy behavior |
| A4 | MUI v7.3.10 is backward-compatible with theme structure in v7.1.0 | Theme | Low — minor version backward compatible |
| A5 | Server CORS `credentials: true` allows cookie sending from dev origin | Auth | Low — already configured |

**Verified claims:** React Router v7 declarative routing [VERIFIED: Context7 docs confirm], TanStack Query v5 object syntax [VERIFIED: Context7 docs], MUI v7 Drawer class name changes [VERIFIED: Context7 MUI codemod docs], server cookie settings [VERIFIED: lucia.ts source code checked], server CORS [VERIFIED: index.ts checked].

## Open Questions

1. **Server `/api/auth/me` returns 200 with `{ error: 'Not authenticated' }` instead of 401**
   - What we know: Looking at `auth.controller.ts` line 93-102, the `/me` endpoint returns `{ error: 'Not authenticated' }` or `{ error: 'Session expired' }` with a 200 status code when session is invalid.
   - What's unclear: The client needs to check for `error` field in response body rather than relying on HTTP status codes.
   - Recommendation: The apiClient should check for `error` field in response JSON and treat it as authentication failure. Alternatively, modify the server `/me` endpoint to return 401 status — but that's outside this phase's scope.

2. **RBAC permissions endpoint requires authentication + tenantId**
   - What we know: `/api/rbac/permissions` requires `beforeHandle: requirePermission('rbac.read')`, meaning the user needs `rbac.read` permission to list permissions.
   - What's unclear: How to load permissions for the logged-in user without them needing `rbac.read` permission. The UI needs to know which menu items to show based on the user's role.
   - Recommendation: The `/api/auth/me` response should include the user's `roleId` and `tenantId`. Then load permissions via `/api/rbac/roles/:id/permissions` or add a new endpoint like `/api/auth/permissions` that returns the current user's permissions without requiring `rbac.read`. This needs clarification with the planner.

3. **Tenant ID resolution for API calls**
   - What we know: Backend uses `x-tenant-id` header or session-derived tenantId. The client needs to send tenantId with API requests.
   - What's unclear: Whether the `/api/auth/me` response includes `tenantId` (it returns `{ id, email, name }`) — it might need to include `tenantId` and `roleId` for proper client-side permission filtering.
   - Recommendation: Extend `/api/auth/me` response (or add a separate profile endpoint) to include `roleId`, `tenantId`, and permissions array.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Bun runtime | Dev server | ✓ | 1.x | — |
| MySQL | Backend data | ✓ | Running | — |
| Redis | Session/cache | ✓ | Running | — |
| Vite dev server | Frontend build | ✓ | 6.3.0 | — |
| Node.js compatibility | Build/checks | ✓ | Via Bun | — |

**Missing dependencies with no fallback:** None identified.

**Missing dependencies with fallback:** None needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.1.0 + @testing-library/react 16.3.0 |
| Config file | `client/vitest.config.ts` |
| Quick run command | `cd client && bun test --reporter=dot` |
| Full suite command | `cd client && bun test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-02 | Sidebar collapses/expands | unit | `cd client && bun test src/components/layout/Sidebar.test.tsx` | ❌ Wave 0 |
| D-02 | Navbar renders breadcrumbs | unit | `cd client && bun test src/components/layout/Navbar.test.tsx` | ❌ Wave 0 |
| D-03 | Auth context provides user state | unit | `cd client && bun test src/contexts/AuthContext.test.tsx` | ❌ Wave 0 |
| D-05 | API client sends credentials: include | unit | `cd client && bun test src/api/client.test.ts` | ❌ Wave 0 |
| D-06 | Menu items filtered by permissions | unit | `cd client && bun test src/components/layout/Sidebar.test.tsx` | ❌ Wave 0 |
| D-07 | RequireAuth redirects when unauthenticated | unit | `cd client && bun test src/components/RequireAuth.test.tsx` | ❌ Wave 0 |
| D-08 | Dashboard shows 4 KPI cards | unit | `cd client && bun test src/pages/Dashboard.test.tsx` | ❌ Wave 0 |
| D-09 | Layout responsive at breakpoints | integration | Visual/manual check | N/A |

### Sampling Rate
- **Per task commit:** `cd client && bun test --reporter=dot`
- **Per wave merge:** `cd client && bun test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `client/src/components/layout/Sidebar.test.tsx` — covers D-02, D-06
- [ ] `client/src/components/layout/Navbar.test.tsx` — covers D-02
- [ ] `client/src/contexts/AuthContext.test.tsx` — covers D-03
- [ ] `client/src/api/client.test.ts` — covers D-05
- [ ] `client/src/components/RequireAuth.test.tsx` — covers D-07
- [ ] `client/src/pages/Dashboard.test.tsx` — covers D-08
- [ ] Shared test fixture: `client/src/test/setup.ts` — MSW or fetch mock for API calls

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Cookie-based httpOnly sessions (server-side via Lucia) |
| V3 Session Management | yes | httpOnly + Secure + SameSite=Strict cookie; server validates via Lucia |
| V4 Access Control | yes | Frontend permissions for UI filtering; backend RBAC enforced via `requirePermission()` |
| V5 Input Validation | yes | MUI TextField validation + server-side Zod validation |
| V6 Cryptography | no | No client-side crypto needed |
| V8 Data Protection | yes | CSRF protection via double-submit cookie (server-side); Vite proxy for same-origin |

### Known Threat Patterns for React SPA + Cookie Auth

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS stealing auth data | Information Disclosure | httpOnly cookies cannot be read by JS; no token in localStorage |
| CSRF on state-changing requests | Tampering | Server has CSRF origin verification (lucia `verifyRequestOrigin`) + SameSite=Strict |
| Session fixation | Spoofing | Server creates new session on login; Lucia handles rotation |
| Permission bypass (client-side only) | Elevation of Privilege | Backend enforces RBAC via middleware; client filtering is cosmetic only |
| API response data leakage | Information Disclosure | Tenant isolation via `tenant_id` on all backend queries |

## Sources

### Primary (HIGH confidence)
- Context7 (remix-run/react-router) — React Router v7 declarative routing, Route, Outlet, Navigate API
- Context7 (mui/material-ui) — MUI v7 Drawer class changes, component overrides, slots/slotProps migration
- Context7 (tanstack/query) — useQuery, useMutation, QueryClientProvider patterns
- Context7 (mui/mui-x) — DataGrid v8 basic usage, columns, rows
- Source code verified: `server/src/auth/lucia.ts` — session cookie config (httpOnly, Secure, SameSite=Strict)
- Source code verified: `server/src/index.ts` — CORS configuration with `credentials: true`
- Source code verified: `server/src/modules/auth/auth.controller.ts` — login/logout/me API shapes
- Source code verified: `server/src/modules/rbac/rbac.controller.ts` — permissions API shapes
- Source code verified: `client/package.json` — installed dependency versions confirmed
- Source code verified: `client/vite.config.ts` — proxy configuration confirmed

### Secondary (MEDIUM confidence)
- MUI v7 codemod documentation — Drawer class name migration patterns
- React Router v7 documentation — BrowserRouter compatibility confirmed
- npm registry — version confirmed: react-router-dom@7.14.1, @mui/material@7.3.10, @tanstack/react-query@5.99.0

### Tertiary (LOW confidence)
- None — all critical findings verified from source code or Context7 documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages installed and verified; APIs confirmed via Context7 and source code
- Architecture: HIGH — provider order, routing pattern, layout pattern all validated against working examples
- Pitfalls: HIGH — verified MUI v7 CSS changes, React Router v7 compatibility, Vite proxy cookie behavior
- API integration: MEDIUM — server response shapes need clarification (auth/me returns 200 with error object; permissions endpoint requires rbac.read)

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (stable stack, 30-day validity)