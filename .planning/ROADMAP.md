# ROADMAP.md — Sakha Farm Management System

## Milestone: v1.0 — Core Farm Management

### Phase 1: Project Setup & Database Schema
**Goal**: Initialize monorepo structure, configure Elysia + Drizzle + MySQL + Redis + Vitest, create complete database schema with migrations.
**Plans:** 4 plans
**Deliverables**:
- Monorepo scaffold: `server/` (Elysia) + `client/` (React + Vite)
- Server: tsconfig, Elysia setup, Drizzle MySQL connection pool, Redis client, Vitest config
- Client: Vite + React 18 + React Router + TanStack Query + MUI setup, Vitest config
- Environment validation (zod) for both server and client
- Complete Drizzle schema: tenants, users, roles, permissions, role_permissions, units, plasmas, cycles, daily_recordings, feed_products, feed_stock, feed_movements, standards, audit_logs, sessions
- Migration files generated and tested
- Seed script for initial data (default roles, sample tenant, standards for CP/Cobb/Ross)
- Vitest configured with test coverage reporting
**Success Criteria**:
- `bun run dev` starts both server (port 3000) and client (port 5173)
- `bun run db:migrate` runs without errors
- All 16+ tables created with correct constraints, indexes, foreign keys
- `bun run test` runs Vitest with 0 failures (empty test suite passes)
**Depends on**: None

Plans:
- [ ] 02-01-PLAN.md — Lucia Auth setup, user/session schema, register/login/logout endpoints
- [ ] 02-02-PLAN.md — Session, tenant, and RBAC middleware
- [ ] 02-03-PLAN.md — Rate limiting, brute-force protection, security headers
- [ ] 02-04-PLAN.md — Profile endpoint, password change, session invalidation, force-password-change

### Phase 2: Authentication, Session & Multi-Tenancy
**Goal**: Implement JWT authentication with Redis-backed sessions, cookie security, RBAC middleware, and tenant isolation.
**Deliverables**:
- User registration/login endpoints with bcrypt (cost=12)
- JWT token generation & validation via `@elysiajs/jwt`
- **Redis-backed sessions**: `@elysiajs/session` with Redis store, httpOnly + Secure + SameSite=Strict cookies
- Session lifecycle: creation on login, invalidation on logout/password-change/role-change
- CSRF protection: double-submit cookie pattern
- RBAC middleware (checks permission before route execution)
- Tenant identification middleware (subdomain or header)
- Row-level tenant filtering on all queries
- Password complexity validation, brute-force protection (Redis counter)
- Security headers plugin: CSP, X-Frame-Options, X-Content-Type-Options, HSTS
- Default roles seed: Super Admin, Admin Unit, Admin Plasma, Viewer
**Success Criteria**:
- Login creates Redis session + sets httpOnly cookie
- Session persists across requests, auto-refreshes on activity
- Logout destroys Redis session + clears cookie
- Protected routes reject unauthenticated requests (401)
- Tenant A cannot query Tenant B's data
- Rate limiting blocks > 5 failed login attempts per minute
- All security headers present in response
**Depends on**: Phase 1

### Phase 3: RBAC Manager & User Management
**Goal**: Build complete RBAC management system (roles, permissions CRUD) and user management module for superadmin.
**Plans:** 3 plans
**Deliverables**:
- **Backend — RBAC Manager**:
  - Role CRUD endpoints: create, list, get, update, soft-delete roles
  - Permission CRUD endpoints: define permissions per resource/action
  - Role-Permission assignment: assign/deny permissions to roles
  - Permission categories: flock, feed, recording, inventory, user, rbac, audit
  - Validation: cannot delete role with active users, cannot delete default roles
  - Audit logging on all RBAC changes
- **Backend — User Management**:
  - User CRUD endpoints (superadmin only): create, list, get, update, deactivate/activate
  - User creation with auto-generated or manual password
  - Password reset endpoint (superadmin can reset any user's password)
  - Force password change on first login flag
  - User status management: Active, Inactive, Locked
  - User search & filter: by name, email, role, tenant, status
  - Bulk user import from CSV
  - Email uniqueness validation, password complexity enforcement
- **Frontend — RBAC Manager UI**:
  - Roles list page with MUI DataGrid (role name, user count, permissions count)
  - Role form (create/edit): name, description, permission matrix (checkbox grid)
  - Permission management page: view all permissions by category
  - Role detail page: assigned users, assigned permissions, edit button
- **Frontend — User Management UI**:
  - Users list page with MUI DataGrid (name, email, role, tenant, status, last login)
  - User creation form: name, email, password (auto/manual), role dropdown, tenant dropdown
  - User edit form: update role, tenant, status, reset password
  - User detail page: profile info, session list, audit log
  - Bulk import dialog with CSV upload
**Success Criteria**:
- Superadmin can create custom roles with specific permissions
- Permission changes take effect immediately (no re-login required)
- Cannot delete role that has active users
- Password reset invalidates all existing sessions for that user
- RBAC UI permission matrix is intuitive (resource × action grid)
- All RBAC mutations logged in audit_logs with actor info
- Junior developer can understand the permission check flow by reading code
**Depends on**: Phase 2

Plans:
- [x] 03-01-PLAN.md — RBAC Manager: role CRUD, permission CRUD, role-permission assignment with audit logging ✅
- [ ] 03-02-PLAN.md — User Management: user CRUD, password reset, search/filter, CSV bulk import
- [ ] 03-03-PLAN.md — Wiring: seed default permissions/roles, register routes in server entry point

### Phase 4: Unit, Plasma & Cycle CRUD
**Goal**: Complete CRUD for organizational hierarchy: Unit → Plasma → Cycle.
**Deliverables**:
- Unit CRUD endpoints (create, list, get, update, soft-delete)
- Plasma CRUD endpoints (with unit assignment, capacity tracking)
- Cycle CRUD endpoints (Chick-In, DOC type selection, initial population)
- Cycle status transitions: Active → Completed/Failed
- Validation: cannot create cycle for deleted unit/plasma
- Audit logging on all mutations
**Success Criteria**:
- Full CRUD cycle: create unit → create plasma → create cycle
- Cycle creation triggers Chick-In event (sets start_date, initial_population)
- Cannot delete unit with active cycles
- All mutations logged in audit_logs
**Depends on**: Phase 3

### Phase 5: Daily Recording & Standard Comparison
**Goal**: Implement daily recording input with automatic FCR, IP, SR calculations and BW deviation from standards.
**Deliverables**:
- Daily recording endpoint (date, dead, culled, remaining_population, body_weight)
- Auto-calculate: cumulative mortality, deplesi %, SR
- Standard comparison: fetch BW standard by DOC type + age → calculate deviation
- Auto-calculate running FCR (cumulative feed consumed / cumulative weight gain)
- IP calculation at cycle completion
- Validation: cannot record future dates, cannot record for completed cycles
- Bulk recording endpoint (import multiple days at once)
**Success Criteria**:
- Recording input returns calculated metrics alongside saved data
- BW deviation correctly shows positive/negative vs standard
- FCR updates cumulatively with each recording
- Recording for completed cycle rejected (400)
**Depends on**: Phase 4

### Phase 6: Feed Inventory Management
**Goal**: Implement feed stock tracking with Surat Jalan (in) and Recording consumption (out).
**Deliverables**:
- Feed product master CRUD (code, name, phase, default unit)
- Surat Jalan endpoint: feed delivery that increases plasma stock
- Feed consumption recording: deducts stock per feed type
- Stock calculation: opening + in - out = closing (in both Zak and Kg)
- Real-time stock query per plasma per feed type
- Low stock alert threshold
- Database transaction: stock update is atomic
- Audit logging on all stock movements
**Success Criteria**:
- Surat Jalan increases stock correctly
- Feed recording decreases stock correctly
- Stock query returns accurate Zak + Kg values
- Concurrent stock updates don't cause race conditions (transaction test)
- Negative stock prevented (validation error)
**Depends on**: Phase 4, Phase 5

### Phase 7: Inventory Resume & Reporting
**Goal**: Build aggregate reports for stock resume and daily performance across units.
**Deliverables**:
- Resume Stock endpoint: aggregate stock per feed type per unit (with plasma breakdown)
- Daily Performance Report: BW, FCR, deplesi per cycle per day
- Filter support: by unit, date range, feed type, DOC type
- Export endpoint: CSV/Excel format
- Redis caching for expensive aggregate queries
- Pagination for large result sets
**Success Criteria**:
- Resume stock query returns correct totals matching individual plasma stocks
- Performance report shows trend data (chart-ready format)
- Cached queries invalidate on stock/recording changes
- Export file opens correctly in Excel
**Depends on**: Phase 5, Phase 6

### Phase 8: Frontend — React Layout & Dashboard
**Goal**: Build the modern minimalist UI layout with separated Sidebar, Navbar, Footer components and core dashboard.
**Deliverables**:
- Vite + React 18 setup with React Router + TanStack Query
- MUI theme: custom minimalist design (neutral palette, green accent, subtle shadows)
- **Layout components** (separated):
  - `Sidebar.tsx` — Collapsible navigation, role-aware menu items, active state highlighting
  - `Navbar.tsx` — Top bar with breadcrumbs, user dropdown, tenant switcher, notification bell
  - `Footer.tsx` — App version, copyright, system status indicator
  - `Layout.tsx` — Composes all three + content outlet with responsive breakpoints
- Login page with clean minimalist form
- Dashboard: KPI cards (active cycles, avg FCR, avg IP, low stock alerts)
- Unit list → Plasma list → Cycle detail navigation
- Protected route wrapper with auth check
**Success Criteria**:
- Sidebar collapses/expands smoothly, menu items reflect user role
- Navbar shows correct breadcrumbs per route
- Footer sticks to bottom on short pages
- Dashboard loads with real KPI data from API
- All pages load < 2s
**Depends on**: Phase 7

### Phase 9: Frontend — Inventory & Reporting UI
**Goal**: Build inventory management and reporting interface with React components.
**Deliverables**:
- Surat Jalan form (feed delivery input) with MUI form components + validation
- Feed stock dashboard (per unit, per plasma) with MUI DataGrid
- Low stock alerts panel with color-coded severity
- Resume Stock report page with filters (MUI DatePicker, Select, Autocomplete)
- Daily Performance report page with charts (@mui/x-charts: BW curve, FCR trend)
- Export buttons (CSV/Excel) using xlsx library
- Audit log viewer (admin only) with searchable DataGrid
- Daily recording form with live FCR/IP/deviation calculations
- Standard comparison chart: Actual vs Standard BW overlay
- RBAC Manager pages (roles, permissions, users)
**Success Criteria**:
- Surat Jalan form updates stock in real-time via TanStack Query invalidation
- Resume report matches backend aggregate query
- Export produces valid Excel file
- Audit log shows all user actions with timestamps
- BW chart correctly overlays actual vs standard curve
- RBAC Manager UI is intuitive for superadmin
**Depends on**: Phase 8

### Phase 10: Testing, Cybersecurity Hardening & Documentation
**Goal**: Comprehensive Vitest test suite, security audit, rate limiting, and API documentation.
**Deliverables**:
- **Vitest Unit Tests**:
  - Calculation functions: FCR, IP, SR, deplesi, EPEF
  - Unit conversions: Zak ↔ Kg
  - Validation schemas (zod/Elysia t.Object)
- **Vitest Integration Tests**:
  - All API endpoints (CRUD, auth, session, RBAC, users)
  - Transaction tests (concurrent stock updates)
  - Multi-tenant isolation tests
  - Session lifecycle tests (create, persist, invalidate, expire)
  - RBAC permission enforcement tests
- **Cybersecurity Tests**:
  - SQL injection attempts (should be blocked by Drizzle)
  - XSS payload in input fields (should be sanitized)
  - CSRF attack simulation (double-submit cookie verification)
  - Rate limit bypass attempts (Redis counter enforcement)
  - Session fixation test (new session on login)
  - Cookie security verification (httpOnly, Secure, SameSite)
  - Privilege escalation tests (user accessing admin endpoints)
- **Security Hardening**:
  - CORS whitelist configuration
  - Request size limits (body-parser max 10MB)
  - Payload sanitization middleware
  - Password reset flow with token expiry
  - Account lockout after repeated failures
- **Documentation**:
  - API docs (OpenAPI/Swagger via Elysia Swagger plugin)
  - Deployment guide (Docker, environment setup)
  - Security checklist
  - Developer onboarding guide (code style, documentation standards)
- **Production Config**:
  - Dockerfile for server and client
  - docker-compose.yml (MySQL + Redis + app)
  - CI/CD pipeline (GitHub Actions)
**Success Criteria**:
- Test coverage > 80% (`bun run test --coverage`)
- All security tests pass (0 critical vulnerabilities)
- API docs accessible at `/docs`
- Rate limiting blocks > 100 req/min per IP
- Production Docker build starts without errors
- Lighthouse score > 90 (Performance, Accessibility, Best Practices)
**Depends on**: Phase 9

## Future Milestones (v1.1+)
- **v1.1**: CSV Import (feed types from Excel, bulk recording import)
- **v1.2**: Notification system (WhatsApp/Email alerts for low stock, high deplesi)
- **v1.3**: Billing & settlement (RHPP generation, farmer payment calculation)
- **v1.4**: Multi-language (ID/EN), advanced analytics, predictive FCR
