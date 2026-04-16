# PROJECT.md — Sakha Farm Management System

## Project Name
**SakhaFarm** — Poultry Plasma Farm Management System

## Problem Statement
Data manajemen peternakan ayam plasma saat ini tersebar di banyak sheet Excel yang sulit dikelola, termasuk: identitas & siklus, recording harian (deplesi, penimbangan), logistik & pakan, serta inventory per unit. Diperlukan sistem terpusat yang mengotomatisasi perhitungan FCR, IP, deviasi bobot, dan tracking stok pakan.

## Solution
Web-based farm management system dengan:
- **Backend**: Bun + Elysia.js + Drizzle ORM + MySQL + Redis
- **Frontend**: React 18 + Vite + React Router + TanStack Query + MUI
- **Testing**: Vitest
- **Architecture**: Clean Architecture (Entities, Repositories, Services, Controllers)

**Reference App**: Existing sakhaFarm project at `/Users/zakybaraq/Apps/sakhaFarm` — already implements Elysia + Drizzle + React + Vite with auth, RBAC, flock management. This new project will be an improved version with enhanced plasma/cycle/feed management features.

## Domain Context
### Indonesian Poultry Plasma-Inti Model
- **Plasma**: Peternak mitra yang memelihara ayam milik perusahaan inti
- **Siklus**: Satu periode pemeliharaan dari DOC (Day Old Chick) hingga panen (~30-35 hari)
- **DOC Types**: CP, Patriot, Ayam Unggul, MBU
- **Feed Types**: BR10, BR11, BSP, 281, GF series, B-series
- **Units**: Unit Kuningan, Unit Bojonegoro (masing-masing punya banyak plasma)

### Key Business Metrics
| Metric | Formula | Purpose |
|--------|---------|---------|
| **FCR** | Total Feed Consumed (kg) / Total Weight Gain (kg) | Efisiensi pakan |
| **IP** | (Survival Rate % × Average BW kg × 10) / (FCR × Days) × 100 | Indeks prestasi |
| **SR** | (Final Population / Initial Population) × 100 | Survival Rate |
| **Deviasi BW** | Actual BW - Standard BW | Performa vs standar |
| **Deplesi** | ((Mati + Afkir) / Populasi Awal) × 100 | Tingkat kematian/culling |
| **EPEF** | (Average Daily Gain (g) × SR%) / (FCR × 10) | European Production Efficiency |

### Feed Phase Mapping
| Phase | Age (Days) | Feed Types | Protein % |
|-------|-----------|------------|-----------|
| Pre-starter | 1-7 | BR10 | 22-23% |
| Starter | 8-21 | BR11 | 21-22% |
| Grower | 22-35 | BSP, 281 | 19-20% |
| Finisher | 36-harvest | GF series, B-series | 18-19% |

### Benchmarks
| Metric | Excellent | Good | Poor |
|--------|-----------|------|------|
| FCR | < 1.50 | 1.60-1.70 | > 1.80 |
| IP | > 400 | 326-350 | < 300 |
| Deplesi | < 3% | 5-7% | > 7% |
| EPEF | > 400 | 300-350 | < 300 |

## Tech Stack Decisions
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Runtime | Bun | Fast startup, native TypeScript, built-in test runner |
| Framework | Elysia.js | Lightweight, type-safe, Eden RPC, fast |
| ORM | Drizzle ORM | Type-safe SQL, MySQL support, migrations |
| Database | MySQL | Relational, ACID, DECIMAL precision for feed |
| Session/Cache | Redis | Session storage, caching, rate limiting, job queue |
| Testing | Vitest | Fast, native Bun compatibility, unit + integration tests |
| Frontend | React 18 + Vite | Component-based, MUI ecosystem, large ecosystem |
| UI Library | MUI (Material-UI) | Modern minimalist design system, DataGrid, Charts |
| State Management | TanStack Query | Server state caching, optimistic updates |
| Routing | React Router v6 | Client-side routing, protected routes |

## Session & Cookie Strategy
- **Session Storage**: Redis-backed sessions via `@elysiajs/session` with Redis store
- **Cookie Configuration**: httpOnly, Secure, SameSite=Strict, maxAge=24h
- **Session Data**: user_id, role_id, tenant_id, last_activity
- **Session Invalidation**: On logout, password change, role change
- **Cookie Encryption**: Signed cookies with secret rotation support
- **CSRF Protection**: Double-submit cookie pattern for state-changing requests

## Cybersecurity Measures
| Category | Implementation |
|----------|---------------|
| **Authentication** | JWT + Redis session, bcrypt (cost=12), password complexity rules |
| **Authorization** | RBAC with permissions table, row-level tenant isolation |
| **Input Validation** | Elysia `t.Object` schemas, SQL injection prevention via Drizzle |
| **Rate Limiting** | Redis-based: login (5/min), API (100/min), heavy ops (10/min) |
| **Headers** | CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy |
| **Session Security** | httpOnly cookies, Secure flag, SameSite=Strict, session fixation prevention |
| **Data Protection** | DECIMAL precision for financial data, audit trail for all mutations |
| **API Security** | CORS whitelist, request size limits, payload sanitization |
| **Infrastructure** | Environment variable validation, no secrets in code, .env.example template |
| **Monitoring** | Request logging (pino), error tracking, failed login alerts |

## Key Requirements
1. **Multi-tenancy** — Support multiple farm companies
2. **Audit Trail** — Track all feed/depletion changes
3. **Database Transactions** — Atomic operations for harvest, stock updates
4. **Standard Comparison** — Auto-compare actual vs standard BW/FCR
5. **Inventory Tracking** — Feed in (Surat Jalan) / Feed out (Recording) = Stock

## Constraints
- CSV files dari Excel akan disediakan user nanti untuk feed master
- Minimal 3NF normalization
- DECIMAL untuk semua nilai pakan (kg)
- INDEX pada tanggal dan relasi

## UI/UX Design Principles
- **Style**: Modern minimalist — clean whitespace, subtle shadows, consistent spacing
- **Layout**: Sidebar (navigation) + Navbar (top bar) + Footer (status/copyright) — all separated into independent components
- **Color Palette**: Neutral base (slate/gray) with green accent (farm theme)
- **Typography**: Inter or system font stack, clear hierarchy
- **Components**: MUI with custom theme override for minimalist aesthetic
- **Responsive**: Desktop-first, tablet-friendly, mobile-adaptive

### Layout Structure
```
┌─────────────────────────────────────────────┐
│                 Navbar (top)                 │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │         Main Content             │
│ (nav)    │         (pages)                  │
│          │                                  │
├──────────┴──────────────────────────────────┤
│                 Footer (bottom)              │
└─────────────────────────────────────────────┘
```

### Component Separation
- `Sidebar.tsx` — Navigation menu, collapsible, role-aware items
- `Navbar.tsx` — User menu, notifications, tenant switcher, breadcrumbs
- `Footer.tsx` — App version, copyright, system status
- `Layout.tsx` — Composes Sidebar + Navbar + Footer + content outlet

## Project Structure
```
sakhaFarm/
├── server/                         # Elysia backend
│   ├── src/
│   │   ├── index.ts                # Elysia app entry
│   │   ├── config/                 # App configuration
│   │   │   ├── database.ts         # Drizzle MySQL connection pool
│   │   │   ├── redis.ts            # Redis client (ioredis)
│   │   │   └── env.ts              # Zod environment validation
│   │   ├── modules/                # Feature modules (controller/service/routes)
│   │   │   ├── auth/               # Login, logout, session management
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.routes.ts
│   │   │   ├── rbac/               # RBAC Manager (roles, permissions CRUD)
│   │   │   │   ├── rbac.controller.ts
│   │   │   │   ├── rbac.service.ts
│   │   │   │   └── rbac.routes.ts
│   │   │   ├── users/              # User Management (superadmin only)
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   └── users.routes.ts
│   │   │   ├── tenant/             # Multi-tenant management
│   │   │   ├── unit/               # Unit CRUD (e.g., Unit Kuningan)
│   │   │   ├── plasma/             # Plasma (farmer) CRUD
│   │   │   ├── cycle/              # Cycle (siklus) CRUD + Chick-In
│   │   │   ├── recording/          # Daily recording (mortality, BW, feed)
│   │   │   ├── feed/               # Feed product master + stock movements
│   │   │   ├── inventory/          # Aggregate stock queries & resume
│   │   │   ├── standard/           # BW/FCR standards per DOC type
│   │   │   └── audit/              # Audit log queries
│   │   ├── db/
│   │   │   ├── schema/             # Drizzle schema definitions (one file per table)
│   │   │   ├── migrations/         # Generated migration files
│   │   │   └── seed/               # Seed scripts (roles, standards, sample data)
│   │   ├── lib/
│   │   │   ├── calculations.ts     # FCR, IP, SR, deplesi, EPEF formulas
│   │   │   ├── units.ts            # Zak ↔ Kg conversion utilities
│   │   │   └── errors.ts           # Custom error classes
│   │   └── plugins/
│   │       ├── auth.ts             # JWT + user derivation
│   │       ├── session.ts          # Redis-backed session plugin
│   │       ├── security.ts         # CSP, rate limit, CORS, headers
│   │       ├── tenant.ts           # Tenant identification middleware
│   │       └── audit.ts            # Request/response audit logging
│   ├── drizzle.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── client/                         # React + Vite frontend
│   ├── index.html
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.tsx                # React entry point
│   │   ├── App.tsx                 # Router + layout composition
│   │   ├── api/                    # API client (fetch wrapper with interceptors)
│   │   ├── components/             # Shared UI components
│   │   │   ├── layout/
│   │   │   │   ├── Layout.tsx      # Composes Sidebar + Navbar + Footer + outlet
│   │   │   │   ├── Sidebar.tsx     # Collapsible navigation, role-aware items
│   │   │   │   ├── Navbar.tsx      # Top bar: breadcrumbs, user menu, tenant switcher
│   │   │   │   └── Footer.tsx      # Status bar: version, copyright
│   │   │   ├── ui/                 # Reusable primitives (Button, Card, Dialog)
│   │   │   └── charts/             # BW curve, FCR trend (@mui/x-charts)
│   │   ├── pages/                  # Route-level pages
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── units/
│   │   │   ├── plasmas/
│   │   │   ├── cycles/
│   │   │   ├── recordings/
│   │   │   ├── feed/
│   │   │   ├── inventory/
│   │   │   ├── rbac/               # Role & permission management pages
│   │   │   └── users/              # User management pages (superadmin)
│   │   ├── hooks/                  # Custom React hooks (useAuth, useTenant)
│   │   ├── contexts/               # React contexts (AuthContext, ThemeContext)
│   │   └── types/                  # TypeScript type definitions
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── tests/                          # Shared integration tests
│   ├── fixtures/                   # Test data (seed, mock)
│   └── setup.ts                    # Test setup (DB reset, Redis mock)
├── docker-compose.yml              # MySQL + Redis + app services
├── Dockerfile.server
├── Dockerfile.client
└── .github/
    └── workflows/
        └── ci.yml                  # GitHub Actions CI/CD
```

## Code Quality & Documentation Standards

### Documentation Requirements (MANDATORY)
- **JSDoc on every exported function/class**: Description, `@param` with types and descriptions, `@returns` with type and description, `@throws` for errors
- **Inline comments**: Explain WHY, not WHAT (code is self-documenting for what)
- **Complex logic**: Step-by-step comment blocks before algorithms (e.g., FCR calculation, stock deduction)
- **Type definitions**: Every interface/type has a JSDoc description explaining its purpose
- **API endpoints**: Document route purpose, expected body, response shape, error cases

### Code Style Rules (No Messy Code)
- **Single Responsibility**: Each function does ONE thing. Max 30 lines per function.
- **Explicit over Implicit**: No magic numbers, no hidden side effects. Named constants for all business values.
- **Error Handling**: Custom error classes (`NotFoundError`, `ValidationError`, `UnauthorizedError`). Never swallow errors with empty catch blocks.
- **Type Safety**: NO `as any`, NO `@ts-ignore`, NO `@ts-expect-error`. Proper TypeScript types everywhere.
- **Naming**: Descriptive names. `calculateFeedConsumption()` not `calcFeed()`. `isCycleActive` not `active`.
- **File Organization**: Imports → Constants → Types → Main export. Group imports: external → internal → relative.
- **No Duplication**: DRY principle. Extract shared logic into `lib/` or shared utilities.
- **Database Queries**: Named query builders, not raw SQL strings. Use Drizzle's type-safe API.

### Junior Developer Readability Checklist
Every PR must pass this test:
- [ ] Can a junior developer understand this function without asking questions?
- [ ] Are all business terms explained? (e.g., "FCR = Feed Conversion Ratio, lower is better")
- [ ] Is the data flow clear? (input → transformation → output)
- [ ] Are edge cases documented? (what happens when stock is 0? when cycle is completed?)

### Example of Acceptable Documentation
```typescript
/**
 * Calculates Feed Conversion Ratio (FCR) for a given cycle.
 * 
 * FCR measures how efficiently chickens convert feed into body weight.
 * Lower FCR = better efficiency. Industry target: 1.5 - 1.7
 * 
 * Formula: FCR = Total Feed Consumed (kg) / Total Weight Gained (kg)
 * 
 * @param totalFeedKg - Total feed consumed during the cycle in kilograms
 * @param finalPopulation - Number of chickens at harvest (after mortality/culling)
 * @param averageBodyWeightKg - Average body weight per chicken at harvest
 * @returns FCR value (e.g., 1.65). Returns Infinity if no weight gained.
 * @throws ValidationError if totalFeedKg is negative or population is zero
 */
export function calculateFCR(
  totalFeedKg: number,
  finalPopulation: number,
  averageBodyWeightKg: number
): number {
  // Validate inputs before calculation
  if (totalFeedKg < 0) {
    throw new ValidationError('Feed consumption cannot be negative')
  }
  if (finalPopulation <= 0) {
    throw new ValidationError('Population must be greater than zero')
  }

  const totalWeightGain = finalPopulation * averageBodyWeightKg
  
  // Edge case: no weight gained (shouldn't happen in practice)
  if (totalWeightGain === 0) {
    return Infinity
  }

  return totalFeedKg / totalWeightGain
}
```

## Success Criteria
- [ ] Database schema supports Unit → Plasma → Cycle → Recording hierarchy
- [ ] FCR dan IP dihitung otomatis saat recording harian diinput
- [ ] Stok pakan otomatis berkurang saat recording, bertambah saat Surat Jalan
- [ ] Deviasi BW vs Standard ditampilkan otomatis di dashboard
- [ ] Semua perubahan data tercatat di audit_log dengan user_id
- [ ] Multi-tenant isolation: tenant A tidak bisa akses data tenant B
- [ ] API response time < 200ms untuk query resume stock

## Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| CSV format berbeda antar unit | Skema feed_products fleksibel, mapping table per unit |
| Data besar (ribuan recording) | Index pada tanggal, pagination, Redis cache untuk resume |
| Concurrent stock updates | Database transactions + optimistic locking |
| Multi-tenant data leak | Tenant middleware di setiap route, row-level tenant_id |
