# Architecture

**Analysis Date:** 2026-04-17

## Pattern Overview

**Overall:** Modular Plugin-Based API Architecture with Layered Concerns

**Key Characteristics:**
- Elysia.js HTTP framework with plugin composition pattern
- Request flows through ordered middleware plugins before reaching route handlers
- Each module (auth, users, rbac, unit, plasma, cycle, recordings) follows identical MVC-like structure (controller, service, errors)
- Multi-tenant isolation enforced at plugin level with tenant derivation
- RBAC (Role-Based Access Control) enforced per-route via `beforeHandle` hooks

## Layers

**Plugin Layer:**
- Purpose: Cross-cutting concerns applied globally to all routes
- Location: `server/src/plugins/`
- Contains: Session management, tenant isolation, RBAC authorization, rate limiting, security headers
- Depends on: Lucia auth, database, Redis
- Used by: All controllers via `.use()` in `server/src/index.ts`

**Controller Layer:**
- Purpose: HTTP request/response handling, validation, authorization hooks
- Location: `server/src/modules/*/*.controller.ts`
- Contains: Route definitions, Elysia decorators, error mapping, request validation
- Depends on: Plugins, services
- Used by: Index composition

**Service Layer:**
- Purpose: Business logic, database operations, audit logging
- Location: `server/src/modules/*/*.service.ts`
- Contains: CRUD operations, tenant scoping queries, validation checks
- Depends on: Database config, Drizzle ORM, schema definitions
- Used by: Controllers

**Schema Layer:**
- Purpose: Database table definitions and types
- Location: `server/src/db/schema/`
- Contains: Drizzle table definitions, type exports
- Depends on: Drizzle ORM
- Used by: Services

## Request Flow

**Request Flow (Typical):**

1. **Ingress** → HTTP request enters `server/src/index.ts`
2. **Security Headers** → `onBeforeHandle` injects CSP, HSTS, X-Frame-Options headers
3. **CORS** → `@elysiajs/cors` validates origin
4. **CSRF Check** → `onBeforeHandle` verifies origin/host match for non-GET
5. **Session Derivation** → `sessionPlugin` validates Lucia session cookie, adds `user` to ctx
6. **Tenant Derivation** → `tenantPlugin` parses `X-Tenant-ID` header, validates tenant exists
7. **Rate Limiting** → `rateLimitPlugin` checks Redis for IP-based limits
8. **RBAC Check** → Route's `beforeHandle: requirePermission('...')` validates role permissions
9. **Controller Handler** → Executes controller logic with validated `user`, `tenantId`
10. **Service** → Performs database operations with tenant scoping
11. **Response** → JSON response returns to client

**Tenant Isolation Flow:**

1. Client sends `X-Tenant-ID` header with request
2. `tenantPlugin` derives tenant from header or Falls back to query param or store value
3. Super admin role (ID=1) bypasses tenant validation
4. For non-super-admin: validates tenant exists and is active
5. All queries in services include `eq(units.tenantId, tenantId)` filter
6. Prevents cross-tenant data access

**Authentication Flow:**

1. Client sends `auth_session` cookie from previous login
2. `sessionPlugin` calls `lucia.validateSession(sessionId)`
3. On valid session: user object added to context
4. On fresh session: new session cookie issued (rotation)
5. On invalid/expired: blank session cookie set, user = null
6. All protected routes check `ctx.user` before proceeding

## Data Flow

**Create Operation (e.g., POST /api/plasmas):**

1. Controller receives validated body from Elysia (type-checked via `t.Object`)
2. Extracts `tenantId` from context (plugin-validated)
3. Gets `userId` from session for audit trail
4. Calls `createPlasma(input, tenantId, userId)` service
5. Service verifies unit belongs to tenant (tenant isolation)
6. Service inserts to `plasmas` table
7. Service attempts async audit log (fire-and-forget)
8. Service returns created record
9. Controller returns `{ success: true, plasma }`

**List Operation (e.g., GET /api/plasmas):**

1. Controller receives optional `unitId` query param
2. Extracts validated `tenantId` from context
3. Calls `listPlasmas(tenantId, unitId)` service
4. Service builds WHERE clause with tenantId scoping
5. Service queries with JOIN to units table
6. Service filters `deletedAt IS NULL` (soft-delete awareness)
7. Service orders by `createdAt DESC`
8. Controller returns `{ plasmas: result }`

**State Management:**
- Sessions stored in MySQL via Lucia adapter (not Redis)
- Rate limit counts stored in Redis (keyed by IP + tier)
- Tenant context derived at request time (not stored in memory)
- User context derived from session at request time

## Key Abstractions

**Permission Guard:**
- Purpose: Gatekeeping access to routes based on role permissions
- Examples: `requirePermission('plasma.create')` in plasma routes
- Pattern: `beforeHandle` hook that queries `role_permissions` join table

**Tenant Guard:**
- Purpose: Ensure requests are scoped to a valid tenant
- Examples: `getTenantId()` helper in controllers
- Pattern: Extract from store/header, validate non-zero, return for queries

**Audit Logging:**
- Purpose: Track all mutations for compliance
- Examples: `db.insert(auditLogs).values({...})` in create/update/delete
- Pattern: Fire-and-forget try/catch (D-02 pattern mentioned in code)

**Error Classes:**
- Purpose: Structured error handling with codes
- Examples: `PlasmaNotFoundError`, `PlasmaHasActiveCyclesError`
- Pattern: Custom Error subclasses with `.onError()` mapping in controllers

## Entry Points

**Server Entry:**
- Location: `server/src/index.ts`
- Triggers: `bun run server/src/index.ts` or Docker container start
- Responsibilities: Compose all plugins and controllers, start HTTP server

**Database Configuration:**
- Location: `server/src/config/database.ts`
- Exports: `db` (Drizzle instance), `pool` (mysql2 pool)
- Responsibilities: Lazy connection pool, type-safe queries

**Auth Configuration:**
- Location: `server/src/auth/lucia.ts`
- Exports: `lucia` (Lucia instance)
- Responsibilities: Session management, user attribute mapping

## Error Handling

**Strategy:** Per-module custom error classes with centralized error mapping in controllers

**Patterns:**
- **Module Errors**: Define error classes in `*.errors.ts` (e.g., `PlasmaNotFoundError`)
- **Controller Mapping**: `.onError(({ error }) => {...})` checks instance and returns JSON with error code
- **Service Throws**: Services throw on business rule violations (not found, active cycles, duplicate code)
- **Client Receives**: `{ error: "message", code: "ERROR_CODE" }` JSON response

**Example from `plasma.controller.ts`:**
```typescript
.onError(({ error }) => {
  if (error instanceof PlasmaNotFoundError) {
    return { error: error.message, code: 'PLASMA_NOT_FOUND' }
  }
  if (error instanceof PlasmaHasActiveCyclesError) {
    return { error: error.message, code: 'PLASMA_HAS_ACTIVE_CYCLES' }
  }
})
```

**HTTP Status Mapping:**
- 400: Validation errors (Elysia auto-handles)
- 401: Authentication required (RBAC plugin sets)
- 403: Permission denied (RBAC plugin sets)
- 404: Not found errors (controller mapping)
- 409: Conflict errors (duplicate code, controller mapping)
- 429: Rate limiting (rate-limit plugin)

## Cross-Cutting Concerns

**Security Headers:** Inline in `index.ts` via `HEADERS` constant, applied in `onBeforeHandle`

**Rate Limiting:** Redis-based with tiers (login: 5/min, api: 100/min, heavy: 10/min)

**Tenant Isolation:** Query-level filtering via Drizzle WHERE clauses

**Audit Logging:** Fire-and-forget writes on mutations

**CSRF Protection:** Origin/Host header verification for non-GET requests

---

*Architecture analysis: 2026-04-17*