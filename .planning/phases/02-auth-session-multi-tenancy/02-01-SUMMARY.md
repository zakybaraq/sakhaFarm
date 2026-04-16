---
phase: "02"
plan: "01"
type: "auto"
subsystem: "auth"
tags: ["lucia", "auth", "mysql", "argon2", "elysia"]
dependencies:
  requires: ["01-project-setup-database-schema"]
  provides: ["auth-endpoints", "session-management", "user-registration"]
  affects: ["users-table", "sessions-table", "audit-logs", "feed-movements"]
tech-stack:
  added: ["lucia@3.2.2", "oslo@1.2.1", "@lucia-auth/adapter-mysql@3.0.2", "@node-rs/argon2@2.0.2"]
  patterns: ["Argon2id password hashing", "MySQL session storage", "Elysia cookie handling"]
key-files:
  created:
    - "server/src/auth/lucia.ts"
    - "server/src/modules/auth/auth.service.ts"
    - "server/src/modules/auth/auth.controller.ts"
    - "server/src/db/seed/minimal.ts"
  modified:
    - "server/src/db/schema/users.ts"
    - "server/src/db/schema/sessions.ts"
    - "server/src/db/schema/audit_logs.ts"
    - "server/src/db/schema/feed_movements.ts"
    - "server/src/index.ts"
decisions:
  - "Lucia v3 does NOT support separate Redis session storage — sessions stored in MySQL via Mysql2Adapter"
  - "Lucia v3 removed createUser/useKey API — manually hash with Argon2id and insert user row"
  - "User ID changed from int autoincrement to varchar(16) for Lucia-generated IDs"
  - "All FK references to users.id updated to varchar(16)"
  - "Auth_keys table NOT created — Lucia v3 stores password_hash directly in users table"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-17"
  tasks_completed: 12
  tasks_total: 12
---

# Phase 02 Plan 01: Lucia Auth Setup Summary

**One-liner:** Lucia Auth v3 with MySQL adapter, Argon2id password hashing, register/login/logout/me endpoints with session cookie management.

## What Was Built

- **Lucia Auth v3 instance** (`server/src/auth/lucia.ts`) — Configured with `Mysql2Adapter` for both user and session storage, custom `getUserAttributes` mapping, and session cookie settings (httpOnly, secure, sameSite=strict).
- **Auth service** (`server/src/modules/auth/auth.service.ts`) — `registerUser`, `loginUser`, `logoutUser`, `validateUserSession` with Argon2id hashing, password strength validation, failed login attempt tracking, and account lockout.
- **Auth controller** (`server/src/modules/auth/auth.controller.ts`) — Four endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- **Schema adaptations** — `users.id` changed from `int` to `varchar(16)`, `password_hash` column added, `sessions` table restructured for Lucia v3 format.
- **Seed script** — Updated to use `generateIdFromEntropySize(10)` and `@node-rs/argon2` for user creation.

## Verification Results

| Test | Result |
|------|--------|
| TypeScript compilation | ✅ Clean (0 errors) |
| Server starts | ✅ Port 3000 |
| Health endpoint | ✅ Returns OK |
| POST /api/auth/login | ✅ Returns user + sets session cookie |
| GET /api/auth/me (authenticated) | ✅ Returns user data |
| POST /api/auth/logout | ✅ Invalidates session |
| GET /api/auth/me (after logout) | ✅ Returns "Session expired" |
| POST /api/auth/register | ✅ Creates user + session |
| Weak password rejection | ✅ Returns validation error |
| DB schema push | ✅ All tables created |
| Seed script | ✅ Roles, tenant, admin user created |

## Deviations from Plan

### [Rule 2 - Missing] Lucia v3 architecture differs from plan assumptions

- **Found during:** Planning/implementation
- **Issue:** Plan assumed Lucia v2 API (`lucia()` function, `createUser`, `useKey`, `mysql2()` adapter, separate Redis session adapter). Lucia v3 uses `new Lucia()` class, no `createUser`/`useKey` (manual insert + Argon2), `Mysql2Adapter` (not `mysql2()`), and does NOT support separate Redis session storage.
- **Fix:** Rewrote all auth code for Lucia v3 API. Sessions stored in MySQL via `Mysql2Adapter`. Password hashed with `@node-rs/argon2` and stored directly in `users.password_hash` column.
- **Files modified:** All auth files

### [Rule 3 - Blocking] User ID length mismatch

- **Found during:** Seed script execution
- **Issue:** Plan specified `varchar(15)` for user IDs, but `generateIdFromEntropySize(10)` produces 16-character IDs. Seed failed with "Data too long for column 'id'".
- **Fix:** Changed all `varchar(15)` to `varchar(16)` in users.id and all FK references (audit_logs.userId, feed_movements.createdBy, sessions.userId).
- **Files modified:** `users.ts`, `audit_logs.ts`, `feed_movements.ts`, `sessions.ts`

### [Rule 2 - Missing] auth_keys table not needed

- **Found during:** Schema design
- **Issue:** Plan specified creating `auth_keys` table. Lucia v3 does NOT use a keys table — password credentials are stored directly in the user table via `password_hash` column.
- **Fix:** Skipped `auth_keys.ts` creation. Added `passwordHash` column to `users` table instead.
- **Files affected:** `auth_keys.ts` not created (cancelled from todo)

## Known Stubs

None — all auth functionality is fully wired and tested.

## Commits

- `7c69378` feat(02-01): setup Lucia Auth v3 with MySQL adapter and auth endpoints
- `ab349af` fix(02-01): fix varchar(15) to varchar(16) for Lucia IDs, fix TS errors in auth controller
