# Phase 10: Testing, Cybersecurity & Documentation - Research

**Researched:** 2026-04-17
**Domain:** Vitest testing patterns, React Testing Library, Security testing, Documentation structure
**Confidence:** HIGH

## Summary

Phase 10 focuses on expanding test coverage, verifying security mitigations, and creating release documentation. The project already has solid foundations: 9 server unit test files, Vitest 3.1.0 configured, and React Testing Library installed. The primary work involves expanding server tests to cover untested services (auth, feed movements, inventory), adding client component tests, creating security verification tests, and writing the four required documentation files.

**Primary recommendation:** Follow the existing test pattern using `vi.hoisted()` for database mocking and expand methodically by service. Security tests should be integration-level using mocked Redis. Documentation should live in the project root as plain markdown.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-10-01**: Test scope = expand server tests + add client component tests + add security tests
- **D-10-02**: Security verification = audit existing mitigations + add security tests
- **D-10-03**: Documentation = README.md + API.md + SETUP.md + CONTRIBUTING.md
- **D-10-04**: Coverage threshold = 60% server (services), no client enforcement

### Out of Scope
- E2E tests (requires Playwright setup, significant time)
- Full API docs (quick reference only)
- Full user manual (deferred to v1.1)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-10-01 | Expand server tests (auth, feed movements, inventory) | Pattern documentation from existing cycle.test.ts |
| REQ-10-02 | Client component tests (DataGrid, Modals, Forms) | React Testing Library patterns |
| REQ-10-03 | Security tests (rate limit, SQL injection, tenant isolation) | Integration test patterns with mocked Redis |
| REQ-10-04 | Documentation (README.md, API.md, SETUP.md, CONTRIBUTING.md) | Standard project documentation structure |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Server unit tests | API/Backend | — | Services under test, DB mocked |
| Client component tests | Browser/Client | — | React components, DOM testing |
| Security tests | API/Backend | — | Rate limiting, tenant isolation |
| Documentation | Project root | — | Cross-cutting concern |

---

## Standard Stack

### Testing
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 3.1.0 | Test runner, assertions | [VERIFIED: npm registry] |
| @testing-library/react | 16.3.0 | React component testing | [VERIFIED: npm registry] |
| jsdom | 26.1.0 | DOM simulation for React | [VERIFIED: npm registry] |

### Documentation
| Tool | Purpose | When to Use |
|------|---------|-------------|
| Markdown | Plain docs | README, CONTRIBUTING, SETUP |
| JSDoc | Code documentation | Already enforced in PROJECT.md |

**Installation:** No additional packages needed — all testing deps already installed.

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        TEST INFRASTRUCTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐   │
│  │  Server     │     │  Client     │     │  Security       │   │
│  │  Unit Tests │     │  Component  │     │  Integration    │   │
│  │             │     │  Tests      │     │  Tests          │   │
│  └──────┬──────┘     └──────┬──────┘     └────────┬────────┘   │
│         │                    │                     │            │
│         ▼                    ▼                     ▼            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Vitest Coverage Reporter                   │    │
│  │              Target: 60% server coverage                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Test File Structure

```
tests/
├── unit/
│   ├── cycle.test.ts        ✅ (existing)
│   ├── plasma.test.ts        ✅ (existing)
│   ├── unit.service.test.ts  ✅ (existing)
│   ├── recordings.test.ts     ✅ (existing)
│   ├── feed.test.ts          ✅ (existing, errors only)
│   ├── reporting.test.ts      ✅ (existing)
│   ├── rbac-users.test.ts    ✅ (existing)
│   ├── password.test.ts       ✅ (existing)
│   ├── setup.test.ts         ✅ (existing)
│   ├── auth.test.ts          ⬜ (NEW - auth.service tests)
│   └── security.test.ts      ⬜ (NEW - rate limit, tenant isolation)

client/src/
├── pages/
│   ├── units/
│   │   ├── Units.tsx
│   │   └── __tests__/
│   │       └── Units.test.tsx      ⬜ (NEW)
│   ├── Login.tsx
│   └── __tests__/
│       └── Login.test.tsx          ⬜ (NEW)
├── components/
│   └── __tests__/
│       └── ErrorBoundary.test.tsx  ⬜ (NEW)
```

### Pattern 1: Server Unit Test with Drizzle Mocking

**What:** Mock Drizzle ORM database operations using `vi.hoisted()` and chainable mock functions.

**When to use:** Testing service layer functions that call the database.

**Example:**
```typescript
// Source: tests/unit/cycle.test.ts (lines 20-34)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockSelect, mockInsert, mockUpdate, mockTransaction } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockTransaction: vi.fn(),
}))

vi.mock('../../server/src/config/database', () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    transaction: mockTransaction,
  },
}))

describe('cycle.service.ts', () => {
  const TENANT_ID = 1
  const USER_ID = 'user123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createCycle', () => {
    it('should throw error when plasma not in tenant', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      await expect(
        createCycle({ plasmaId: 1, docType: 'CP', chickInDate: '2026-01-01', initialPopulation: 1000 }, TENANT_ID, USER_ID)
      ).rejects.toThrow(CycleNotInTenantPlasmaError)
    })
  })
})
```

### Pattern 2: React Component Test with Testing Library

**What:** Test React components using `@testing-library/react` with `render()` and query methods.

**When to use:** Testing MUI components, forms, modals.

**Example:**
```typescript
// Source: [CITED: testing-library.com/docs/react-testing-library/example]
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LoginPage } from '../pages/Login'
import { AuthProvider } from '../contexts/AuthContext'

// Mock the API client
vi.mock('../api/client', () => ({
  auth: {
    login: vi.fn(),
  },
}))

// Mock useAuth hook
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    isAuthenticated: false,
  }),
}))

describe('LoginPage', () => {
  it('renders login form', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows error on failed login', async () => {
    const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'))
    vi.mocked(useAuth).mockReturnValue({ login: mockLogin, isAuthenticated: false })

    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid credentials/i)
    })
  })
})
```

### Pattern 3: Security Integration Test (Rate Limiting)

**What:** Test rate limiting by mocking Redis and verifying 429 responses.

**When to use:** Verifying security mitigations work correctly.

**Example:**
```typescript
// Source: [VERIFIED: server/src/plugins/rate-limit.ts]
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { rateLimit } from '../../server/src/plugins/rate-limit'

// Mock Redis
const mockRedis = {
  incr: vi.fn(),
  expire: vi.fn(),
}
vi.mock('../../server/src/config/redis', () => ({
  redis: mockRedis,
}))

describe('rate-limit plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login tier', () => {
    it('should return 429 when rate limit exceeded', async () => {
      mockRedis.incr.mockResolvedValue(6) // Exceeds limit of 5

      const app = new Elysia()
        .use(rateLimit('login'))
        .post('/login', () => ({ success: true }))

      const response = await app.handle(new Request('http://localhost/login', { method: 'POST' }))
      expect(response.status).toBe(429)
    })

    it('should allow requests under limit', async () => {
      mockRedis.incr.mockResolvedValue(3) // Under limit of 5

      const app = new Elysia()
        .use(rateLimit('login'))
        .post('/login', () => ({ success: true }))

      const response = await app.handle(new Request('http://localhost/login', { method: 'POST' }))
      expect(response.status).toBe(200)
    })
  })
})
```

### Pattern 4: Tenant Isolation Test

**What:** Verify that queries filter by tenantId correctly.

**When to use:** Ensuring multi-tenancy security.

**Example:**
```typescript
describe('tenant isolation', () => {
  it('should only return units for the requesting tenant', async () => {
    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([
        { id: 1, tenantId: 1, code: 'UNIT-A' },
        { id: 2, tenantId: 2, code: 'UNIT-B' }, // Different tenant - should NOT be returned
      ]),
    }

    // The service should filter by tenantId
    // Verify the query includes tenantId condition
    const result = await listUnits(TENANT_ID)
    expect(result.every(u => u.tenantId === TENANT_ID)).toBe(true)
  })

  it('should reject cross-tenant access', async () => {
    const mockSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]), // Empty result
    }
    mockSelect.mockReturnValue(mockSelect as any)

    await expect(
      getUnit(999, DIFFERENT_TENANT_ID)
    ).rejects.toThrow(UnitNotFoundError)
  })
})
```

### Anti-Patterns to Avoid

- **Don't mock at too high level:** Mocking entire services hides implementation bugs. Prefer mocking at the database layer.
- **Don't test implementation details:** Test behavior, not internal state. Use `screen.getByRole()` over `screen.getByTestId()`.
- **Don't use `as any` in tests:** This defeats the purpose of TypeScript testing.
- **Don't skip `vi.clearAllMocks()`:** Leads to flaky tests with state leakage.
- **Don't test Elysia routes directly in unit tests:** Use integration tests or test the underlying service.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test runner | Custom test framework | Vitest | Built-in Bun support, fast, familiar API |
| React testing | enzyme | @testing-library/react | Better practices, accessibility-focused |
| DOM simulation | JSDOM alternatives | jsdom | Official Testing Library recommendation |
| Coverage reporting | Custom scripts | Vitest coverage | Built-in, configurable thresholds |

**Key insight:** The testing infrastructure is already in place. The work is writing tests, not building a test framework.

---

## Common Pitfalls

### Pitfall 1: Flaky Tests from Mock State Leakage
**What goes wrong:** Tests pass individually but fail when run together.
**Why it happens:** `vi.clearAllMocks()` not called in `beforeEach`, or mocks not reset between tests.
**How to avoid:** Always use `beforeEach(() => vi.clearAllMocks())` pattern.
**Warning signs:** Tests pass with `--run` but fail with `--watch`, or vice versa.

### Pitfall 2: Over-Mocking Service Dependencies
**What goes wrong:** Tests pass but the actual service fails in production.
**Why it happens:** Mocking at the service level instead of database level.
**How to avoid:** Mock at the database (`db.select()`, `db.insert()`) not at the service level.
**Warning signs:** Test coverage report shows 100% but runtime errors occur.

### Pitfall 3: Missing Error Class Tests
**What goes wrong:** Error classes silently change behavior.
**Why it happens:** Error tests are quick to write but often skipped.
**How to avoid:** Include error class tests in the same file as service tests.
**Warning signs:** Error files have no corresponding test file.

### Pitfall 4: Client Test Import Issues
**What goes wrong:** Tests fail with "Cannot find module" errors.
**Why it happens:** Client uses Vite path aliases (`@/`) not resolved in tests.
**How to avoid:** Ensure `client/vitest.config.ts` has correct `resolve.alias` configuration. Already configured ✅

### Pitfall 5: Testing React Hook Form in Isolation
**What goes wrong:** Form validation tests pass but form doesn't work in browser.
**Why it happens:** Not testing the full form submission flow with mutation mocks.
**How to avoid:** Test the integration: form → validation → mutation → success/error state.

---

## Code Examples

### Server Auth Service Test
```typescript
// tests/unit/auth.test.ts (NEW)
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loginUser, logoutUser, registerUser } from '../../server/src/modules/auth/auth.service'
import { mockDb, mockRedis } from '../fixtures/mocks'

vi.mock('../../server/src/config/database', () => ({ db: mockDb }))
vi.mock('../../server/src/config/redis', () => ({ redis: mockRedis }))

describe('auth.service', () => {
  describe('loginUser', () => {
    it('should return session on valid credentials', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        passwordHash: '$argon2i$...',
        isLocked: 0,
        failedLoginAttempts: 0,
      }
      mockDb.select.mockResolvedValue([[mockUser]])
      mockRedis.get.mockResolvedValue(null)
      mockRedis.del.mockResolvedValue(1)

      const result = await loginUser('test@example.com', 'Password123!')
      expect(result.session).toBeDefined()
      expect(result.sessionCookie).toBeDefined()
    })

    it('should throw on invalid email', async () => {
      mockDb.select.mockResolvedValue([[]]) // Empty result
      mockRedis.pipeline.mockReturnValue({ incr: vi.fn(), expire: vi.fn(), exec: vi.fn() })

      await expect(loginUser('wrong@example.com', 'password')).rejects.toThrow('Invalid email or password')
    })

    it('should throw on invalid password', async () => {
      const mockUser = { id: 'user123', passwordHash: '$argon2i$...', isLocked: 0 }
      mockDb.select.mockResolvedValue([[mockUser]])
      mockRedis.pipeline.mockReturnValue({ incr: vi.fn(), expire: vi.fn(), exec: vi.fn() })

      await expect(loginUser('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid email or password')
    })
  })
})
```

### Feed Movements Service Test
```typescript
// tests/unit/feed-movements.test.ts (NEW)
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { recordFeedConsumption, createSuratJalan } from '../../server/src/modules/feed/feed.service'

describe('feed.service - movements', () => {
  const TENANT_ID = 1
  const USER_ID = 'user123'
  const PLASMA_ID = 1
  const PRODUCT_ID = 1

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('recordFeedConsumption', () => {
    it('should throw FeedProductNotFoundError when product does not exist', async () => {
      mockDb.transaction.mockImplementation(async (fn) => {
        const mockTx = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([]),
          innerJoin: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        }
        return fn(mockTx)
      })

      await expect(
        recordFeedConsumption({ plasmaId: PLASMA_ID, feedProductId: PRODUCT_ID, consumptionKg: 100 }, TENANT_ID, USER_ID)
      ).rejects.toThrow(FeedProductNotFoundError)
    })

    it('should throw NegativeStockError when consumption exceeds stock', async () => {
      mockDb.transaction.mockImplementation(async (fn) => {
        const mockTx = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([{ zakKgConversion: '50' }]), // Product exists
          innerJoin: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ totalOutKg: '0', totalInKg: '10', openingStockKg: '0', closingStockKg: '10' }]),
          for: vi.fn().mockReturnThis(),
        }
        return fn(mockTx)
      })

      await expect(
        recordFeedConsumption({ plasmaId: PLASMA_ID, feedProductId: PRODUCT_ID, consumptionKg: 100 }, TENANT_ID, USER_ID)
      ).rejects.toThrow(NegativeStockError)
    })
  })
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jest | Vitest | 2024 | Native ESM, Bun support, faster |
| enzyme | @testing-library/react | 2020 | Accessibility-first testing |
| Istanbul | V8/C8 coverage | 2022 | Native Node coverage |
| Mocha/Chai | Vitest built-in | 2024 | Single dependency |

**Deprecated/outdated:**
- **enzyme:** No longer maintained, use Testing Library
- **Jest:** Vitest is the standard for Bun/Node projects

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Client tests can use existing vitest config | Standard Stack | Config may need updates for path aliases |
| A2 | Security tests can mock Redis at unit level | Security Testing | May need integration test setup |
| A3 | 60% coverage is achievable with current tests | Coverage Target | May need additional service tests |

---

## Open Questions

1. **Should security tests be integration tests or unit tests?**
   - What we know: Rate limiting uses Redis, which is mocked in unit tests
   - What's unclear: Full security verification may require integration tests
   - Recommendation: Start with unit tests (mocked Redis), add integration tests if needed

2. **How to test MUI DataGrid?**
   - What we know: MUI DataGrid is complex, has its own testing utilities
   - What's unclear: Full DataGrid testing may be overkill for v1.0
   - Recommendation: Test the component rendering and row selection, not DataGrid internals

3. **API documentation generation approach?**
   - What we know: Routes defined in Elysia controllers with `t.Object` schemas
   - What's unclear: Automated API doc generation vs manual quick reference
   - Recommendation: Manual quick reference as per D-10-03

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| vitest | Server & client tests | ✓ | 3.1.0 | — |
| @testing-library/react | Client tests | ✓ | 16.3.0 | — |
| jsdom | Client tests | ✓ | 26.1.0 | — |
| bun | Running tests | ✓ | system | — |

**Missing dependencies with no fallback:**
- None identified — all test dependencies are installed

**Missing dependencies with fallback:**
- None identified

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.1.0 |
| Config file | `server/vitest.config.ts`, `client/vitest.config.ts` |
| Quick run command | `bun run test` (root) |
| Full suite command | `bun run --cwd server test` and `bun run --cwd client test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|---------------|
| REQ-10-01 | Server service tests | unit | `bun run --cwd server test` | Partial (9 files) |
| REQ-10-02 | Client component tests | unit | `bun run --cwd client test` | ❌ None |
| REQ-10-03 | Security verification | integration | `bun run --cwd server test` | ❌ None |
| REQ-10-04 | Documentation | N/A | Manual review | ❌ None |

### Sampling Rate
- **Per task commit:** `bun run --cwd server test`
- **Per wave merge:** Full suite (both server + client)
- **Phase gate:** Server coverage ≥ 60%

### Wave 0 Gaps
- [ ] `tests/unit/auth.test.ts` — covers auth.service tests
- [ ] `tests/unit/feed-movements.test.ts` — covers feed consumption tests
- [ ] `tests/unit/security.test.ts` — covers rate limit, tenant isolation
- [ ] `client/src/pages/units/__tests__/Units.test.tsx` — covers DataGrid page
- [ ] `client/src/pages/Login.test.tsx` — covers Login page
- [ ] `tests/fixtures/mocks.ts` — shared mock utilities

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Auth service tests, brute force protection |
| V3 Session Management | yes | Session validation tests |
| V4 Access Control | yes | RBAC + tenant isolation tests |
| V5 Input Validation | yes | Elysia t.Object schemas (already validated) |
| V6 Cryptography | yes | Argon2 password hashing tests |

### Known Threat Patterns for Elysia/Drizzle Stack

| Pattern | STRIDE | Standard Mitigation | Verification Test |
|---------|--------|---------------------|-------------------|
| SQL Injection | Tampering | Drizzle parameterized queries | Mock query params, verify no injection |
| Rate Limit Bypass | Denial of Service | Redis INCR/EXPIRE pattern | Test 429 at threshold |
| Auth Bypass | Spoofing | Session validation middleware | Test 401 without session |
| Tenant Isolation | Information Disclosure | tenantId in every query | Test cross-tenant returns empty |
| XSS | Tampering | CSP headers | Verify inline scripts blocked |
| CSRF | Tampering | Double-submit cookie | Verify CSRF token required |

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: npm registry] vitest@3.1.0 - testing framework
- [VERIFIED: npm registry] @testing-library/react@16.3.0 - React testing
- [CITED: vitest.dev/config] Vitest configuration patterns
- [CITED: testing-library.com] React Testing Library best practices

### Secondary (MEDIUM confidence)
- [WebSearch verified with official source] Vitest coverage configuration 2025
- [WebSearch verified with official source] MUI DataGrid testing patterns

### Tertiary (LOW confidence)
- [ASSUMED] Feed movements test patterns follow existing feed.test.ts
- [ASSUMED] Client test structure follows React Testing Library conventions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all packages verified on npm
- Architecture: HIGH - based on existing codebase patterns
- Pitfalls: HIGH - based on documented issues

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (30 days for stable tech)
