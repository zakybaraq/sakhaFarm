# 1-PLAN.md — Phase 1: Project Setup & Database Schema

## Phase Goal
Initialize monorepo structure, configure Elysia + Drizzle + MySQL + Redis + Vitest, create complete database schema with migrations.

## Wave 1: Project Scaffold & Configuration
### 1.1 Create directory structure
```
sakhaFarmLatest/
├── server/
│   ├── src/
│   │   ├── index.ts
│   │   ├── config/
│   │   ├── modules/
│   │   ├── db/
│   │   ├── lib/
│   │   └── plugins/
│   └── drizzle.config.ts
├── client/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── contexts/
│   │   └── types/
│   └── vite.config.ts
├── tests/
├── docker-compose.yml
├── Dockerfile.server
├── Dockerfile.client
├── .gitignore
└── package.json
```

### 1.2 Initialize server package.json
- Dependencies: `elysia`, `@elysiajs/cors`, `@elysiajs/jwt`, `@elysiajs/session`, `drizzle-orm`, `mysql2`, `ioredis`, `zod`, `pino`, `bcrypt`
- DevDependencies: `bun-types`, `typescript`, `drizzle-kit`, `vitest`, `@types/bcrypt`
- Scripts: `dev`, `db:push`, `db:studio`, `db:generate`, `test`

### 1.3 Initialize client package.json
- Dependencies: `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`
- DevDependencies: `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `typescript`, `vite`, `vitest`
- Scripts: `dev`, `build`, `preview`, `test`

### 1.4 Root package.json
- Scripts: `dev:server`, `dev:client`, `dev` (concurrently), `test`

### 1.5 TypeScript configs
- `server/tsconfig.json`: ES2022 target, strict, module ESNext, moduleResolution bundler
- `client/tsconfig.json`: JSX react, strict, module ESNext
- `client/vite.config.ts`: React plugin, proxy `/api` to `http://localhost:3000`

### 1.6 Environment files
- `server/.env.example`: PORT, DATABASE_URL, REDIS_URL, JWT_SECRET, CORS_ORIGIN, NODE_ENV
- `server/.env`: development defaults
- `client/.env.example`: VITE_API_URL
- `client/.env`: VITE_API_URL=http://localhost:3000

### 1.7 Docker compose
- MySQL 8.0 service (port 3307 → 3306, db: sakhafarm_latest)
- Redis 7 service (port 6380 → 6379)
- Volumes for data persistence

## Wave 2: Server Core Setup
### 2.1 Elysia app entry (`server/src/index.ts`)
- Create Elysia app with cors, error handler, basic route
- Listen on port 3000
- Export App type for client-side type safety

### 2.2 Config module (`server/src/config/`)
- `env.ts`: Zod schema validation for all env vars
- `database.ts`: Drizzle MySQL connection pool via mysql2
- `redis.ts`: ioredis client with connection test

### 2.3 Drizzle config (`server/drizzle.config.ts`)
- Read from DATABASE_URL env var
- MySQL dialect, output to `./drizzle`

## Wave 3: Database Schema (16 Tables)
### 3.1 Schema files (`server/src/db/schema/`)
Each file exports one table definition with proper types.

**`tenants.ts`**
- id (int, autoincrement, PK)
- name (varchar 100, not null, unique)
- slug (varchar 50, not null, unique)
- is_active (int, default 1)
- created_at, updated_at
- Index: idx_tenants_slug

**`roles.ts`**
- id (int, autoincrement, PK)
- name (varchar 50, not null, unique)
- description (text)
- is_default (int, default 0)
- tenant_id (int, FK → tenants.id, nullable for system roles)
- created_at
- Index: idx_roles_tenant

**`permissions.ts`**
- id (int, autoincrement, PK)
- name (varchar 100, not null, unique)
- description (text)
- category (varchar 50, not null) — flock, feed, recording, inventory, user, rbac, audit
- created_at
- Index: idx_permissions_category

**`role_permissions.ts`**
- id (int, autoincrement, PK)
- role_id (int, FK → roles.id, not null)
- permission_id (int, FK → permissions.id, not null)
- action (varchar 10, not null) — allow, deny, read
- created_at
- Unique: (role_id, permission_id)
- Index: idx_rp_role, idx_rp_permission

**`users.ts`**
- id (int, autoincrement, PK)
- email (varchar 255, not null, unique)
- password (varchar 255, not null)
- name (varchar 100, not null)
- role_id (int, FK → roles.id, not null)
- tenant_id (int, FK → tenants.id, not null)
- is_active (int, default 1)
- is_locked (int, default 0)
- force_password_change (int, default 0)
- last_login_at (timestamp, nullable)
- failed_login_attempts (int, default 0)
- created_at, updated_at
- Index: idx_users_email, idx_users_tenant, idx_users_role

**`units.ts`**
- id (int, autoincrement, PK)
- tenant_id (int, FK → tenants.id, not null)
- name (varchar 100, not null)
- code (varchar 20, not null, unique)
- location (varchar 255)
- is_active (int, default 1)
- created_at, updated_at, deleted_at
- Index: idx_units_tenant, idx_units_code

**`plasmas.ts`**
- id (int, autoincrement, PK)
- unit_id (int, FK → units.id, not null)
- name (varchar 100, not null)
- farmer_name (varchar 100)
- address (text)
- phone (varchar 20)
- capacity (int) — max chicken capacity
- is_active (int, default 1)
- created_at, updated_at, deleted_at
- Index: idx_plasmas_unit

**`cycles.ts`**
- id (int, autoincrement, PK)
- plasma_id (int, FK → plasmas.id, not null)
- cycle_number (int, not null) — siklus ke-n
- doc_type (varchar 50, not null) — CP, Patriot, Ayam Unggul, MBU
- chick_in_date (date, not null)
- initial_population (int, not null)
- status (varchar 20, not null, default 'active') — active, completed, failed
- harvest_date (date, nullable)
- final_population (int, nullable)
- total_feed_kg (decimal 10,3, default 0)
- created_at, updated_at
- Index: idx_cycles_plasma, idx_cycles_status, idx_cycles_chick_in

**`daily_recordings.ts`**
- id (int, autoincrement, PK)
- cycle_id (int, FK → cycles.id, not null)
- recording_date (date, not null)
- day_age (int, not null) — umur hari ke-n
- dead (int, default 0)
- culled (int, default 0) — afkir
- remaining_population (int, not null)
- body_weight_g (decimal 10,3, nullable) — in grams
- feed_consumed_kg (decimal 10,3, default 0)
- notes (text, nullable)
- created_at, updated_at
- Unique: (cycle_id, recording_date)
- Index: idx_recordings_cycle, idx_recordings_date

**`feed_products.ts`**
- id (int, autoincrement, PK)
- code (varchar 20, not null, unique) — BR10, BR11, BSP, 281, GF-01, B-01
- name (varchar 100, not null)
- phase (varchar 20, not null) — pre-starter, starter, grower, finisher
- protein_percent (decimal 5,2)
- default_unit (varchar 10, default 'zak')
- is_active (int, default 1)
- created_at, updated_at
- Index: idx_feed_code, idx_feed_phase

**`feed_stock.ts`**
- id (int, autoincrement, PK)
- plasma_id (int, FK → plasmas.id, not null)
- feed_product_id (int, FK → feed_products.id, not null)
- opening_stock_kg (decimal 10,3, default 0)
- total_in_kg (decimal 10,3, default 0)
- total_out_kg (decimal 10,3, default 0)
- closing_stock_kg (decimal 10,3, default 0)
- last_updated_at (timestamp)
- Unique: (plasma_id, feed_product_id)
- Index: idx_stock_plasma, idx_stock_feed

**`feed_movements.ts`**
- id (int, autoincrement, PK)
- plasma_id (int, FK → plasmas.id, not null)
- feed_product_id (int, FK → feed_products.id, not null)
- movement_type (varchar 10, not null) — in, out
- quantity_kg (decimal 10,3, not null)
- quantity_zak (decimal 10,3, not null)
- reference_type (varchar 30, nullable) — surat_jalan, recording, adjustment
- reference_id (int, nullable)
- notes (text, nullable)
- created_by (int, FK → users.id)
- created_at
- Index: idx_movements_plasma, idx_movements_feed, idx_movements_type, idx_movements_date

**`standards.ts`**
- id (int, autoincrement, PK)
- doc_type (varchar 50, not null) — CP, Cobb, Ross, Patriot, etc.
- day_age (int, not null) — umur hari ke-n
- standard_bw_g (decimal 10,3, not null) — body weight in grams
- standard_fcr (decimal 5,3, nullable)
- daily_gain_g (decimal 10,3, nullable)
- cum_feed_intake_g (decimal 10,3, nullable)
- created_at
- Unique: (doc_type, day_age)
- Index: idx_standards_doc, idx_standards_day

**`audit_logs.ts`**
- id (int, autoincrement, PK)
- user_id (int, FK → users.id, not null)
- action (varchar 100, not null) — create, update, delete, login, logout
- resource (varchar 100, nullable)
- resource_id (varchar 100, nullable)
- old_value (json, nullable)
- new_value (json, nullable)
- ip_address (varchar 45, nullable)
- user_agent (text, nullable)
- created_at
- Index: idx_audit_user, idx_audit_action, idx_audit_created_at, idx_audit_resource

**`sessions.ts`**
- id (varchar 255, PK) — session ID
- data (json, not null) — session payload
- expires_at (timestamp, not null)
- created_at
- Index: idx_sessions_expires

### 3.2 Schema index file (`server/src/db/schema/index.ts`)
- Re-export all tables
- Export all TypeScript types (inferSelect, inferInsert)

## Wave 4: Seed Script
### 4.1 Seed file (`server/src/db/seed/minimal.ts`)
- Insert 4 default roles: Super Admin, Admin Unit, Admin Plasma, Viewer
- Insert 1 sample tenant: "Sakha Farm"
- Insert 1 admin user: admin@sakhafarm.local / changeme123 (bcrypt hashed)
- Assign Super Admin role to admin user
- Idempotent: check before insert

## Wave 5: Vitest Setup
### 5.1 Server vitest config (`server/vitest.config.ts`)
- Include: `tests/**/*.test.ts`
- Environment: node

### 5.2 Client vitest config (`client/vitest.config.ts`)
- Include: `src/**/*.test.ts`, `src/**/*.spec.ts`
- Environment: jsdom (or happy-dom)

### 5.3 Basic test file (`server/tests/setup.test.ts`)
- Verify database connection
- Verify Redis connection
- Verify Elysia app starts

## Wave 6: Verification
### 6.1 Run `docker compose up -d`
### 6.2 Run `bun run db:push` — verify all 16 tables created
### 6.3 Run `bun run db:seed` — verify seed data inserted
### 6.4 Run `bun run dev` — verify server starts on port 3000
### 6.5 Run `bun run test` — verify all tests pass
### 6.6 Run `cd client && bun run dev` — verify client starts on port 5173

## Dependencies
- None (first phase)

## Estimated Effort
- Wave 1: 30 min
- Wave 2: 20 min
- Wave 3: 60 min (16 schema files)
- Wave 4: 15 min
- Wave 5: 10 min
- Wave 6: 15 min
- **Total: ~2.5 hours**
