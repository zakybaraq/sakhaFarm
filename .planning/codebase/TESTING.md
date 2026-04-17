# Testing Patterns

**Analysis Date:** 2026-04-17

## Test Framework

### Runner
- **Framework:** vitest v3.1.0
- **Configuration:** 
  - Server: `server/vitest.config.ts`
  - Client: `client/vitest.config.ts`

### Server Test Config
```typescript
// server/vitest.config.ts
export default defineConfig({
  test: {
    include: ['../tests/**/*.test.ts'],
    environment: 'node',
    globals: true,
    setupFiles: ['../tests/setup.ts'],
  },
})
```

### Client Test Config
```typescript
// client/vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Run Commands
```bash
# Server tests
bun run test           # Run all server tests (vitest run)
bun run test:watch     # Watch mode

# Client tests
cd client && bun run test
cd client && bun run test:watch
```

## Test File Organization

### Location
- **Server tests:** `tests/unit/` (root level)
- **Client tests:** `client/src/` (co-located with source)

### Naming
- Pattern: `{feature}.test.ts` or `{feature}.test.tsx`
- Examples:
  - `tests/unit/cycle.test.ts`
  - `tests/unit/plasma.test.ts`
  - `client/src/App.test.tsx`

### Test Setup
- Server setup file: `tests/setup.ts`
- Configures environment variables via dotenv
- Mocks environment config:

```typescript
// tests/setup.ts
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(__dirname, '../server/.env') })

vi.mock('../../server/src/config/env', () => ({
  env: {
    PORT: 3000,
    NODE_ENV: 'test',
    DATABASE_URL: 'mysql://localhost:3306/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'test-secret-key-for-testing-purposes-only-32chars',
    CORS_ORIGIN: 'http://localhost:5173',
    RATE_LIMIT_LOGIN: 5,
    RATE_LIMIT_API: 100,
    RATE_LIMIT_HEAVY: 10,
  },
  validateEnv: vi.fn(() => ({})),
}))
```

## Test Structure

### Suite Organization
Tests are organized using `describe` blocks at two levels:
1. Module/Feature level (e.g., `describe('cycle.service.ts')`)
2. Function/method level (e.g., `describe('createCycle')`)

### Test Pattern
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('cycle.service.ts', () => {
  const TENANT_ID = 1
  const USER_ID = 'user123'
  const PLASMA_ID = 1

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createCycle', () => {
    it('should throw Error for invalid DOC type', async () => {
      // Test implementation
    })
  })
})
```

### Test Patterns Observed

**Positive Tests:**
- Valid inputs produce expected results
- Success return values (e.g., `{ success: true }`)

**Negative Tests:**
- Error classes thrown with correct messages
- Validation failures caught appropriately

**Mocking Pattern:**
- Use `vi.hoisted()` for module-level mock setup
- Mock database operations:
  ```typescript
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
  ```

**Mock Chain Pattern:**
Database methods return chainable mock objects:
```typescript
const mockSelect = {
  from: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([mockData]),
}
mockSelect.mockReturnValue(mockSelect as any)
```

## Mocking

### Database Mocking
The project mocks the database layer at `server/src/config/database`:

```typescript
vi.mock('../../server/src/config/database', () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    transaction: mockTransaction,
  },
}))
```

### Environment Mocking
Mocked in `tests/setup.ts`:
```typescript
vi.mock('../../server/src/config/env', () => ({
  env: { /* test values */ },
  validateEnv: vi.fn(() => ({})),
}))
```

### What to Mock
- **Database operations:** `db.select()`, `db.insert()`, `db.update()`, `db.transaction()`
- **Configuration:** Environment variables (`env` module)

### What NOT to Mock
- **Business logic:** Service functions under test
- **Error classes:** Custom error constructors
- **Utility functions:** Pure functions with no external dependencies

## Fixtures and Factories

### Test Data Pattern
Define test constants at the top of each test file:
```typescript
const TENANT_ID = 1
const USER_ID = 'user123'
const PLASMA_ID = 1
```

### Inline Fixtures
Mock data is created inline in test cases:
```typescript
const mockPlasma = { plasmas: { id: PLASMA_ID, capacity: 5000 } }
const mockCycle = { id: 1, plasmaId: PLASMA_ID, cycleNumber: 1, docType: 'CP', status: 'active' }
```

### Location
No dedicated fixture files found - all test data is inline

## Coverage

### Requirements
- **Not explicitly enforced** - no coverage threshold configured
- No coverage reporting tools configured

### View Coverage
No coverage command available in package.json

## Test Types

### Unit Tests
- **Focus:** Individual service functions
- **Location:** `tests/unit/` directory
- **Scope:** Business logic, error handling, validation

**Covered:**
- Error class construction
- Service function behavior (create, list, get, update, delete)
- Validation logic (DOC types, capacity checks)
- Status transitions

### Integration Tests
- **Not detected** in current test suite

### E2E Tests
- **Framework:** None configured
- **Not used** - project focuses on unit tests only

## Current Test Coverage

### Server Tests (Present)
- `tests/unit/cycle.test.ts` - 523 lines, comprehensive coverage of cycle operations
- `tests/unit/plasma.test.ts` - Plasma service tests
- `tests/unit/unit.service.test.ts` - Unit service tests
- `tests/unit/recordings.test.ts` - Recordings tests

### Client Tests (Minimal)
- `client/src/App.test.tsx` - Basic placeholder test:
  ```typescript
  describe('App', () => {
    it('should pass basic assertions', () => {
      expect(true).toBe(true)
    })
  })
  ```

### What's NOT Tested
- **Controllers:** No controller integration tests
- **Routes:** No HTTP-level testing
- **Plugins:** RBAC, tenant, session plugins not directly tested
- **Database schema:** No schema validation tests
- **Client components:** No React component tests beyond placeholder

## Common Patterns

### Async Testing
```typescript
it('should throw CycleNotFoundError when cycle does not exist', async () => {
  await expect(getCycle(999, TENANT_ID)).rejects.toThrow(CycleNotFoundError)
})

it('should create cycle with auto-calculated cycleNumber', async () => {
  const result = await createCycle(input, TENANT_ID, USER_ID)
  expect(result).toBeDefined()
  expect(result.cycleNumber).toBe(1)
})
```

### Error Testing
```typescript
it('should create error with correct message and name', () => {
  const error = new CycleNotFoundError(42)
  expect(error.message).toBe('Cycle "42" not found')
  expect(error.name).toBe('CycleNotFoundError')
})
```

### Mock Reset
```typescript
beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})
```

---

*Testing analysis: 2026-04-17*