---
phase: 11
reviewed: 2026-04-18T12:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - tests/unit/cycle.test.ts
  - tests/unit/unit.service.test.ts
  - server/src/modules/auth/auth.controller.ts
  - server/src/plugins/rate-limit.ts
findings:
  critical: 1
  warning: 0
  info: 1
  total: 2
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-04-18T12:00:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed 4 files changed in Phase 11 (Test Suite Completion & Security Hardening). Found 1 critical security issue in rate-limit.ts IP extraction logic, and 1 info-level finding about test mock patterns. The test file fixes correctly address Vitest 3.x compatibility.

## Critical Issues

### CR-01: Rate Limit IP Extraction Security Regression

**File:** `server/src/plugins/rate-limit.ts:22-24`
**Issue:** The IP extraction logic changed from using the rightmost (proxy-added) IP to the first (client-controlled) IP in the X-Forwarded-For chain. This introduces a security vulnerability.

**Old code:**
```typescript
const rightmostIp = ips[ips.length - 1]
if (rightmostIp) return rightmostIp
```

**New code:**
```typescript
const firstIp = ips[0]
if (firstIp) return firstIp
```

**Security Impact:** When `TRUST_PROXY=true`, the application now trusts the first IP in the X-Forwarded-For header, which is client-controlled and can be spoofed. Only the last IP (added by the trusted reverse proxy) should be trusted.

**Fix:** Revert to using the rightmost IP:
```typescript
const rightmostIp = ips[ips.length - 1]
if (rightmostIp) return rightmostIp
```

## Info

### IN-01: Test Mock Pattern - Good Fix

**File:** `tests/unit/cycle.test.ts:20-47`, `tests/unit/unit.service.test.ts:15-40`
**Issue:** The `vi.hoisted()` pattern was correctly replaced with module-level mock objects to fix Vitest 3.x compatibility.

**Assessment:** This is the correct fix. The new pattern:
- Creates a `mockDb` object with properly chainable methods at module level
- Uses `vi.mock()` with the mock object directly
- Allows individual tests to override return values with `mockReturnValue()`

The fix properly addresses the Vitest 3.x breaking change where `vi.hoisted()` + `vi.mock()` combination no longer works correctly.

---

_Reviewed: 2026-04-18T12:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_