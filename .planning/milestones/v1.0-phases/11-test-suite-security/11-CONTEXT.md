# 11-CONTEXT.md — Phase 11: Test Suite Completion & Security Hardening

## Prior Context Applied
- **PROJECT.md**: Tech stack, code quality standards
- **STATE.md**: v1.0 milestone (9.5/10 phases), 57/63 tests passing
- **10-CONTEXT.md**: Test infrastructure, security measures from Phase 10
- **ROADMAP.md Phase 11**: Test fixes + security hardening deliverables

## Current Test Status

### Test Results (as of 2026-04-18)
| Result | Count |
|--------|-------|
| Pass | 57 |
| Fail | 6 |
| Error | 6 |
| Total | 63 |

### What's Passing
- Error class tests (all custom error definitions)
- Security config tests (rate limits, headers verification)
- Password validation tests

### Issues Fixed This Session
- **FIX**: `vi.hoisted()` removed in Vitest 3.x → Replaced with chainable mock objects
- **FIX**: Password test regex → Updated special character pattern

### Remaining Issues
| Issue | Severity | Root Cause |
|-------|----------|----------|
| 6 errors | CRITICAL | Module initialization (env, Lucia, Redis) before mocks applied |
| 6 fail | HIGH | Service mocks returning wrong values |

---

## Security Gaps (from v1.0 Audit)

### Gap 1: `/api/auth/register` No Auth Guard
- **Issue**: Any unauthenticated user can create users via POST `/api/auth/register`
- **Risk**: Unauthorized user creation, privilege escalation
- **Decision (THIS PHASE)**: Admin-only access → Add auth guard requiring superadmin role

### Gap 2: Users Controller Missing Tenant Isolation
- **Issue**: Users can potentially see cross-tenant data
- **Risk**: Data breach between tenants
- **Decision (THIS PHASE)**: Refactor service to filter by tenant_id on all queries

### Gap 3: Rate Limiter IP Spoofing
- **Issue**: Uses last IP from x-forwarded-for instead of first
- **Risk**: Bypassing rate limits via forwarded requests
- **Decision (THIS PHASE)**: Fix to use first IP from header

---

## Decisions Made (This Phase)

### D-11-01: Registration Access
- **Decision**: Admin-only (superadmin can create users)
- **Rationale**: Security best practice - prevent unauthorized registration
- **Implementation**: Add `requireRole('superadmin')` beforeHandle to /register endpoint

### D-11-02: Test Coverage Target
- **Decision**: >90% pass rate acceptable for v1.0
- **Rationale**: Focus security fixes, not perfect test coverage
- **Scope**: Fix blocking errors first

### D-11-03: Users Tenant Isolation
- **Decision**: Fix in Phase 11
- **Rationale**: High-priority security issue from audit
- **Implementation**: Add tenant_id filter to all user queries in service

---

## Implementation Plan

### Sub-tasks

#### T1: Fix Test Mock Infrastructure
1. Add vi.mock() for env module in each test file
2. Add vi.mock() for lucia/auth dependencies
3. Add vi.mock() for redis module
4. Verify tests run without runtime errors

#### T2: Secure Registration Endpoint
1. Read auth.controller.ts register endpoint
2. Add requirePermission or requireRole check
3. Test returns 401 for non-admin
4. Document in 10-SECURITY.md

#### T3: Fix Users Tenant Isolation
1. Read users.service.ts
2. Add tenant_id filter to all queries
3. Verify cross-tenant access blocked

#### T4: Fix Rate Limiter IP
1. Read rate-limit.ts plugin
2. Change from `.pop()` to `[0]` for x-forwarded-for
3. Document change

---

## Implementation Assets

### Files to Modify
- `server/src/plugins/rate-limit.ts` - IP extraction fix
- `server/src/modules/auth/auth.controller.ts` - Add auth guard
- `server/src/modules/users/users.service.ts` - Tenant isolation
- `tests/setup.ts` - Add more comprehensive mocks
- `tests/unit/*.test.ts` - Fix remaining tests

### Patterns to Follow
- Existing tenant isolation: `getTenantId(ctx)` from tenant.ts plugin
- Existing permission check: `requirePermission()` in beforeHandle
- Existing error handling: Custom error classes

---

## Next Steps

1. Create 11-01-PLAN.md with task breakdown
2. Execute tasks sequentially (auth guard first, then tests, then security fixes)

---

*CONTEXT created: 2026-04-18*