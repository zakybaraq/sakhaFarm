# 2-PLAN.md — Phase 2: Authentication, Session & Multi-Tenancy

## Phase Goal
Implement Lucia Auth with Redis session adapter, header-based tenant identification, RBAC middleware, rate limiting, security headers, and brute-force protection.

## Key Decisions (From CONTEXT.md)
- **D-06**: Lucia Auth (NOT JWT) with Redis session adapter
- **D-07**: Header-based tenant identification (`X-Tenant-ID`)
- **D-08**: Admin-only password reset (no email service)
- **@elysiajs/lucia-auth is EXPERIMENTAL — DO NOT USE** (use manual integration)
- **Lucia v3 removed Drizzle adapter** — use `@lucia-auth/adapter-mysql` with shared pool
- **CSRF protection mandatory** for non-GET requests

## Wave 1: Lucia Auth Setup & Auth Endpoints
### 1.1 Install Lucia Auth packages
```bash
cd server
bun add lucia oslo
bun add @lucia-auth/adapter-mysql
bun add @lucia-auth/adapter-session-redis
```

### 1.2 Create auth schema tables
New Drizzle schema files:
- `server/src/db/schema/auth-users.ts` — Lucia user table (id, email, name, hashed_password, password_salt, is_active, is_locked, force_password_change, failed_login_attempts, last_login_at, role_id, tenant_id, created_at, updated_at)
- `server/src/db/schema/auth-keys.ts` — Lucia key table (id, user_id, hashed_password)

**Note**: Reuse existing `users.ts` schema — adapt it to Lucia's requirements:
- `id` must be `varchar(15)` (Lucia generates IDs)
- Add `hashed_password` and `password_salt` columns
- Keep `role_id`, `tenant_id`, `is_active`, `is_locked`, `force_password_change`, `failed_login_attempts`, `last_login_at`

### 1.3 Create Lucia instance (`server/src/auth/lucia.ts`)
```typescript
import { lucia } from "lucia"
import { elysia } from "lucia/middleware"
import { mysql2 } from "@lucia-auth/adapter-mysql"
import { redis } from "@lucia-auth/adapter-session-redis"
import { pool } from "../config/database"
import { redisClient } from "../config/redis"

export const auth = lucia({
  adapter: {
    user: mysql2(pool, {
      user: "users",
      key: "auth_keys",
    }),
    session: redis(redisClient),
  },
  env: process.env.NODE_ENV === "production" ? "PROD" : "DEV",
  middleware: elysia(),
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      httpOnly: true,
    },
  },
  getUserAttributes: (attributes) => ({
    email: attributes.email,
    name: attributes.name,
    roleId: attributes.role_id,
    tenantId: attributes.tenant_id,
    isLocked: attributes.is_locked,
    forcePasswordChange: attributes.force_password_change,
  }),
})

declare module "lucia" {
  interface Register {
    Lucia: typeof auth
    DatabaseUserAttributes: {
      email: string
      name: string
      role_id: number
      tenant_id: number
      is_locked: number
      force_password_change: number
    }
  }
}
```

### 1.4 Create auth service (`server/src/modules/auth/auth.service.ts`)
- `register(email, password, name, roleId, tenantId)` — creates user with Lucia
- `login(email, password)` — validates credentials, creates session
- `logout(sessionId)` — invalidates session
- `validateSession(sessionId)` — returns user + session
- Password validation: min 8 chars, 1 upper, 1 lower, 1 number, 1 special

### 1.5 Create auth controller (`server/src/modules/auth/auth.controller.ts`)
- `POST /api/auth/register` — register new user (Super Admin only)
- `POST /api/auth/login` — login with email + password
- `POST /api/auth/logout` — logout (authenticated)
- `GET /api/auth/me` — get current user profile

### 1.6 Update seed script
- Modify seed to use Lucia's user creation pattern
- Hash password via Lucia's key system

## Wave 2: Middleware (Session, Tenant, RBAC)
### 2.1 Session middleware (`server/src/plugins/session.ts`)
- Validate session cookie on every request
- Auto-refresh session if fresh
- Set blank cookie if session expired
- Attach `user` and `session` to request context
- CSRF protection: verify Origin/Host for non-GET requests

### 2.2 Tenant middleware (`server/src/plugins/tenant.ts`)
- Extract `X-Tenant-ID` from request headers
- Validate tenant exists and is active
- Attach `tenantId` to request context
- Super Admin bypass: can access any tenant
- Row-level filtering: all queries include `WHERE tenant_id = ?`

### 2.3 RBAC middleware (`server/src/plugins/rbac.ts`)
- Permission check before route execution
- Format: `resource.action` (e.g., `flock.create`, `feed.read`)
- Lookup: user → role → permissions via `role_permissions` table
- Deny by default (whitelist approach)
- Usage: `.guard({ resolve: requirePermission('flock.create') })`

## Wave 3: Security Hardening
### 3.1 Rate limiting plugin (`server/src/plugins/rate-limit.ts`)
- Redis-based rate limiting
- Login: 5 requests/minute per IP
- API: 100 requests/minute per IP
- Heavy ops: 10 requests/minute per IP
- Return 429 Too Many Requests when exceeded

### 3.2 Brute-force protection (`server/src/modules/auth/auth.service.ts`)
- Track failed login attempts per user (Redis counter)
- Lock account after 5 failed attempts
- Set `is_locked = 1` in users table
- Auto-unlock after 15 minutes (Redis TTL)
- Reset counter on successful login

### 3.3 Security headers plugin (`server/src/plugins/security-headers.ts`)
- CSP: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'`
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- HSTS: max-age=31536000
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

### 3.4 Password service (`server/src/lib/password.ts`)
- Password validation rules (min 8, 1 upper, 1 lower, 1 number, 1 special)
- Password strength checker
- Temporary password generator (for admin reset)

## Wave 4: Profile & Session Management
### 4.1 Profile endpoint (`server/src/modules/auth/auth.controller.ts`)
- `GET /api/auth/profile` — get current user profile with role + tenant info
- `PUT /api/auth/profile` — update name, email (not role/tenant)
- `POST /api/auth/change-password` — change password (requires current password)
- `POST /api/auth/reset-password` — admin-only password reset (generates temp password)

### 4.2 Session management
- `GET /api/auth/sessions` — list active sessions for current user
- `DELETE /api/auth/sessions/:id` — revoke specific session
- `DELETE /api/auth/sessions` — revoke all other sessions

### 4.3 Force password change
- On login, if `force_password_change = 1`, return flag in response
- Frontend redirects to change-password page
- After password change, set `force_password_change = 0`

## Wave 5: Verification
### 5.1 Register test
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!","name":"Test User","roleId":1,"tenantId":1}'
```

### 5.2 Login test
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sakhafarm.local","password":"changeme123"}' \
  -v
# Should return Set-Cookie header with httpOnly session cookie
```

### 5.3 Protected route test
```bash
curl http://localhost:3000/api/auth/me
# Without cookie: 401 Unauthorized
# With cookie: 200 OK with user profile
```

### 5.4 Tenant isolation test
```bash
curl http://localhost:3000/api/auth/me \
  -H "X-Tenant-ID: 1"
# Should return user data for tenant 1 only
```

### 5.5 Rate limiting test
```bash
# Send 6 login requests in 1 minute
# 6th request should return 429 Too Many Requests
```

### 5.6 Security headers test
```bash
curl -I http://localhost:3000/api/health
# Should include: CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy
```

## Dependencies
- Phase 1 (complete): Database schema, seed, Docker, server scaffold
- Lucia Auth packages installed
- Redis running (from Phase 1)

## Estimated Effort
- Wave 1: 45 min (Lucia setup, auth endpoints)
- Wave 2: 30 min (3 middleware plugins)
- Wave 3: 25 min (rate limit, brute-force, security headers)
- Wave 4: 20 min (profile, session management)
- Wave 5: 15 min (verification tests)
- **Total: ~2.5 hours**
