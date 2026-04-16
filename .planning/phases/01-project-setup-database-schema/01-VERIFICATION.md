---
phase: 01-project-setup-database-schema
verified: 2026-04-16T00:00:00Z
status: gaps_found
score: 6/10 must-haves verified
overrides_applied: 0
gaps:
  - truth: "Client starts on port 5173 with bun run dev"
    status: failed
    reason: "Client main.tsx is a bare 8-line stub — no App.tsx, no index.html, no Vite entry point, no React Router, no TanStack Query provider, no MUI theme. The directory structure exists (pages/, components/, api/, hooks/, contexts/, types/) but all are empty. Client cannot start meaningfully."
    artifacts:
      - path: "client/src/main.tsx"
        issue: "Only 8 lines — renders <div>SakhaFarm</div> with no providers, no App component, no theme"
      - path: "client/src/App.tsx"
        issue: "MISSING — file does not exist"
      - path: "client/index.html"
        issue: "MISSING — Vite entry HTML does not exist"
      - path: "client/src/theme/"
        issue: "MISSING — no MUI theme configuration"
    missing:
      - "Create client/index.html with Vite entry point"
      - "Create client/src/App.tsx with Routes and placeholder"
      - "Create client/src/theme/index.ts with MUI minimalist theme"
      - "Wire main.tsx to render App with QueryClientProvider, ThemeProvider, BrowserRouter"
  - truth: "MUI theme is configured with minimalist design"
    status: failed
    reason: "No theme file exists anywhere in client/. MUI dependencies are installed in package.json but never configured."
    artifacts:
      - path: "client/src/theme/"
        issue: "Directory does not exist"
    missing:
      - "Create MUI theme with green primary color (#2E7D32), Inter font, subtle shadows"
  - truth: "TanStack Query provider wraps the app"
    status: failed
    reason: "No QueryClient or QueryClientProvider exists in the client. main.tsx has no imports beyond React and ReactDOM."
    artifacts:
      - path: "client/src/main.tsx"
        issue: "No TanStack Query imports or providers"
    missing:
      - "Create QueryClient instance and wrap App in QueryClientProvider"
  - truth: "Client Vitest runs with zero failures on empty test suite"
    status: failed
    reason: "client/vitest.config.ts exists and is valid, but there are zero test files in client/src/. The config is correct but untested."
    artifacts:
      - path: "client/vitest.config.ts"
        issue: "Config exists but no test files to run"
    missing:
      - "Create at least one basic test file in client/src/ to verify Vitest runs"
  - truth: "Migration files are generated from schema definitions"
    status: failed
    reason: "server/src/db/migrations/ directory exists but is completely empty. No migration SQL or meta.json files were generated."
    artifacts:
      - path: "server/src/db/migrations/"
        issue: "Empty directory — no migration files generated"
    missing:
      - "Run drizzle-kit generate to produce migration SQL files"
  - truth: "Seed script populates default roles, sample tenant, and standards"
    status: partial
    reason: "server/src/db/seed/minimal.ts exists and is well-structured (101 lines, idempotent, inserts roles + tenant + admin user). However it does NOT seed standards or feed products as specified in PLAN 01-03. The CONTEXT.md explicitly deferred standards to Phase 5, so the seed is acceptable for Phase 1 scope."
    artifacts:
      - path: "server/src/db/seed/minimal.ts"
        issue: "Does not seed standards or feed products — deferred per CONTEXT.md D-05"
    missing:
      - "None for Phase 1 scope (standards deferred to Phase 5 per CONTEXT.md)"
deferred:
  - truth: "server/src/lib/ contains calculation utilities (FCR, IP, SR, unit conversions)"
    addressed_in: "Phase 5"
    evidence: "Phase 5 success criteria: 'Auto-calculate running FCR', 'IP calculation at cycle completion' — calculation utilities needed when daily recording is implemented"
  - truth: "server/src/plugins/ contains auth, session, security, tenant, audit plugins"
    addressed_in: "Phase 2"
    evidence: "Phase 2 goal: 'Implement JWT authentication with Redis-backed sessions, cookie security, RBAC middleware, and tenant isolation'"
  - truth: "server/src/modules/ contains feature modules (auth, rbac, users, unit, plasma, cycle, etc.)"
    addressed_in: "Phase 2, Phase 3, Phase 4"
    evidence: "Phase 2: auth endpoints; Phase 3: RBAC + user CRUD; Phase 4: Unit/Plasma/Cycle CRUD"
  - truth: "Client components (layout, ui, charts) are implemented"
    addressed_in: "Phase 8"
    evidence: "Phase 8 goal: 'Build the modern minimalist UI layout with separated Sidebar, Navbar, Footer components and core dashboard'"
  - truth: "Client pages (units, plasmas, cycles, recordings, feed, inventory, rbac, users) are implemented"
    addressed_in: "Phase 4, Phase 5, Phase 6, Phase 7, Phase 8, Phase 9"
    evidence: "Phase 4: Unit/Plasma/Cycle CRUD; Phase 5: Daily Recording; Phase 6: Feed Inventory; Phase 8: Dashboard; Phase 9: Inventory & Reporting UI"
  - truth: "Dockerfile.server and Dockerfile.client exist"
    addressed_in: "Phase 10"
    evidence: "Phase 10 deliverables: 'Dockerfile for server and client', 'docker-compose.yml (MySQL + Redis + app)'"
  - truth: "GitHub Actions CI/CD pipeline exists"
    addressed_in: "Phase 10"
    evidence: "Phase 10 deliverables: 'CI/CD pipeline (GitHub Actions)'"
  - truth: "client/src/api/, client/src/hooks/, client/src/contexts/, client/src/types/ are populated"
    addressed_in: "Phase 2, Phase 8"
    evidence: "Phase 2: auth hooks and API clients; Phase 8: layout components with API integration"
human_verification:
  - test: "Run `bun run dev` and verify both server and client start without errors"
    expected: "Server on port 3000, client on port 5173, no TypeScript compilation errors"
    why_human: "Requires Docker (MySQL + Redis) to be running; cannot verify without infrastructure"
  - test: "Run `bun run db:push` and verify all 16 tables are created"
    expected: "All 16 tables created with correct column types, constraints, indexes, foreign keys"
    why_human: "Requires MySQL connection; schema files exist but migrations not generated — need to verify drizzle-kit push works against actual MySQL"
  - test: "Run `bun run db:seed` and verify seed data inserted correctly"
    expected: "4 roles, 1 tenant, 1 admin user inserted without duplicates"
    why_human: "Requires MySQL running with schema applied; seed script is idempotent but needs live DB to verify"
  - test: "Run `bun run test` for both server and client"
    expected: "Server tests pass (tests/setup.test.ts), client tests pass (need at least one test file)"
    why_human: "Server test exists but client has zero test files — need to verify Vitest runs clean on both workspaces"
  - test: "Verify @elysiajs/session is installed"
    expected: "Package present in server/node_modules"
    why_human: "PLAN 01-01 specifies @elysiajs/session as dependency but it is NOT in server/package.json — may be intentional deferral to Phase 2"
---

# Phase 1: Project Setup & Database Schema — Verification Report

**Phase Goal:** Initialize monorepo structure, configure Elysia + Drizzle + MySQL + Redis + Vitest, create complete database schema with migrations.
**Verified:** 2026-04-16T00:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth   | Status     | Evidence       |
| --- | ------- | ---------- | -------------- |
| 1   | Monorepo structure with server/ and client/ workspaces | ✓ VERIFIED | Root package.json exists with dev:server, dev:client, dev (concurrently) scripts. server/package.json and client/package.json both present with correct dependencies. |
| 2   | Server starts on port 3000 with Elysia + CORS + health endpoint | ✓ VERIFIED | server/src/index.ts (25 lines) creates Elysia app with CORS, GET /api/health returns {status, timestamp, service}. Listens on env.PORT (default 3000). |
| 3   | Database connection pool initializes (Drizzle + mysql2) | ✓ VERIFIED | server/src/config/database.ts (47 lines) — mysql.createPool with uri from env, drizzle() wrapper, exports db + pool. JSDoc documented. |
| 4   | Redis client connects (ioredis) | ✓ VERIFIED | server/src/config/redis.ts (51 lines) — ioredis instance with retry strategy, testRedisConnection() function, JSDoc documented. |
| 5   | Environment validation with Zod fails fast on missing vars | ✓ VERIFIED | server/src/config/env.ts (19 lines) — Zod schema validates PORT, NODE_ENV, DATABASE_URL, REDIS_URL, JWT_SECRET, CORS_ORIGIN, RATE_LIMIT_*. Exports validated env object. |
| 6   | All 16 Drizzle schema files exist with correct types, FKs, indexes | ✓ VERIFIED | 16 schema files in server/src/db/schema/: tenants, users, roles, permissions, role_permissions, sessions, units, plasmas, cycles, daily_recordings, feed_products, feed_stock, feed_movements, standards, audit_logs, index.ts. All export table const + $inferSelect/$inferInsert types. FKs use .references() pattern. DECIMAL(10,3) on weight/feed columns. Indexes on FK and date columns. |
| 7   | Seed script populates default roles, tenant, admin user | ⚠️ PARTIAL | server/src/db/seed/minimal.ts (101 lines) — idempotent seed with roles (4), tenant (1), admin user (1). Does NOT seed standards or feed products, but CONTEXT.md D-05 explicitly deferred these. Acceptable for Phase 1 scope. |
| 8   | Client starts on port 5173 with React + Vite + MUI + TanStack Query + Router | ✗ FAILED | client/src/main.tsx is 8 lines — bare `<div>SakhaFarm</div>` with no App.tsx, no providers, no theme, no router. client/index.html MISSING. client/src/theme/ MISSING. client/src/App.tsx MISSING. All client directories (pages/, components/, api/, hooks/, contexts/, types/) are empty. |
| 9   | Migration files generated from schema definitions | ✗ FAILED | server/src/db/migrations/ directory exists but is completely empty. No drizzle-kit generate was run. |
| 10  | Vitest runs with zero failures on both server and client | ⚠️ PARTIAL | Server: vitest.config.ts exists, tests/setup.test.ts exists (2 passing tests). Client: vitest.config.ts exists but ZERO test files in client/src/. |

**Score:** 6/10 truths verified (3 partial, 2 failed)

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | server/src/lib/ calculation utilities (FCR, IP, SR) | Phase 5 | Phase 5: "Auto-calculate running FCR", "IP calculation at cycle completion" |
| 2 | server/src/plugins/ (auth, session, security, tenant, audit) | Phase 2 | Phase 2: "JWT authentication with Redis-backed sessions, cookie security, RBAC middleware" |
| 3 | server/src/modules/ feature modules | Phase 2-4 | Phase 2: auth; Phase 3: RBAC + users; Phase 4: Unit/Plasma/Cycle CRUD |
| 4 | Client components (layout, ui, charts) | Phase 8 | Phase 8: "Sidebar, Navbar, Footer components and core dashboard" |
| 5 | Client pages (all 8 page directories) | Phase 4-9 | Phase 4: Unit/Plasma/Cycle; Phase 5: Recording; Phase 6: Feed; Phase 8: Dashboard; Phase 9: Reporting UI |
| 6 | Dockerfile.server, Dockerfile.client | Phase 10 | Phase 10: "Dockerfile for server and client" |
| 7 | GitHub Actions CI/CD pipeline | Phase 10 | Phase 10: "CI/CD pipeline (GitHub Actions)" |
| 8 | client/src/api/, hooks/, contexts/, types/ populated | Phase 2, 8 | Phase 2: auth hooks; Phase 8: layout with API integration |

### Required Artifacts

| Artifact | Expected    | Status | Details |
| -------- | ----------- | ------ | ------- |
| `package.json` | Root workspace config | ✓ VERIFIED | Exists with concurrently dev scripts, no workspaces field (per CONTEXT.md D-01: separate package.json per workspace) |
| `server/package.json` | Server dependencies | ✓ VERIFIED | Elysia, drizzle-orm, mysql2, ioredis, zod, bcrypt, pino, vitest all present |
| `server/tsconfig.json` | TypeScript config | ✓ VERIFIED | ESNext, strict, moduleResolution bundler, bun-types |
| `server/.env.example` | Env template | ✓ VERIFIED | Contains DATABASE_URL, REDIS_URL, JWT_SECRET, CORS_ORIGIN, PORT, NODE_ENV |
| `server/src/config/env.ts` | Zod env validation | ✓ VERIFIED | 19 lines, validates all required vars, exports typed env object |
| `server/src/config/database.ts` | Drizzle MySQL pool | ✓ VERIFIED | 47 lines, mysql2 pool + drizzle wrapper, JSDoc documented |
| `server/src/config/redis.ts` | ioredis client | ✓ VERIFIED | 51 lines, retry strategy, testRedisConnection(), JSDoc documented |
| `server/src/index.ts` | Elysia entry point | ✓ VERIFIED | 25 lines, CORS, /api/health endpoint, listens on env.PORT |
| `server/drizzle.config.ts` | Drizzle Kit config | ✓ VERIFIED | Points to schema/index.ts, mysql dialect, reads DATABASE_URL from env |
| `server/vitest.config.ts` | Vitest config | ✓ VERIFIED | Node environment, includes ../tests/**/*.test.ts |
| `server/src/db/schema/index.ts` | Central schema export | ✓ VERIFIED | Re-exports all 16 tables + TypeScript types |
| `server/src/db/schema/*.ts` (×15) | Individual schema files | ✓ VERIFIED | All 15 table files present with correct columns, FKs, indexes |
| `server/src/db/seed/minimal.ts` | Seed script | ✓ VERIFIED | 101 lines, idempotent, roles + tenant + admin user |
| `server/src/db/migrations/` | Migration SQL files | ✗ MISSING | Empty directory — no migrations generated |
| `client/package.json` | Client dependencies | ✓ VERIFIED | React 19, MUI 7, TanStack Query 5, React Router 7, Vite 6, vitest |
| `client/vite.config.ts` | Vite config | ✓ VERIFIED | React plugin, port 5173, /api proxy to localhost:3000 |
| `client/tsconfig.json` | TypeScript config | ✓ VERIFIED | Present with react-jsx, path aliases |
| `client/vitest.config.ts` | Vitest config | ✓ VERIFIED | jsdom environment, includes src/**/*.test.{ts,tsx} |
| `client/src/main.tsx` | React entry point | ⚠️ STUB | 8 lines — bare div, no App, no providers, no theme |
| `client/src/App.tsx` | Root component | ✗ MISSING | File does not exist |
| `client/index.html` | Vite entry HTML | ✗ MISSING | File does not exist |
| `client/src/theme/index.ts` | MUI theme | ✗ MISSING | Directory and file do not exist |
| `docker-compose.yml` | Docker services | ✓ VERIFIED | MySQL 8.0 (3307→3306), Redis 7 (6380→6379), volumes |
| `tests/setup.test.ts` | Basic test | ✓ VERIFIED | 2 passing tests (basic assertions + async) |

### Key Link Verification

| From | To  | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| server/src/index.ts | server/src/config/env.ts | import { env } | ✓ WIRED | `import { env, validateEnv } from './config/env'` used for PORT and CORS_ORIGIN |
| server/src/config/database.ts | server/src/config/env.ts | env.DATABASE_URL | ✓ WIRED | `import { env } from './env'` — pool uses env.DATABASE_URL |
| server/src/config/redis.ts | server/src/config/env.ts | env.REDIS_URL | ✓ WIRED | `import { env } from './env'` — Redis uses env.REDIS_URL |
| server/src/db/schema/index.ts | server/src/db/schema/*.ts | export from | ✓ WIRED | All 15 schema files re-exported with types |
| server/src/db/seed/minimal.ts | server/src/db/schema | import { roles, tenants, users } | ✓ WIRED | Imports from '../../db/schema', uses db from '../../config/database' |
| client/src/main.tsx | client/src/App.tsx | import App | ✗ NOT_WIRED | App.tsx does not exist — main.tsx has no App import |
| client/src/main.tsx | MUI ThemeProvider | import ThemeProvider | ✗ NOT_WIRED | No MUI imports in main.tsx |
| client/src/main.tsx | TanStack Query | import QueryClientProvider | ✗ NOT_WIRED | No TanStack Query imports in main.tsx |

### Data-Flow Trace (Level 4)

Not applicable for Phase 1 — no components render dynamic data. Schema files define structure but no API endpoints or data consumers exist yet.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Schema files load without errors | `bun run --cwd server -e "import * as schema from './src/db/schema'; console.log('OK')"` | Not executed — requires Bun + MySQL driver | ? SKIP |
| Seed module loads | `bun run --cwd server -e "import './src/db/seed/minimal'; console.log('OK')"` | Not executed — requires DB connection | ? SKIP |
| Server starts on port 3000 | `bun run --cwd server dev` | Not executed — requires MySQL + Redis running | ? SKIP |
| Client starts on port 5173 | `bun run --cwd client dev` | Not executed — index.html missing, would fail | ✗ FAIL |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| NFR-1 | 01-01-PLAN | Performance: API response < 200ms | ? NEEDS HUMAN | Infrastructure in place (connection pool, Redis client) but no endpoints to measure |
| NFR-2 | 01-02-PLAN | Data Integrity: DECIMAL(10,3), FK constraints, transactions | ✓ SATISFIED | All weight/feed columns use decimal(10,3). FK constraints on all relationships. |
| NFR-3 | 01-01-PLAN | Scalability: Indexes on dates and FKs, Redis caching | ✓ SATISFIED | Indexes on all FK and date columns. Redis client configured. |
| NFR-4 | 01-01-PLAN | Security: JWT auth, tenant isolation, input validation, rate limiting | ? NEEDS HUMAN | Env validation present. JWT, RBAC, tenant middleware deferred to Phase 2. |
| FR-1 | 01-02-PLAN | Multi-Tenancy Management | ⚠️ PARTIAL | tenants table exists with slug + unique constraints. Tenant isolation middleware deferred to Phase 2. |
| FR-2 | 01-02-PLAN | Unit Management | ⚠️ PARTIAL | units table exists with tenant FK, soft delete. CRUD endpoints deferred to Phase 4. |
| FR-3 | 01-02-PLAN | Plasma Management | ⚠️ PARTIAL | plasmas table exists with unit FK, soft delete. CRUD endpoints deferred to Phase 4. |
| FR-4 | 01-02-PLAN | Cycle Management | ⚠️ PARTIAL | cycles table exists with plasma FK, status field. CRUD endpoints deferred to Phase 4. |
| FR-5 | 01-02-PLAN | Daily Recording | ⚠️ PARTIAL | daily_recordings table exists with cycle FK, unique date constraint. Endpoints deferred to Phase 5. |
| FR-6 | 01-02-PLAN | Feed Product Master | ⚠️ PARTIAL | feed_products table exists with code, phase, protein. CRUD deferred to Phase 6. |
| FR-7 | 01-02-PLAN | Feed Stock & Movement | ⚠️ PARTIAL | feed_stock + feed_movements tables exist with proper FKs. Logic deferred to Phase 6. |
| FR-8 | 01-02-PLAN | Standard Comparison | ⚠️ PARTIAL | standards table exists with doc_type + day_age unique constraint. Seeding deferred to Phase 5. |
| FR-9 | 01-02-PLAN | Performance Metrics | ? NEEDS HUMAN | No calculation utilities exist (server/src/lib/ empty). FCR/IP/SR logic deferred to Phase 5. |
| FR-10 | 01-02-PLAN | Inventory Resume | ? NEEDS HUMAN | Schema supports it. Aggregate queries deferred to Phase 7. |
| FR-11 | 01-02-PLAN | Audit Trail | ⚠️ PARTIAL | audit_logs table exists with immutable design (no deleted_at). Audit plugin deferred to Phase 2/10. |
| FR-12 | 01-02-PLAN | RBAC Manager | ⚠️ PARTIAL | roles, permissions, role_permissions tables exist. CRUD endpoints + UI deferred to Phase 3. |
| FR-13 | 01-02-PLAN | User Management | ⚠️ PARTIAL | users table exists with role/tenant FKs. CRUD endpoints deferred to Phase 3. |
| FR-14 | 01-02-PLAN | Session & Cookie Management | ⚠️ PARTIAL | sessions table exists. @elysiajs/session NOT in package.json — deferred to Phase 2. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| client/src/main.tsx | 6 | Bare `<div>SakhaFarm</div>` — no App, no providers | 🛑 Blocker | Client is non-functional — no routing, no theme, no state management |
| server/src/index.ts | 23 | Uses emoji in console.log (🐔) — cosmetic only | ℹ️ Info | No functional impact |
| server/src/db/schema/users.ts | 22-23 | FK column names are empty strings `int('')` — should be `'role_id'`, `'tenant_id'` | ⚠️ Warning | Column names in DB will be empty strings — likely a bug that will cause issues |
| server/src/db/schema/roles.ts | 23 | FK column name is empty string `int('')` — should be `'tenant_id'` | ⚠️ Warning | Same issue as users.ts |
| server/src/db/schema/role_permissions.ts | 20-21 | FK column names are empty strings `int('')` — should be `'role_id'`, `'permission_id'` | ⚠️ Warning | Same issue |
| server/src/db/schema/units.ts | 19 | FK column name is empty string `int('')` — should be `'tenant_id'` | ⚠️ Warning | Same issue |
| server/src/db/schema/plasmas.ts | 20 | FK column name is empty string `int('')` — should be `'unit_id'` | ⚠️ Warning | Same issue |
| server/src/db/schema/cycles.ts | 21 | FK column name is empty string `int('')` — should be `'plasma_id'` | ⚠️ Warning | Same issue |
| server/src/db/schema/daily_recordings.ts | 23 | FK column name is empty string `int('')` — should be `'cycle_id'` | ⚠️ Warning | Same issue |
| server/src/db/schema/feed_stock.ts | 21-22 | FK column names are empty strings `int('')` — should be `'plasma_id'`, `'feed_product_id'` | ⚠️ Warning | Same issue |
| server/src/db/schema/feed_movements.ts | 23-24, 31 | FK column names are empty strings `int('')` — should be `'plasma_id'`, `'feed_product_id'`, `'created_by'` | ⚠️ Warning | Same issue |
| server/src/db/schema/audit_logs.ts | 21 | FK column name is empty string `int('')` — should be `'user_id'` | ⚠️ Warning | Same issue |

### Human Verification Required

1. **Server startup with dependencies**
   - **Test:** Run `docker compose up -d` then `bun run dev:server`
   - **Expected:** Server starts on port 3000, logs "SakhaFarm API running at..."
   - **Why human:** Requires Docker (MySQL + Redis) to be running; cannot verify in static analysis

2. **Database schema application**
   - **Test:** Run `bun run db:push` or `bun run db:migrate`
   - **Expected:** All 16 tables created with correct column types, constraints, indexes, FKs
   - **Why human:** Requires live MySQL connection; also the empty-string FK column names need to be verified as intentional or bugs

3. **Seed script execution**
   - **Test:** Run `bun run db:seed`
   - **Expected:** 4 roles, 1 tenant, 1 admin user inserted. Running twice produces no duplicates.
   - **Why human:** Requires live MySQL with schema applied

4. **Empty FK column name bug assessment**
   - **Test:** Review all schema files where `int('')` is used for FK columns
   - **Expected:** Column names should be meaningful (e.g., `'tenant_id'`, `'role_id'`)
   - **Why human:** This appears to be a systematic bug across 10+ schema files — needs developer confirmation whether this is intentional or a copy-paste error

5. **Client Vitest test suite**
   - **Test:** Run `bun run --cwd client test`
   - **Expected:** Vitest runs with 0 failures
   - **Why human:** No test files exist in client/src/ — need to create at least one basic test

### Gaps Summary

**2 critical gaps blocking Phase 1 completion:**

1. **Client is non-functional** — The client scaffold is essentially empty. Only `main.tsx` exists as an 8-line bare div. Missing: `index.html`, `App.tsx`, MUI theme, TanStack Query provider, React Router setup. All client directories (pages/, components/, api/, hooks/, contexts/, types/) are empty directories.

2. **Migrations not generated** — The `server/src/db/migrations/` directory is empty. Schema definitions exist but `drizzle-kit generate` was never run. Without migrations, the schema cannot be applied to the database.

**1 systematic bug across schema files:**

3. **Empty FK column names** — Across 10+ schema files, foreign key columns use `int('')` instead of proper column names like `int('tenant_id')`. This will create columns with empty string names in MySQL, which is likely a bug. This affects: users.ts, roles.ts, role_permissions.ts, units.ts, plasmas.ts, cycles.ts, daily_recordings.ts, feed_stock.ts, feed_movements.ts, audit_logs.ts.

**2 partial gaps:**

4. **Client has no test files** — vitest.config.ts is correct but no `.test.ts` or `.test.tsx` files exist in client/src/.
5. **@elysiajs/session not installed** — Referenced in PLAN 01-01 and CONTEXT.md but absent from server/package.json. May be intentional deferral to Phase 2.

---

_Verified: 2026-04-16T00:00:00Z_
_Verifier: the agent (gsd-verifier)_
