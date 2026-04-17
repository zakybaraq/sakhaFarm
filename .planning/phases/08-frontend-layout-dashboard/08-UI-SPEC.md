# UI-SPEC.md — Phase 8: Frontend Layout & Dashboard

**Phase:** 08-frontend-layout-dashboard  
**Date:** 2026-04-17  
**Status:** Design Contract (locked decisions)

---

## 1. Design System

### 1.1 Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `primary.main` | `#2E7D32` | Primary actions, active states, links |
| `primary.light` | `#4CAF50` | Hover states, light backgrounds |
| `primary.dark` | `#1B5E20` | Pressed states, emphasis |
| `secondary.main` | `#1976D2` | Secondary actions, info badges |
| `secondary.light` | `#42A5F5` | Secondary hover |
| `secondary.dark` | `#1565C0` | Secondary pressed |
| `background.default` | `#F5F5F5` | Page background |
| `background.paper` | `#FFFFFF` | Card/paper background |
| `text.primary` | `#0f172a` | Primary text (slate-900) |
| `text.secondary` | `#64748b` | Secondary text (slate-500) |
| `border` | `#e2e8f0` | Borders, dividers (slate-200) |
| `error.main` | `#D32F2F` | Error states |
| `warning.main` | `#ED6C02` | Warning states |
| `success.main` | `#2E7D32` | Success states (same as primary) |

### 1.2 Typography

| Variant | Size | Weight | Line Height |
|---------|------|--------|-------------|
| `h1` | 2.25rem | 700 | 1.2 |
| `h2` | 1.875rem | 600 | 1.3 |
| `h3` | 1.5rem | 600 | 1.4 |
| `h4` | 1.25rem | 600 | — |
| `h5` | 1.125rem | 500 | — |
| `h6` | 1rem | 500 | — |
| `body1` | 0.9375rem | 400 | 1.6 |
| `body2` | 0.875rem | 400 | 1.5 |
| `button` | 0.875rem | 500 | — |
| `caption` | 0.75rem | 400 | 1.4 |

**Font family:** `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

### 1.3 Spacing & Borders

| Token | Value |
|-------|-------|
| `shape.borderRadius` | `8px` |
| Card border radius | `12px` |
| Card shadow | `0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px rgba(0,0,0,0.06)` |
| Card hover shadow | `0 4px 12px rgba(22,163,74,0.1)` |
| Card hover border | `#2E7D32` (primary.main) |
| Button border radius | `6px` |
| Button text transform | `none` |

### 1.4 MUI Component Overrides

Overrides already defined in `client/src/theme/index.ts`:
- **Button**: `textTransform: 'none'`, `fontWeight: 500`, `disableElevation: true`
- **Card**: `elevation: 0`, `border: '1px solid #e2e8f0'`, hover transition
- **AppBar**: `elevation: 0`, white background, bottom border
- **Drawer**: Paper has `borderRight: '1px solid #e2e8f0'`, `backgroundColor: '#f8fafc'`

**Additional overrides to add:**
- **TableHead**: Slate-50 background, uppercase headers, slate-500 color
- **TableCell**: Padding 12px 16px
- **TableRow**: Hover state slate-50 background

---

## 2. Layout Architecture

### 2.1 Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Navbar (AppBar) — white bg, bottom border, z-index: 2  │
│  [☰] [Breadcrumbs]                [Tenant▼] [🔔] [User▼]│
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│  Sidebar │           Main Content                       │
│  (Drawer)│           (<Outlet />)                       │
│  240px   │                                              │
│  or 72px │                                              │
│ collapsed│                                              │
│          │                                              │
├──────────┴──────────────────────────────────────────────┤
│  Footer — Slate-50 bg, version, copyright, status       │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Responsive Behavior

| Breakpoint | Sidebar | AppBar | Layout |
|------------|---------|--------|--------|
| `xs` (< 600px) | Hidden, hamburger toggle | Full width, hamburger button | Single column |
| `sm` (600-899px) | Hidden, hamburger toggle | Full width, hamburger button | Single column |
| `md` (900-1199px) | Permanent, collapsed (72px) | Offset by sidebar width | Two column |
| `lg` (1200px+) | Permanent, expanded (240px) | Offset by sidebar width | Two column |

### 2.3 Sidebar Component

**File:** `client/src/components/layout/Sidebar.tsx`

**Props:**
```typescript
interface SidebarProps {
  open: boolean                    // Mobile drawer state
  onClose: () => void             // Close mobile drawer
  collapsed: boolean              // Desktop collapse state
  onToggleCollapse: () => void    // Toggle desktop collapse
  userPermissions: string[]      // From /api/rbac/permissions
}
```

**Navigation Items (permission-driven):**

| Item | Icon | Permission Required | Route |
|------|------|-------------------|-------|
| Dashboard | `DashboardIcon` | (always visible) | `/` |
| Units | `BusinessIcon` | `units.read` | `/units` |
| Plasmas | `AgricultureIcon` | `plasmas.read` | `/plasmas` |
| Cycles | `AutorenewIcon` | `cycles.read` | `/cycles` |
| Recordings | `EditNoteIcon` | `recordings.read` | `/recordings` |
| Feed Stock | `Inventory2Icon` | `feed.read` | `/feed` |
| Reports | `AssessmentIcon` | `reporting.read` | `/reports` |
| RBAC | `AdminPanelSettingsIcon` | `rbac.read` | `/rbac` |
| Users | `PeopleIcon` | `users.read` | `/users` |

**Collapsed state:** Show icons only, tooltip on hover with `Tooltip` component.

**Active state:** Primary color background, white text, left border indicator.

### 2.4 Navbar Component

**File:** `client/src/components/layout/Navbar.tsx`

**Elements (left to right):**
1. **Hamburger** (mobile only) — toggles sidebar drawer
2. **Breadcrumbs** — auto-generated from route (`＞ Units ＞ Plasma Kuningan`)
3. **Spacer**
4. **Tenant Switcher** — dropdown with tenant list (for Super Admin)
5. **Notification Bell** — badge with count, dropdown panel
6. **User Menu** — avatar + name dropdown with: Profile, Settings, Logout

**Props:**
```typescript
interface NavbarProps {
  onMenuClick: () => void       // Toggle mobile sidebar
}
```

### 2.5 Footer Component

**File:** `client/src/components/layout/Footer.tsx`

**Elements:**
- Left: `© 2026 SakhaFarm`
- Center: App version (from `package.json` version or env)
- Right: System status indicator (green dot = online, red dot = offline)

**Height:** 40px, `background: #f8fafc`, `borderTop: 1px solid #e2e8f0`

### 2.6 Layout Component

**File:** `client/src/components/layout/Layout.tsx`

Composes: `Sidebar` + `Navbar` + `Footer` + `<Outlet />`

**State management:**
- `mobileOpen: boolean` — sidebar drawer state (mobile)
- `collapsed: boolean` — sidebar collapsed state (desktop)
- Persist `collapsed` to `localStorage` key `'sakha_sidebar_collapsed'`

---

## 3. Authentication Flow

### 3.1 Auth Context

**File:** `client/src/contexts/AuthContext.tsx`

```typescript
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  permissions: string[]
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}
```

**Session strategy:** Cookie-based (httpOnly, Secure, SameSite=Strict). No token in localStorage.

**Auth check on mount:** `GET /api/auth/me` — if 200, restore user; if 401, clear state.

**Permissions:** Loaded from `GET /api/rbac/permissions` after auth, cached in context.

### 3.2 RequireAuth Component

**File:** `client/src/components/RequireAuth.tsx`

- Shows `<CircularProgress />` while `isLoading === true`
- Redirects to `/login?returnUrl={location.pathname}` if `!isAuthenticated`
- Renders `children` if authenticated
- Optional `requiredPermission?: string` prop — redirects to `/` if lacking permission

### 3.3 Login Page

**File:** `client/src/pages/Login.tsx`

**Layout:** Centered card on slate-50 background, max-width 400px.

**Form fields:**
- Email (text input, required, email validation)
- Password (password input, required, min 8 chars)
- "Remember me" checkbox (future: persisted session)
- Submit button (full-width, primary color)

**Error states:**
- Invalid credentials: Red alert below form
- Network error: Yellow warning with retry
- Loading state: Spinner in submit button

**Post-login redirect:** `returnUrl` query param or `/` (dashboard)

---

## 4. API Client

### 4.1 Strategy: Fetch Wrapper (NOT Eden Treaty)

**Decision:** Use a typed fetch wrapper instead of Eden Treaty.

**Rationale:**
- Elysia Eden Treaty requires importing server types into the client, creating tight coupling
- A fetch wrapper is simpler, more portable, and doesn't require build-time type sharing
- TanStack Query handles caching, retries, and state management
- We can add type safety with shared TypeScript interfaces

**File:** `client/src/api/client.ts`

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // Send cookies for session
  })

  if (!response.ok) {
    if (response.status === 401) {
      // Redirect to login
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }
    const error = await response.json().catch(() => ({ message: 'Network error' }))
    throw new ApiError(response.status, error.message || error.code || 'Unknown error')
  }

  return response.json()
}
```

### 4.2 API Modules (per feature)

**File structure:**
```
client/src/api/
├── client.ts          # Base fetch wrapper + error classes
├── auth.ts            # login, logout, getCurrentUser
├── cycles.ts          # listCycles, getCycle, createCycle, etc.
├── units.ts           # listUnits, getUnit, etc.
├── plasmas.ts         # listPlasmas, getPlasma, etc.
├── recordings.ts      # listRecordings, createRecording, etc.
├── feed.ts            # listFeedProducts, getStock, etc.
├── reporting.ts       # getStockResume, getPerformance, etc.
└── rbac.ts            # listRoles, listPermissions, etc.
```

### 4.3 Custom Hooks Pattern

**File:** `client/src/hooks/`

Each API module gets a corresponding hook:

```typescript
// client/src/hooks/useCycles.ts
export function useActiveCycles(tenantId: number) {
  return useQuery({
    queryKey: ['cycles', 'active', tenantId],
    queryFn: () => apiClient<CycleListResponse>(
      `/cycles?status=active&tenantId=${tenantId}`
    ),
    staleTime: 60_000,
  })
}
```

**Mutation pattern:**
```typescript
export function useCreateCycle() {
  return useMutation({
    mutationFn: (data: CreateCycleInput) =>
      apiClient('/cycles', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] })
    },
  })
}
```

---

## 5. Dashboard

### 5.1 KPI Cards

**File:** `client/src/pages/Dashboard.tsx`

**4 KPI cards in a responsive grid:**

| KPI | Icon | Color | Data Source |
|-----|------|-------|-------------|
| Active Cycles | `AutorenewIcon` | Primary (green) | `GET /api/cycles?status=active` → count |
| Avg FCR | `TrendingDownIcon` | Info (blue) | `GET /api/reporting/performance` → avg fcr |
| Avg IP | `SpeedIcon` | Success (green) | `GET /api/reporting/performance` → calculated |
| Low Stock Alerts | `WarningIcon` | Warning (orange) | `GET /api/feed/stock` → items below threshold |

**Card design:**
```
┌─────────────────────────┐
│  [Icon]                 │
│  12                     │  ← Large number (h3)
│  Active Cycles          │  ← Label (body2, text.secondary)
│  ▲ 2 from last week     │  ← Trend indicator (optional)
└─────────────────────────┘
```

**Grid:** `xs={12} sm={6} md={3}` — 1 column mobile, 2 tablet, 4 desktop.

### 5.2 Quick Navigation

Below KPI cards, show recent items:
- **5 Recent Cycles** — name, status chip, FCR, age
- **5 Low Stock Alerts** — product name, current stock, unit name

**Component:** `<DataGrid>` with 5 rows, no pagination.

---

## 6. Routing

### 6.1 Route Structure

```typescript
// client/src/router.tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route element={<RequireAuth><Layout /></RequireAuth>}>
    <Route path="/" element={<DashboardPage />} />
    <Route path="/units" element={<UnitsPage />} />
    <Route path="/units/:id" element={<UnitDetailPage />} />
    <Route path="/plasmas" element={<PlasmasPage />} />
    <Route path="/plasmas/:id" element={<PlasmaDetailPage />} />
    <Route path="/cycles" element={<CyclesPage />} />
    <Route path="/cycles/:id" element={<CycleDetailPage />} />
    <Route path="/recordings" element={<RecordingsPage />} />
    <Route path="/feed" element={<FeedPage />} />
    <Route path="/reports" element={<ReportsPage />} />
    <Route path="/rbac" element={<RBACPage />} />
    <Route path="/users" element={<UsersPage />} />
  </Route>
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

**Note:** Phase 8 implements only: Login, Layout, Dashboard, and routing shell. Detailed pages come in Phase 9.

### 6.2 Route Guards

- All routes under `<RequireAuth>` require authentication
- Permission-based guards added per route in Phase 9
- `/login` is the only public route

---

## 7. File Structure

```
client/src/
├── main.tsx                    # Entry point (update provider stack)
├── App.tsx                     # Route definitions
├── api/
│   ├── client.ts               # Fetch wrapper, error classes
│   ├── auth.ts                 # login, logout, getCurrentUser
│   ├── cycles.ts               # Cycle API calls
│   ├── reporting.ts            # Stock resume + performance API
│   └── rbac.ts                 # Permissions API
├── components/
│   ├── layout/
│   │   ├── Layout.tsx          # Sidebar + Navbar + Footer + Outlet
│   │   ├── Sidebar.tsx         # Collapsible navigation
│   │   ├── Navbar.tsx          # Top bar with breadcrumbs, user menu
│   │   └── Footer.tsx          # App version, copyright, status
│   ├── RequireAuth.tsx         # Auth guard component
│   └── dashboard/
│       └── KpiCard.tsx         # Reusable KPI card component
├── contexts/
│   └── AuthContext.tsx          # Auth state provider
├── hooks/
│   ├── useAuth.ts              # Auth hook (re-export from context)
│   ├── useActiveCycles.ts      # Active cycles query
│   └── useKpiData.ts           # Dashboard KPI data
├── pages/
│   ├── Login.tsx                # Login form page
│   ├── Dashboard.tsx            # Dashboard with KPI cards
│   └── NotFound.tsx             # 404 page
├── theme/
│   └── index.ts                 # (existing, may need additions)
└── types/
    └── index.ts                 # Shared TypeScript interfaces
```

---

## 8. Provider Stack

```typescript
// main.tsx provider order (outermost to innermost)
<StrictMode>
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={sakhaTheme}>
        <CssBaseline />
        <AuthProvider>
          <App />  {/* Contains <Routes> */}
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </BrowserRouter>
</StrictMode>
```

**Order rationale:**
1. `StrictMode` — dev checks
2. `BrowserRouter` — routing must be outermost
3. `QueryClientProvider` — data fetching, needs to be inside router for route-based queries
4. `ThemeProvider` — MUI theme, wraps all UI
5. `CssBaseline` — MUI reset
6. `AuthProvider` — auth state, needs access to QueryClient for login mutation

---

## 9. Implementation Waves

### Wave 1: Foundation (Layout + Auth + Routing Shell)
1. Update `theme/index.ts` with additional component overrides
2. Create `api/client.ts` fetch wrapper
3. Create `contexts/AuthContext.tsx`
4. Create `components/RequireAuth.tsx`
5. Create layout components (`Layout`, `Sidebar`, `Navbar`, `Footer`)
6. Create `pages/Login.tsx`
7. Update `App.tsx` with route structure
8. Update `main.tsx` with provider stack

### Wave 2: Dashboard + KPI Cards
1. Create `api/auth.ts`, `api/cycles.ts`, `api/reporting.ts`
2. Create `hooks/useAuth.ts`, `hooks/useActiveCycles.ts`, `hooks/useKpiData.ts`
3. Create `components/dashboard/KpiCard.tsx`
4. Create `pages/Dashboard.tsx` with 4 KPI cards
5. Create `pages/NotFound.tsx`

---

## 10. Success Criteria (Verifiable)

| Criterion | How to Verify |
|-----------|--------------|
| Sidebar collapses/expands | Click toggle button, drawer animates smoothly |
| Menu items reflect user role | Login as different roles, verify menu visibility |
| Navbar shows breadcrumbs | Navigate to `/units/1`, breadcrumb shows `Units > Unit 1` |
| Footer sticks to bottom | On short pages, footer remains at viewport bottom |
| Login form works | Enter credentials, redirected to dashboard |
| Protected routes enforce auth | Visit `/` while logged out → redirects to `/login` |
| Dashboard shows KPI cards | 4 cards render with data from API |
| All pages load < 2s | Lighthouse performance ≥ 80 |
| Responsive layout works | Test on 375px, 768px, 1440px viewports |

---

## 11. Out of Scope (Phase 9)

- Detailed page implementations (Units, Plasmas, Cycles, etc.)
- DataGrid tables for list views
- Chart components (BW curve, FCR trend)
- RBAC Manager UI
- User Management UI
- CSV/Excel export buttons
- Notification system
- Tenant switcher (backend multi-tenant)