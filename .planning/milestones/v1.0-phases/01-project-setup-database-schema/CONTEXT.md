# 1-CONTEXT.md — Phase 1: Project Setup & Database Schema

## Prior Context Applied
- PROJECT.md: Full tech stack, project structure, code quality standards
- REQUIREMENTS.md: 14 functional requirements, 4 non-functional
- ROADMAP.md: Phase 1 goal = monorepo + Elysia + Drizzle + MySQL + Redis + Vitest + complete schema
- STATE.md: Key decisions (DECIMAL, multi-tenancy, 1 Zak = 50 Kg, audit trail, session security)
- Reference app: `/Users/zakybaraq/Apps/sakhaFarm` — existing Elysia + Drizzle + React project (DO NOT copy code, build from scratch)

## Decisions Made (This Phase)

### D-01: Monorepo Structure
- **Decision**: Separate `package.json` for `server/` and `client/` (no workspace root)
- **Rationale**: Matches user preference, simpler setup, each workspace independent
- **Impact**: Two separate `bun run dev` commands (or concurrently via root script)

### D-02: Database Setup
- **Decision**: Docker-based MySQL container (fully isolated, not shared with existing sakhaFarm)
- **Rationale**: Clean separation, reproducible environment
- **Credentials**: Via `.env` only — NO hardcoded credentials in `drizzle.config.ts`
- **Database name**: `sakhafarm_latest`

### D-03: Schema Management
- **Decision**: `drizzle-kit push` for development workflow
- **Rationale**: Faster iteration during Phase 1
- **Impact**: `bun run db:push` applies schema directly to MySQL

### D-04: Code Origin
- **Decision**: Build everything from scratch — DO NOT copy from existing sakhaFarm project
- **Rationale**: Cleaner codebase, enforce documentation standards from day one
- **Note**: Existing project can be referenced for patterns but not copied

### D-05: Seed Data Scope
- **Decision**: Minimal seed only
  - 4 default roles: Super Admin (id=1), Admin Unit (id=2), Admin Plasma (id=3), Viewer (id=4)
  - 1 sample tenant
  - 1 admin user (email: admin@sakhafarm.local, password: changeme123)
- **Deferred**: BW/FCR standards seeding (Phase 5), sample unit/plasma/cycle (Phase 4)

## Locked Decisions (From Prior Context — Do NOT Re-Ask)

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Runtime | Bun |
| Backend | Elysia.js |
| ORM | Drizzle ORM (mysql2 driver) |
| Database | MySQL (Docker) |
| Session/Cache | Redis (Docker, ioredis client) |
| Frontend | React 18 + Vite + React Router v6 + TanStack Query + MUI |
| Testing | Vitest |
| Validation | Zod (env), Elysia `t.Object` (request body) |
| Logging | Pino |

### Database Schema (16+ Tables)
```
tenants, users, roles, permissions, role_permissions,
units, plasmas, cycles, daily_recordings,
feed_products, feed_stock, feed_movements,
standards, audit_logs, sessions
```

### Schema Conventions
- `DECIMAL(10,3)` for all weight/feed values (kg)
- `INDEX` on all date columns and foreign keys
- `tenant_id` on every tenant-scoped table
- `created_at`, `updated_at` timestamps on all tables
- Soft delete via `deleted_at` nullable timestamp
- Foreign key constraints on all relationships

### Session & Cookie
- Redis-backed sessions via `@elysiajs/session`
- Cookie: httpOnly, Secure, SameSite=Strict, maxAge=24h
- CSRF: double-submit cookie pattern

### Security
- bcrypt cost=12
- Rate limiting: login 5/min, API 100/min, heavy ops 10/min
- Security headers: CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy
- CORS whitelist via env variable

### Code Quality
- JSDoc on every exported function/class
- Max 30 lines per function
- NO `as any`, NO `@ts-ignore`, NO `@ts-expect-error`
- Custom error classes: `NotFoundError`, `ValidationError`, `UnauthorizedError`
- Descriptive naming, no abbreviations

### Docker
- `docker-compose.yml`: MySQL 8.0 + Redis 7 + app services
- `Dockerfile.server`, `Dockerfile.client`

### Project Structure
```
sakhaFarm/
├── server/
│   ├── src/
│   │   ├── index.ts
│   │   ├── config/
│   │   ├── modules/ (auth, rbac, users, tenant, unit, plasma, cycle, recording, feed, inventory, standard, audit)
│   │   ├── db/ (schema/, migrations/, seed/)
│   │   ├── lib/ (calculations.ts, units.ts, errors.ts)
│   │   └── plugins/ (auth.ts, session.ts, security.ts, tenant.ts, audit.ts)
│   ├── drizzle.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── client/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/
│   │   ├── components/ (layout/, ui/, charts/)
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── contexts/
│   │   └── types/
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── tests/ (fixtures/, setup.ts)
├── docker-compose.yml
├── Dockerfile.server
├── Dockerfile.client
└── .github/workflows/ci.yml
```

## Gray Areas Resolved
| Question | Decision |
|----------|----------|
| Monorepo style? | Separate package.json per workspace |
| DB credentials? | .env only, Docker MySQL |
| Schema strategy? | drizzle-kit push |
| Reuse existing code? | Build from scratch |
| Seed scope? | Minimal (roles + 1 tenant + 1 admin) |

## Deferred Ideas (Not This Phase)
- BW/FCR standards seed data → Phase 5
- Sample unit/plasma/cycle data → Phase 4
- Full CI/CD pipeline → Phase 10
- CSV import for feed types → v1.1

## Next Steps
1. Run `/gsd-plan-phase 1` to create detailed execution plan
2. Planner will use this CONTEXT.md to know all decisions are locked
