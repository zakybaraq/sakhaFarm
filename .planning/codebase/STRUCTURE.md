# Codebase Structure

**Analysis Date:** 2026-04-17

## Directory Layout

```
sakhaFarmLatest/
├── .planning/              # GSD planning artifacts
├── client/               # Frontend React + Vite application
├── server/               # Backend API (Elysia.js)
│   ├── src/
│   │   ├── auth/        # Authentication (Lucia config)
│   │   ├── config/      # Environment, database, Redis config
│   │   ├── db/
│   │   │   ├── schema/  # Drizzle table definitions
│   │   │   └── seed/   # Database seeding
│   │   ├── lib/         # Shared utilities (constants, password)
│   │   ├── modules/     # Feature modules (MVC-like)
│   │   └── plugins/     # Middleware plugins
│   ├── drizzle/       # Drizzle migrations
│   ├── vitest.config.ts
│   └── package.json
├── tests/               # Integration tests
│   ├── setup.ts        # Test setup
│   ├── unit/         # Unit tests
│   └── setup.test.ts
├── docker-compose.yml
├── Dockerfile.server
├── Dockerfile.client
├── package.json        # Root workspace (bun)
└── bun.lock
```

## Directory Purposes

**server/src/auth/**: Authentication configuration
- Purpose: Lucia v3 setup with MySQL adapter
- Key files: `lucia.ts` - Exports `lucia` instance

**server/src/config/**: Application configuration
- Purpose: Environment loading, database pool, Redis client
- Key files: `env.ts`, `database.ts`, `redis.ts`

**server/src/db/schema/**: Database schema definitions
- Purpose: Drizzle table definitions for all entities
- Files (16 total):
  - `index.ts` - Barrel export
  - `tenants.ts`, `roles.ts`, `permissions.ts`, `role_permissions.ts` - RBAC tables
  - `users.ts`, `sessions.ts` - Auth tables
  - `units.ts`, `plasmas.ts`, `cycles.ts`, `daily_recordings.ts` - Business tables
  - `feed_products.ts`, `feed_stock.ts`, `feed_movements.ts` - Feed management
  - `standards.ts`, `audit_logs.ts` - Compliance tables

**server/src/db/seed/**: Database initial data
- Purpose: Seed RBAC roles, permissions
- Files: `minimal.ts`, `rbac.ts`

**server/src/lib/**: Shared utilities
- Purpose: Constants, password hashing
- Files: `constants.ts`, `password.ts`

**server/src/modules/**: Feature modules (8 modules)
- Purpose: Business logic, HTTP handlers
- Structure per module: `*.controller.ts`, `*.service.ts`, `*.routes.ts`, `*.errors.ts`

**server/src/plugins/**: Middleware plugins
- Purpose: Cross-cutting concerns
- Files: `session.ts`, `tenant.ts`, `rbac.ts`, `rate-limit.ts`, `security-headers.ts`

**client/src/**: Frontend source
- Purpose: React application
- Files: `App.tsx`, `App.test.tsx`, `main.tsx`, `theme/index.ts`

**tests/**: Test suite
- Purpose: Integration and unit tests
- Files: Test files and test setup

## Key File Locations

**Entry Points:**
- `server/src/index.ts`: Server bootstrap, plugin/controller composition
- `server/src/config/env.ts`: Environment variable validation
- `server/src/config/database.ts`: Database connection
- `client/src/main.tsx`: Client entry

**Configuration:**
- `server/src/config/env.ts`: Environment schema (env.ts)
- `server/src/config/database.ts`: MySQL pool (database.ts)
- `server/src/config/redis.ts`: Redis client (redis.ts)

**Core Logic:**
- `server/src/modules/plasma/plasma.service.ts`: Plasma business logic
- `server/src/modules/unit/unit.service.ts`: Unit business logic
- `server/src/modules/auth/auth.service.ts`: Authentication logic
- `server/src/modules/cycle/cycle.service.ts`: Cycle business logic
- `server/src/modules/recordings/recordings.service.ts`: Daily recording business logic

**Testing:**
- `tests/setup.ts`: Test database setup

## Module Organization

Each feature module follows an identical pattern:

**Example: Plasma Module**
```
server/src/modules/plasma/
├── plasma.controller.ts   # Elysia route definitions, validation, error mapping
├── plasma.service.ts   # Business logic, database operations
├── plasma.routes.ts  # Re-exports controller for composition
├── plasma.errors.ts # Custom error classes
```

**Files per module:**

| Module | controller | service | routes | errors |
|--------|-----------|---------|--------|--------|--------|
| auth | auth.controller.ts | auth.service.ts | - | - |
| users | users.controller.ts | users.service.ts | users.routes.ts | users.errors.ts |
| rbac | rbac.controller.ts | rbac.service.ts | rbac.routes.ts | rbac.errors.ts |
| unit | unit.controller.ts | unit.service.ts | unit.routes.ts | unit.errors.ts |
| plasma | plasma.controller.ts | plasma.service.ts | plasma.routes.ts | plasma.errors.ts |
| cycle | cycle.controller.ts | cycle.service.ts | cycle.routes.ts | cycle.errors.ts |
| recordings | recordings.controller.ts | recordings.service.ts | recordings.routes.ts | recordings.errors.ts |
| plasma | plasma.controller.ts | plasma.service.ts | plasma.routes.ts | plasma.errors.ts |

**Naming Conventions:**

**Files:**
- kebab-case: `plasma.controller.ts`, `daily_recordings.ts`
- `.controller.ts` suffix: HTTP handlers
- `.service.ts` suffix: Business logic
- `.routes.ts` suffix: Re-export for composition
- `.errors.ts` suffix: Error classes
- `.schema.ts` suffix: Drizzle table

**Functions:**
- camelCase: `createPlasma`, `listPlasmas`, `getPlasma`
- Verb-first pattern: `createX`, `getX`, `listX`, `updateX`, `softDeleteX`

**Variables:**
- camelCase: `tenantId`, `userId`, `currentTenantId`
- Entity plural for collections: `plasmas`, `units`, `users`

**Types:**
- PascalCase: `Plasma`, `Unit`, `User`
- `NewX` prefix for insert types: `NewPlasma`, `NewUnit`
- `X.$inferInsert` for Drizzle inferred types

## Where to Add New Code

**New Feature Module:**
1. Create `server/src/modules/<feature>/` directory
2. Add `<feature>.controller.ts` with route definitions
3. Add `<feature>.service.ts` with business logic
4. Add `<feature>.errors.ts` with error classes
5. Re-export in `<feature>.routes.ts` for composition
6. Add `.use(<feature>Controller)` in `server/src/index.ts`

**New Database Table:**
1. Add schema definition in `server/src/db/schema/<name>.ts`
2. Export from `server/src/db/schema/index.ts`
3. Run Drizzle migration: `bunx drizzle-kit push`

**New Route in Existing Module:**
1. Add route definition in `<module>.controller.ts`
2. Use `.post()`, `.get()`, `.put()`, `.delete()` methods
3. Add `beforeHandle: requirePermission('...')` for protected routes
4. Add validation schema via Elysia `t.Object()`

**New Permission:**
1. Add permission in `server/src/db/seed/rbac.ts`
2. Seed database to insert permission
3. Use in routes via `requirePermission('name')`

**Tests:**
1. Add test files in `tests/unit/` directory
2. Use naming: `<module>.test.ts`

## Special Directories

**server/drizzle/**: Database migrations
- Purpose: Drizzle migration files (SQL snapshots)
- Generated: Yes (via `drizzle-kit`)
- Committed: Yes

**server/node_modules/**: Dependencies
- Generated: Yes (via `bun install`)
- Committed: No (gitignored)

**client/node_modules/**: Frontend dependencies
- Generated: Yes
- Committed: No

---

*Structure analysis: 2026-04-17*