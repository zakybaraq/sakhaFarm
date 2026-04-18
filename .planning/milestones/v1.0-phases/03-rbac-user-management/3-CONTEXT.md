# 3-CONTEXT.md — Phase 3: RBAC Manager & User Management

## Prior Context Applied
- PROJECT.md: Tech stack, code quality standards (JSDoc on every export, no `as any`, max 30 lines/function)
- REQUIREMENTS.md: FR-12 (RBAC Manager), FR-13 (User Management), FR-14 (Session & Cookie)
- ROADMAP.md: Phase 3 = RBAC Manager + User Management (backend API only, frontend deferred to Phase 7-8)
- STATE.md: Lucia Auth v3 working, session/tenant/RBAC middleware complete, security headers, rate limiting
- Phase 2 UAT: 12/12 tests pass, all auth endpoints functional

## Decisions Made (This Phase)

### D-09: Backend Only (No Frontend)
- **Decision**: Phase 3 builds backend API only — no React/MUI frontend
- **Rationale**: Frontend UI deferred to Phase 7-8 when full React dashboard is built. Keeps Phase 3 focused and fast.
- **Impact**: Phase 3 delivers REST API endpoints for RBAC and User Management. Frontend testing via curl/Postman.

### D-10: Auto-Seed Permissions from Code
- **Decision**: Define permissions as constants in code, auto-seed on migration/seed
- **Rationale**: Ensures permissions always exist and match code. No manual setup needed.
- **Impact**: Seed script will insert all default permissions. Permissions table is append-only (no delete).

### D-11: Simple CSV Import
- **Decision**: Standard CSV format: `name,email,role,tenant` — one row per user
- **Rationale**: Simple parsing, no complex mapping. Good enough for Phase 3.
- **Impact**: CSV parser reads name, email, role name, tenant name. Auto-generates password, sets force_password_change=1.

## Locked Decisions (From Prior Context — Do NOT Re-Ask)

### RBAC Architecture
- Permission format: `resource.action` (e.g., `unit.create`, `feed.read`, `recording.write`)
- Permission categories: unit, plasma, cycle, recording, feed, inventory, user, rbac, audit
- Actions per permission: allow, deny, read
- Super Admin (roleId=1) bypasses all permission checks
- Deny by default (whitelist approach)
- Role-Permission lookup via `role_permissions` table (roleId, permissionId, action)

### User Management
- Users table: id (varchar 16), email, name, passwordHash, roleId, tenantId, isActive, isLocked, forcePasswordChange
- Password rules: min 8 chars, 1 upper, 1 lower, 1 number, 1 special
- Password reset: invalidates all existing sessions, sets forcePasswordChange=1
- User status: Active (isActive=1), Inactive (isActive=0), Locked (isLocked=1)
- Email uniqueness enforced at DB level

### Auth Flow (Phase 2)
- Lucia Auth v3 with MySQL adapter + Argon2 hashing
- Session cookie: httpOnly, SameSite=Strict, auto-refresh
- CSRF protection via Origin/Host verification
- Rate limiting: login 5/min, API 100/min, heavy 10/min
- Brute-force: lock after 5 failed attempts (Redis + DB tracking)

### Code Quality
- JSDoc on every exported function/class
- Max 30 lines per function
- NO `as any`, NO `@ts-ignore`, NO `@ts-expect-error`
- Custom error classes: `NotFoundError`, `ValidationError`, `UnauthorizedError`
- Descriptive naming, no abbreviations

## Default Permissions (Auto-Seeded)

### Unit Module
- `unit.create`, `unit.read`, `unit.update`, `unit.delete`

### Plasma Module
- `plasma.create`, `plasma.read`, `plasma.update`, `plasma.delete`

### Cycle Module
- `cycle.create`, `cycle.read`, `cycle.update`, `cycle.delete`, `cycle.complete`

### Recording Module
- `recording.create`, `recording.read`, `recording.update`, `recording.delete`

### Feed Module
- `feed.create`, `feed.read`, `feed.update`, `feed.delete`, `feed.move`

### Inventory Module
- `inventory.read`, `inventory.export`

### User Module
- `user.create`, `user.read`, `user.update`, `user.delete`, `user.reset_password`

### RBAC Module
- `rbac.create`, `rbac.read`, `rbac.update`, `rbac.delete`

### Audit Module
- `audit.read`

## Gray Areas Resolved
| Question | Decision |
|----------|----------|
| Frontend included? | No — backend API only |
| Permission seeding? | Auto-seed from code constants |
| CSV import format? | Simple: name, email, role, tenant |

## Deferred Ideas (Not This Phase)
- Frontend RBAC UI (permission matrix, DataGrid) → Phase 8
- Frontend User Management UI → Phase 8
- Advanced CSV mapping (custom columns) → v1.1
- Permission caching (Redis) → Phase 9 (if needed)
- Audit log viewer UI → Phase 8

## Next Steps
1. Run `/gsd-plan-phase 3` to create detailed execution plan
2. Planner will use this CONTEXT.md to know all decisions are locked
