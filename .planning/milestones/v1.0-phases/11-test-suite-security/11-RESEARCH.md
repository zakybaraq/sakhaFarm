# 11-RESEARCH.md — Phase 11: Test Suite Completion & Security Hardening

## Phase Overview
- **Phase**: 11 - Test Suite Completion & Security Hardening
- **Goal**: Fix Phase 10 test issues + address security gaps from audit

## Standard Stack
No new libraries - maintenance phase:
- **Testing**: Vitest (existing)
- **Security**: Existing middleware

## Architecture Patterns
- Test mocks must chain like Drizzle (`.select().from().where()`)
- Auth guards via `beforeHandle: requirePermission()`
- Rate limiting via plugin pattern

## Don't Hand-Roll
- Permission checking - use existing `requirePermission()` middleware
- Rate limiting - use existing plugin, just fix IP extraction

## Common Pitfalls

### 1. vi.hoisted() Removed in Vitest 3.x
- **Pitfall**: Tests using `vi.hoisted()` fail - API removed
- **Fix**: Use plain `vi.fn()` with module-level mock objects
- **Pattern**:
```typescript
const mockDb = {
  select: () => ({ from: () => ({ where: () => ({}) }) }),
  insert: () => ({ values: () => ({}) }),
}
vi.mock('../../server/src/config/database', () => ({ db: mockDb }))
```

### 2. Rate Limiter IP Extraction
- **Pitfall**: Using last IP allows spoofing
- **Fix**: Use first IP from x-forwarded-for
- **Pattern**:
```typescript
const firstIp = ips[0] // NOT ips[ips.length - 1]
```

### 3. Public Registration Endpoint
- **Pitfall**: /api/auth/register has no auth guard
- **Fix**: Add beforeHandle requirePermission
- **Pattern**:
```typescript
.post('/register', handler, { beforeHandle: requirePermission('users.create') })
```

## Code Examples

### Fix 1: vi.hoisted() → chainable mock
```typescript
// OLD (broken):
const { mockSelect } = vi.hoisted(() => ({ mockSelect: vi.fn() }))

// NEW (works):
const mockDb = {
  select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
}
vi.mock('../../server/src/config/database', () => ({ db: mockDb }))
```

### Fix 2: Rate limiter IP
```typescript
// OLD:
const rightmostIp = ips[ips.length - 1]

// NEW:
const firstIp = ips[0]
```

### Fix 3: Registration guard
```typescript
// BEFORE:
.post('/register', handler)

// AFTER:
.post('/register', handler, { beforeHandle: requirePermission('users.create') })
```

## Current Status (as of 2026-04-18)

### Completed Fixes
- ✅ vi.hoisted() replaced (69 tests passing)
- ✅ Registration endpoint secured
- ✅ Rate limiter IP fix applied

### Remaining
- ⏳ Users tenant isolation verification

## Confidence Levels
| Task | Confidence |
|-----|------------|
| vi.hoisted fix | HIGH - Applied and tested |
| Registration guard | HIGH - Applied |
| Rate limiter IP | HIGH - Applied |
| Users tenant | MEDIUM - Needs verification |

---

*RESEARCH created: 2026-04-18*
*RESEARCH updated: 2026-04-18*