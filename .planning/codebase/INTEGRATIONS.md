# External Integrations

**Analysis Date:** 2026-04-17

## Architecture Overview

The application follows a client-server architecture:
- **Server**: Elysia (Bun) - REST API at `/api/*`
- **Client**: React 19 + Vite - Single Page Application
- **Database**: MySQL with Drizzle ORM
- **Cache/Sessions**: Redis (configured, sessions via MySQL adapter)

## Server-Client Communication

### REST API

The server exposes REST endpoints via Elysia controllers:

| Controller | Routes | Purpose |
|------------|--------|---------|
| `authController` | `/auth/*` | Login, logout, password management |
| `usersController` | `/users/*` | User CRUD operations |
| `rbacController` | `/rbac/*` | RBAC management (roles, permissions) |
| `plasmaController` | `/plasma/*` | Plasma batch management |
| `unitController` | `/units/*` | Farm unit management |
| `cycleController` | `/cycles/*` | Production cycle management |
| `recordingsController` | `/recordings/*` | Daily recording entries |

**API Location**: `server/src/modules/*/`

### Authentication Flow

1. Client sends credentials to `/api/auth/login`
2. Server validates credentials via `auth.service.ts`
3. Lucia creates session, returns session cookie (`auth_session`)
4. Session plugin (`plugins/session.ts`) validates on each request
5. User object is available in request context via `ctx.user`

**Session Cookie**: HTTP-only, secure, same-site strict

### Client State Management

- **React Query** (`@tanstack/react-query`) - Server state, caching
- **React Router** - Client-side routing
- **MUI Theme** - Theming via `client/src/theme/index.ts`

## Database Schema Relationships

### Core Entities

```
tenants (1) ─────< users
roles (1) ───────< users
tenants (1) ─────< roles
permissions (1) ─< role_permissions
roles (1) ───────< role_permissions
tenants (1) ─────< units
tenants (1) ─────< cycles
units (1) ───────< cycles
cycles (1) ─────< daily_recordings
cycles (1) ─────< feed_movements
feed_products (1) < feed_stock
feed_products (1) < feed_movements
```

### Key Tables

| Schema File | Table | Purpose |
|-------------|-------|---------|
| `db/schema/tenants.ts` | tenants | Multi-tenant isolation |
| `db/schema/users.ts` | users | Authenticated users |
| `db/schema/roles.ts` | roles | Permission groups |
| `db/schema/permissions.ts` | permissions | Individual permissions |
| `db/schema/role_permissions.ts` | role_permissions | Role-permission mappings |
| `db/schema/sessions.ts` | sessions | Lucia session storage |
| `db/schema/units.ts` | units | Farm units |
| `db/schema/cycles.ts` | cycles | Production cycles |
| `db/schema/daily_recordings.ts` | daily_recordings | Daily data entries |
| `db/schema/feed_products.ts` | feed_products | Feed inventory |
| `db/schema/feed_stock.ts` | feed_stock | Feed stock levels |
| `db/schema/plasmas.ts` | plasmas | Plasma batch tracking |
| `db/schema/audit_logs.ts` | audit_logs | Audit trail |

**Database Config**: `server/src/config/database.ts`

## Multi-Tenancy (Tenant Plugin)

**Location**: `server/src/plugins/tenant.ts`

**Implementation**:
- Extracts `X-Tenant-ID` header from requests
- Validates tenant exists and is active
- Super admins bypass tenant check
- Returns `tenantId` in request context

**Usage**:
```typescript
// In route handlers
const tenantId = ctx.tenantId
```

## RBAC (RBAC Plugin)

**Location**: `server/src/plugins/rbac.ts`

**Implementation**:
- `requirePermission(permissionName)` middleware
- Checks user role against `role_permissions` table
- Super admin role bypasses all checks

**Usage**:
```typescript
// In route definition
.post('/resource', requirePermission('resource:create'), handler)
```

## Session Management (Session Plugin)

**Location**: `server/src/plugins/session.ts`

**Implementation**:
- Reads `auth_session` cookie
- Validates session via Lucia
- Handles session refresh (fresh flag)
- Clears invalid sessions

**User Context**:
```typescript
ctx.user: {
  id: string
  email: string
  name: string
  roleId: number
  tenantId: number
  isActive: number
  // ... other attributes
}
```

## Security Components

### Rate Limiting

**Location**: `server/src/plugins/rate-limit.ts`

### Security Headers

**Location**: `server/src/index.ts`

Middleware sets:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy`
- `Permissions-Policy`
- `Strict-Transport-Security`

### CSRF Protection

**Location**: `server/src/index.ts` (onBeforeHandle)

Verifies request origin for non-GET requests.

## Configuration

**Environment Config**: `server/src/config/env.ts`
**Redis Config**: `server/src/config/redis.ts`
**Database Config**: `server/src/config/database.ts`

---

*Integration audit: 2026-04-17*