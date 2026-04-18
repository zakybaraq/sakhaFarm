---
phase: "10-testing"
reviewed: 2026-04-18T12:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - tests/unit/security.test.ts
  - tests/unit/auth.test.ts
  - tests/unit/inventory.test.ts
  - tests/unit/feed.test.ts
  - tests/unit/reporting.test.ts
  - tests/unit/password.test.ts
  - tests/unit/rbac-users.test.ts
  - tests/unit/cycle.test.ts
  - tests/unit/recordings.test.ts
  - tests/unit/unit.service.test.ts
  - tests/unit/plasma.test.ts
findings:
  critical: 2
  warning: 9
  info: 12
  total: 23
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-04-18T12:00:00Z
**Depth:** standard
**Files Reviewed:** 11 test files
**Status:** issues_found

## Summary

Test suite uses an incompatible mocking pattern that was broken by Vitest 3.x updates. The core issue is that `vi.hoisted()` combined with `vi.mock()` does not work correctly with Vitest 3.x due to changes in how mocks are hoisted and resolved. This causes 46 tests to fail with errors like `mockSelect2.mockReturnValue is not a function` and `db.select(...).from is not a function`.

Additionally, `plasma.test.ts` uses integration tests that pollute the database with real data, and several test files use inline mock anti-patterns that don't work with Vitest.

## Critical Issues

### CR-01: Incompatible Mocking Pattern with Vitest 3.x

**Files:** auth.test.ts, inventory.test.ts, feed.test.ts
**Issue:** The `vi.hoisted()` + `vi.mock()` pattern is fundamentally incompatible with Vitest 3.x. In Vitest 3.x, the mocking system was changed:
- `vi.hoisted()` creates mocks after imports but `vi.mock()` hoists mock factories to the top of the file
- The hoisted mock functions from `vi.hoisted()` are not available in the correct scope when the mock factory runs
- This causes mocks to be undefined or to lose their mock functionality

**Evidence:**
```
TypeError: mockSelect2.mockReturnValue is not a function
TypeError: db.select(...).from is not a function
```

**Root Cause:** The `vi.hoisted()` pattern creates mock functions dynamically, but Vitest 3.x requires mock functions to be defined at the top level before `vi.mock()` factories execute.

**Fix:** Remove `vi.hoisted()` and define mocks directly. Use module-level mock objects or inline `vi.fn()` patterns:

```typescript
// Before (BROKEN in Vitest 3.x):
const { mockSelect, mockInsert, mockUpdate, mockTransaction } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
  // ...
}))

vi.mock('../../server/src/config/database', () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
  },
}))

// After (CORRECT):
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockTransaction = vi.fn()

vi.mock('../../server/src/config/database', () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    transaction: mockTransaction,
  },
}))
```

---

### CR-02: Integration Tests Using Real Database in plasma.test.ts

**File:** tests/unit/plasma.test.ts (lines 57-242)
**Issue:** This test file uses `beforeAll` and `afterAll` hooks that create and delete real database records without mocking the database. This:
- Causes test pollution (tests 9999 tenant/unit/plasma IDs)
- Makes tests order-dependent (can fail if run in different order)
- Requires database to be running and accessible
- Can fail due to schema mismatch or foreign key constraints

**Evidence:** Lines 57-79 use real `db.insert()` and `db.delete()` operations

**Fix:** Rewrite to use pure unit test mocking approach:

```typescript
// Mock the database and schema modules
vi.mock('../../server/src/config/database', () => ({
  db: { /* mocked methods */ },
}))

vi.mock('../../server/src/db/schema/plasmas', () => ({
  plasmas: { /* mock schema */ },
}))

// OR: Wrap in describe blocks with proper beforeEach/afterEach for cleanup
```

---

## Warnings

### WR-01: Inline Mock Pattern Anti-Pattern in unit.service.test.ts

**File:** tests/unit/unit.service.test.ts (lines 76-274)
**Issue:** Tests create mock objects inside test cases using `vi.fn().mockReturnThis()`. This pattern:
- Creates new mocks for each test, making tests order-independent but inefficient
- Doesn't properly reset mocks between tests (uses `vi.clearAllMocks()` but inline mocks are created fresh)
- Makes tests harder to maintain and read

**Affected tests:** `createUnit`, `listUnits`, `getUnit`, `updateUnit`, `softDeleteUnit`

**Fix:** Use module-level mock definitions at the top of the describe block:

```typescript
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockSelect.mockReturnValue({ /* default mock chain */ })
})
```

---

### WR-02: Inline Mock Pattern in cycle.test.ts

**File:** tests/unit/cycle.test.ts (lines 120-537)
**Issue:** Same issue as WR-01 - uses inline mocks for `createCycle`, `listCycles`, `getCycle`, etc.

The cycle.test.ts uses BOTH hoisted mocks AND inline mocks, creating confusion:
- Lines 20-34: `vi.hoisted()` - but doesn't work with Vitest 3.x
- Lines 121-127, 139-145: Inline `vi.fn()` mocks in test cases

**Fix:** Consolidate to single module-level mock pattern:

```typescript
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()

// Then configure in beforeEach
beforeEach(() => {
  mockSelect.mockReturnValue({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    leftJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
  })
})
```

---

### WR-03: Duplicate describe Block in cycle.test.ts

**File:** tests/unit/cycle.test.ts (lines 212-240, 276-303)
**Issue:** The `describe('getCycle')` block appears twice in the file:
- First occurrence: lines 212-240
- Second occurrence: lines 276-303

This is duplicate code that may cause confusion about which tests run.

**Fix:** Merge the duplicate describe blocks into single block with combined tests:
```typescript
describe('getCycle', () => {
  it('should throw CycleNotFoundError when cycle does not exist', async () => { /* ... */ })
  it('should return cycle when found', async () => { /* ... */ })
  it('should filter by plasmaId when provided', async () => { /* from listCycles tests */ })
})
```

---

### WR-04: Missing Mock Reset Between Tests in inventory.test.ts

**File:** tests/unit/inventory.test.ts
**Issue:** Uses `vi.hoisted()` pattern but doesn't properly configure mock return values in `beforeEach()`. This can cause test pollution when mock return values persist between tests.

**Fix:** Configure mock return values in `beforeEach()`:
```typescript
beforeEach(() => {
  vi.clearAllMocks()
  mockSelect.mockReturnValue([])
  mockTransaction.mockResolvedValue({ insertId: 1 })
})
```

---

### WR-05: Inconsistent Mock Pattern in feed.test.ts

**File:** tests/unit/feed.test.ts (lines 20-34)
**Issue:** Uses `vi.hoisted()` but doesn't work with Vitest 3.x. Additionally:
- Tests create mock return values inline at line 106, 114, etc.
- Mix of hoisted + inline patterns causes unpredictable mock behavior

**Affected Tests:** All `feed.service.ts` tests

**Fix:** Follow the standard module-level mock pattern as described in CR-01 fix.

---

### WR-06: Unused mockInsert in inventory.test.ts

**File:** tests/unit/inventory.test.ts (line 4-7)
**Issue:** `mockInsert` and `mockTransaction` are declared in hoisted mocks but never used in tests. The mock object in `vi.mock()` includes them but tests only use `mockSelect`.

**Fix:** Remove unused mocks from declaration:
```typescript
const { mockSelect } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
}))
// Remove mockInsert/mockTransaction if not used
```

---

### WR-07: Mock Return Value Not Set in auth.test.ts

**File:** tests/unit/auth.test.ts (line 52-53)
**Issue:** Tests set mock return values inline but don't properly configure the method chain:

```typescript
mockSelect.mockReturnValue([mockUser] as any)
mockRedis.get.mockResolvedValue(null)  // get/set/del are separate objects
```

This suggests the redis mock structure doesn't match how the actual auth service uses redis.

**Fix:** Verify actual service calls and configure mock correctly:
```typescript
mockRedis.get.mockResolvedValue(null)
mockRedis.set.mockResolvedValue('OK')
mockRedis.del.mockResolvedValue(1)
```

---

### WR-08: No Error Assertion in feed.test.ts

**File:** tests/unit/feed.test.ts (line 149-154)
**Issue:** Test expects result to equal mockProduct but doesn't verify the call was made to mockSelect:

```typescript
mockSelect.mockReturnValue([mockProduct] as any)
const result = await getFeedProduct(1, TENANT_ID)
expect(result).toEqual(mockProduct)
// Missing: expect(mockSelect).toHaveBeenCalled()
```

**Fix:** Add assertion that verifies the mock was called:
```typescript
expect(mockSelect).toHaveBeenCalled()
expect(mockSelect).toHaveBeenCalledWith(1, TENANT_ID) // if service accepts these
```

---

### WR-09: Duplicate Tests in cycle.test.ts

**File:** tests/unit/cycle.test.ts
**Issue:** Tests are duplicated between listCycles block (lines 193-274) and getCycle block (lines 276-303):
- Both check: `should throw CycleNotFoundError when cycle does not exist`
- Both check: `should return cycle when found`

This is dead code / copy-paste issue that wastes test execution time.

**Fix:** Remove duplicate test blocks and merge into appropriate describe sections.

---

## Info

### IN-01: Test Coverage - Security Config Tests

**File:** tests/unit/security.test.ts
**Issue:** Tests only verify static configuration values, not actual security behavior:
- No test for actual rate limiting behavior
- No test for security headers middleware
- No test for tenant isolation queries

**Suggestion:** Add integration tests for security middleware if needed, or acknowledge these are "config smoke tests" only.

---

### IN-02: Test Coverage - Password Generation

**File:** tests/unit/password.test.ts (lines 70-72)
**Issue:** Test checks for digits 2-9 but not 0 or 1, potentially missing edge cases in random generation:

```typescript
it('should contain at least one digit', () => {
  const password = generateTempPassword()
  expect(password).toMatch(/[2-9]/)  // Why exclude 0 and 1?
})
```

**Suggestion:** Either allow all digits or document why 0,1 are excluded (if intentional for some reason).

---

### IN-03: Test Coverage - CSV Escaping Edge Cases

**File:** tests/unit/reporting.test.ts
**Issue:** Tests escape for commas and quotes but missing:
- Newline escape test
- Multiple consecutive escape characters (e.g., `""""`)
- Empty values

**Suggestion:** Add edge case tests if CSV export is mission-critical.

---

### IN-04: Missing Test for Session Expiry in auth.test.ts

**File:** tests/unit/auth.test.ts
**Issue:** No test for session expiration handling - only tests successful login/logout.

**Suggestion:** Add test for expired session handling if session expiry is implemented.

---

### IN-05: Test Coverage - RBAC Error Messages

**File:** tests/unit/rbac-users.test.ts
**Issue:** Tests verify error.message but not error.cause or error.code properties.

**Suggestion:** Document what error properties are expected and test them.

---

### IN-06: No Test for Duplicate Cycle Numbers

**File:** tests/unit/cycle.test.ts
**Issue:** Tests `createCycle` but doesn't test duplicate cycle number prevention for same plasma.

**Suggestion:** Add test for auto-increment logic edge cases.

---

### IN-07: Test Coverage - Recording CSV Import

**File:** tests/unit/recordings.test.ts
**Issue:** Limited coverage:
- No test for large file performance boundary (1000 rows)
- No test for malformed dates like Feb 30

**Suggestion:** Add boundary tests.

---

### IN-08: Unused Import in unit.service.test.ts

**File:** tests/unit/unit.service.test.ts
**Issue:** `mockTransaction` imported and mocked but never used in tests.

**Fix:** Remove from hoisted declaration or add usage.

---

### IN-09: Hardcoded Test Values

**File:** tests/unit/password.test.ts
**Issue:** Test uses hardcoded password "Password1!" - could use property-based testing with multiple values.

**Suggestion:** Consider using vitest's `it.each()` for parameterized tests.

---

### IN-10: Unused describe Block in recordings.test.ts

**File:** tests/unit/recordings.test.ts (lines 186-192)
**Issue:** `describe('recordings.errors.ts - CycleNotFoundError')` duplicates functionality already covered in cycle.test.ts.

**Suggestion:** Remove duplicate or document why cycle-specific errors are tested twice.

---

### IN-11: Missing Error Handling Test in feed.test.ts

**File:** tests/unit/feed.test.ts
**Issue:** `createSuratJalan` is imported but never tested (line 15).

**Fix:** Add tests for Surat Jalan functionality or remove unused imports.

---

### IN-12: Test Setup File Missing Global Mocks

**File:** tests/setup.ts
**Issue:** Setup file only loads env but doesn't provide common mocks needed by tests:
- `vi.fn()` is not properly set up for all tests
- Missing common mock utilities

**Suggestion:** Add common test utilities to setup file:
```typescript
// In setup.ts
globalThis.createMockDb = () => ({
  select: vi.fn().mockReturnValue({ from: vi.fn() }),
  insert: vi.fn().mockReturnValue({ values: vi.fn() }),
  update: vi.fn().mockReturnValue({ set: vi.fn() }),
  delete: vi.fn().mockReturnValue({ where: vi.fn() }),
})
```

---

## Root Cause Analysis Summary

| Issue Pattern | Affected Files | Count | Severity |
|--------------|-------------|-------|----------|
| vi.hoisted() + vi.mock() incompatible | auth, inventory, feed | 3 | CRITICAL |
| Real database in tests | plasma.test.ts | 1 | CRITICAL |
| Inline mock anti-pattern | unit.service, cycle | 2 | WARNING |
| Duplicate test blocks | cycle.test.ts | 1 | WARNING |
| Missing mock reset | inventory, feed | 2 | WARNING |
| Missing assertions | feed, auth, cycle | 3 | WARNING |

---

## Recommended Fix Priority

1. **Immediate:** Fix CR-01 - Replace `vi.hoisted()` pattern in auth/inventory/feed tests with module-level mocks
2. **Immediate:** Fix CR-02 - Add mocking to plasma.test.ts or mark as integration tests
3. **High:** Fix WR-01, WR-02 - Standardize mock pattern in unit.service/cycle tests
4. **Medium:** Fix WR-03, WR-09 - Remove duplicate code
5. **Low:** Add IN-* suggestions for additional coverage

---

_Reviewed: 2026-04-18T12:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_