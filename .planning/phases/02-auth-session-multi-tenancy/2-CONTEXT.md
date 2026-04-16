# 2-CONTEXT.md — Phase 2: Authentication, Session & Multi-Tenancy

## Prior Context Applied
- PROJECT.md: Tech stack (Bun, Elysia, Drizzle, MySQL, Redis, React+Vite), code quality standards
- REQUIREMENTS.md: FR-2 (Auth), FR-12 (RBAC Manager), FR-13 (User Management), FR-14 (Session & Cookie)
- ROADMAP.md: Phase 2 = JWT auth, Redis sessions, CSRF, RBAC middleware, tenant isolation, security headers, brute-force protection
- STATE.md: Session = Redis-backed, httpOnly + Secure + SameSite=Strict, CSRF double-submit, bcrypt(12)
- Phase 1 UAT: Server working, DB schema pushed, seed done, client working

## Decisions Made (This Phase)

### D-06: Auth Library — Lucia Auth (NOT JWT)
- **Decision**: Use Lucia Auth with Redis adapter instead of `@elysiajs/jwt`
- **Rationale**: `@elysiajs/session` doesn't exist on npm. Lucia Auth is the modern standard for Elysia/Hono/Bun apps. Built-in session management, type-safe, httpOnly cookies.
- **Impact**: 
  - Lucia handles session creation/destruction (no manual JWT management)
  - Lucia's Redis adapter stores sessions in Redis (already running)
  - Lucia creates httpOnly cookies automatically
  - Password hashing via Lucia's built-in hashing (or bcrypt)

### D-07: Tenant Identification — Header-Based
- **Decision**: Use `X-Tenant-ID` header for tenant identification
- **Rationale**: Simpler for development, works with Postman/curl, no DNS setup needed
- **Impact**: Middleware extracts `X-Tenant-ID` from request headers, validates against tenants table, attaches tenant_id to request context

### D-08: Password Reset — Admin-Only
- **Decision**: Superadmin resets password, generates temporary password
- **Rationale**: No email service needed for Phase 2, simpler implementation
- **Impact**: 
  - Password reset endpoint requires Super Admin role
  - Generates random temporary password
  - Sets `force_password_change = 1` flag
  - Invalidates all existing sessions for that user

## Locked Decisions (From Prior Context — Do NOT Re-Ask)

### Auth Flow
- Login: email + password → Lucia validates → creates Redis session → sets httpOnly cookie
- Logout: Lucia invalidates session → clears cookie
- Session: Redis-backed, auto-refresh on activity
- CSRF: double-submit cookie pattern
- Rate limiting: login 5/min, API 100/min, heavy ops 10/min (Redis counter)
- Brute-force: lock account after 5 failed attempts (Redis counter + `is_locked` flag)

### Security Headers
- CSP: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'`
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- HSTS: max-age=31536000
- Referrer-Policy: strict-origin-when-cross-origin

### Password Rules
- Min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
- bcrypt cost=12 (or Lucia's built-in hashing)
- Force password change on first login

### RBAC Middleware
- Permission check before route execution
- Format: `resource.action` (e.g., `flock.create`, `feed.read`)
- Role → permissions lookup via `role_permissions` table
- Deny by default (whitelist approach)

### Multi-Tenancy
- `tenant_id` on every tenant-scoped table
- Middleware validates `X-Tenant-ID` header against tenants table
- Row-level filtering: all queries include `WHERE tenant_id = ?`
- Super Admin can access all tenants (bypass filter)

## Gray Areas Resolved
| Question | Decision |
|----------|----------|
| Auth library? | Lucia Auth + Redis adapter |
| Tenant ID? | Header-based (`X-Tenant-ID`) |
| Password reset? | Admin-only (no email) |

## Deferred Ideas (Not This Phase)
- Self-service password reset with email → v1.2
- Subdomain-based tenant identification → v1.4
- OAuth/SSO integration → v2.0
- 2FA/MFA → v1.3

## Next Steps
1. Run `/gsd-plan-phase 2` to create detailed execution plan
2. Planner will use this CONTEXT.md to know all decisions are locked
