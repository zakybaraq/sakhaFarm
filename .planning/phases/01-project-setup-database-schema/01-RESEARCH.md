# Phase 1: Project Setup & Database Schema - Research

**Gathered:** 2026-04-16
**Status:** Complete
**Source:** Reference app analysis + technical research

## Standard Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Runtime | Bun | Latest | Native TypeScript, fast startup |
| Backend | Elysia.js | v1.x | Lightweight, type-safe |
| ORM | Drizzle ORM | v0.39+ | MySQL dialect, migrations |
| Database | MySQL | 8.x | ACID, DECIMAL precision |
| Cache/Session | Redis | 7.x | ioredis client |
| Frontend | React 18 + Vite | Latest | MUI, TanStack Query |
| Testing | Vitest | Latest | Bun-compatible |
| Monorepo | Bun workspaces | Native | No need for Turborepo/Lerna |

## Architecture Patterns

### Monorepo Structure (Bun Workspaces)
```
sakhaFarmLatest/
├── package.json          # Root workspace config
├── server/               # Elysia backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── drizzle.config.ts
│   ├── vitest.config.ts
│   └── src/
├── client/               # React + Vite frontend
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   └── src/
└── docker-compose.yml    # MySQL + Redis
```

### Drizzle Schema Pattern
- One file per table in `server/src/db/schema/`
- Central export in `server/src/db/index.ts`
- Use `mysqlTable` with proper types: `varchar`, `int`, `decimal(10,3)`, `timestamp`, `boolean`
- Foreign keys with `references(() => table.column)`
- Indexes with `.index()` on foreign keys and date columns

### Connection Pooling
- Drizzle + mysql2 with connection pool config
- Pool settings: max connections, idle timeout, acquire timeout
- Redis connection with ioredis (auto-reconnect, max retries)

## Don't Hand-Roll
- **Auth/session** — Use `@elysiajs/jwt`, `@elysiajs/session` (Phase 2)
- **Rate limiting** — Use Redis-based, not in-memory (Phase 2)
- **Validation** — Use Elysia's `t.Object` + zod, not custom validators
- **Migrations** — Use Drizzle Kit, not manual SQL

## Common Pitfalls
1. **Bun workspaces** — Root `package.json` needs `"workspaces": ["server", "client"]`
2. **Drizzle MySQL** — Need `mysql2` as dependency, `drizzle-kit` for migrations
3. **TypeScript paths** — Use `moduleResolution: "bundler"` for Elysia
4. **Vite + React** — Need `@vitejs/plugin-react` for JSX transform
5. **MUI setup** — Need `@emotion/react` and `@emotion/styled` peer deps
6. **TanStack Query** — Need `@tanstack/react-query` v5
7. **Vitest** — Separate config per workspace, not shared root config
8. **Environment validation** — Use `zod` with `process.env` parsing, fail fast on missing vars
9. **Drizzle schema exports** — Each schema file must export the table const AND the type
10. **MySQL DECIMAL** — Drizzle maps to string in JS, need custom type or manual parsing

## Database Schema Design (16+ Tables)

### Core Hierarchy
```
tenants (1) → (N) units (1) → (N) plasmas (1) → (N) cycles (1) → (N) daily_recordings
                                                                    (1) → (N) feed_movements
```

### Auth/RBAC
- `tenants`: id, name, code, created_at, updated_at, deleted_at
- `users`: id, tenant_id, email, password_hash, name, status, created_at, updated_at
- `roles`: id, tenant_id, name, description, is_default, created_at, updated_at, deleted_at
- `permissions`: id, name, category, description, created_at
- `role_permissions`: role_id, permission_id, action (PK: composite)
- `sessions`: id, user_id, data, expires_at, created_at

### Farm Management
- `units`: id, tenant_id, name, code, location, created_at, updated_at, deleted_at
- `plasmas`: id, unit_id, name, address, phone, capacity, created_at, updated_at, deleted_at
- `cycles`: id, plasma_id, cycle_number, doc_type, start_date, initial_population, status, created_at, updated_at

### Recording & Feed
- `daily_recordings`: id, cycle_id, date, dead, culled, body_weight, age_days, created_at
- `feed_products`: id, code, name, phase, default_unit, created_at, updated_at, deleted_at
- `feed_stock`: id, plasma_id, feed_product_id, quantity_zak, quantity_kg, updated_at
- `feed_movements`: id, plasma_id, feed_product_id, movement_type, quantity_zak, quantity_kg, reference, created_at

### Standards & Audit
- `standards`: id, doc_type, age_days, target_bw, target_fcr, created_at, updated_at
- `audit_logs`: id, user_id, action, table_name, record_id, old_value, new_value, created_at

## Security Domain
- Environment validation prevents missing secrets at startup
- No secrets committed to code — `.env.example` template required
- Database credentials via environment variables only
- CORS configured for client origin only
