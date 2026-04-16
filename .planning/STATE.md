# STATE.md — Sakha Farm Management System

## Current State
**Status**: Ready to execute
**Active Milestone**: v1.0 — Core Farm Management
**Active Phase**: 2 — Authentication, Session & Multi-Tenancy (4 plans planned)

## Progress
| Phase | Status | Notes |
|-------|--------|-------|
| 1. Project Setup & Database Schema | ✅ Complete | 15/15 UAT tests pass |
| 2. Authentication, Session & Multi-Tenancy | 🔧 In Progress | Planning + executing |
| 3. RBAC Manager & User Management | ⏳ Pending | Role/permission CRUD, user CRUD for superadmin |
| 4. Unit, Plasma & Cycle CRUD | ⏳ Pending | |
| 5. Daily Recording & Standard Comparison | ⏳ Pending | Auto FCR/IP/SR calculations |
| 6. Feed Inventory Management | ⏳ Pending | Surat Jalan + stock tracking |
| 7. Inventory Resume & Reporting | ⏳ Pending | Aggregate queries, export |
| 8. Frontend — Layout & Dashboard | ⏳ Pending | Separated Sidebar/Navbar/Footer |
| 9. Frontend — Inventory & Reporting UI | ⏳ Pending | RBAC Manager UI included |
| 10. Testing, Cybersecurity & Docs | ⏳ Pending | Vitest + security tests |

## Tech Stack
- **Runtime**: Bun
- **Backend**: Elysia.js
- **ORM**: Drizzle ORM
- **Database**: MySQL
- **Session/Cache**: Redis (backed sessions, rate limiting, caching)
- **Frontend**: React 18 + Vite + React Router + TanStack Query + MUI
- **Testing**: Vitest (unit + integration + security tests)

## Key Decisions
- Feature-based module structure (controller/service/model)
- DECIMAL(10,3) for all weight/feed values
- Multi-tenancy via row-level tenant_id + middleware
- Audit trail on all mutations
- 1 Zak = 50 Kg conversion
- Standards table per DOC type (CP, Cobb, Ross, Patriot, etc.)
- **Session**: Redis-backed, httpOnly + Secure + SameSite=Strict cookies
- **CSRF**: Double-submit cookie pattern
- **UI**: Modern minimalist, separated Sidebar/Navbar/Footer components
- **Security**: CSP headers, rate limiting, bcrypt(12), account lockout
- **RBAC**: Dynamic role/permission management, not hardcoded
- **Code Quality**: JSDoc on every export, no `as any`, max 30 lines per function, descriptive naming

## Code Documentation Standards
- JSDoc on every exported function/class (description, @param, @returns, @throws)
- Inline comments explain WHY, not WHAT
- Complex logic has step-by-step comment blocks
- Junior developer readability checklist enforced per PR
- No messy code: single responsibility, explicit over implicit, no magic numbers

## Reference App
- Existing sakhaFarm at `/Users/zakybaraq/Apps/sakhaFarm` — already implements Elysia + Drizzle + React + Vite
- Schema: roles, users, flocks, permissions, role_permissions, audit_logs
- Server plugins: JWT, Redis, rate-limit, security-headers, pino
- Client: MUI, TanStack Query, React Router

## Pending Items
- Excel reference file: `/Users/zakybaraq/Apps/sakhaFarm/REKAP RECORDING SAKHA FARM KUNINGAN 2026.xlsx`
- User will provide Excel/CSV sheets for feed types (BR, GF, B-Series)

## Research Completed
- Poultry farming domain (plasma-inti model, FCR/IP formulas, breed standards)
- Elysia.js + Drizzle ORM patterns (project structure, transactions, multi-tenancy, auth)

## Next Action
Run `/gsd-plan-phase 1` to create detailed execution plan for Phase 1.
