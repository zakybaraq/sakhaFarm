---
phase: 05-data-integration
reviewed: 2026-04-18T11:48:10+07:00
depth: standard
files_reviewed: 9
files_reviewed_list:
  - server/src/modules/audit/audit.service.ts
  - server/src/modules/audit/audit.controller.ts
  - server/src/modules/audit/audit.routes.ts
  - server/src/modules/audit/audit.errors.ts
  - server/src/index.ts
  - client/src/pages/rbac/RbacManager.tsx
  - client/src/pages/recordings/DailyRecording.tsx
  - client/src/pages/admin/AuditLog.tsx
  - client/src/api/rbac.ts
findings:
  critical: 2
  warning: 1
  info: 3
  total: 6
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-04-18T11:48:10+07:00
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Reviewed all Phase 5 data-integration source changes including the new AuditLog API endpoints, RbacManager API integration, and DailyRecording cycle API integration. Found 2 critical bugs that will cause runtime crashes, 1 major issue with stubbed code, and 3 minor code quality issues. The audit module has good security (RBAC, anti full-table-scan protection), but missing imports and missing error handling need fixes.

## Critical Issues

### CR-01: Missing `count` Import Causes Runtime Crash

**File:** `server/src/modules/audit/audit.service.ts:78`
**Issue:** The `count()` function is used in the query but never imported from drizzle-orm. This will cause a `ReferenceError` at runtime when `countAuditLogs()` is called.

**Fix:**
```typescript
// Line 3 - add count to imports
import { desc, eq, and, gt, lt, gte, lte, isNull, like, count } from 'drizzle-orm'
```

### CR-02: Unhandled Date Parsing Will Crash on Invalid Input

**File:** `server/src/modules/audit/audit.controller.ts:60-61`
**Issue:** `new Date(startDate)` and `new Date(endDate)` are called without try/catch. Invalid date strings (e.g., "?date=abc") will throw an unhandled `RangeError: Invalid Date` and crash the request.

**Fix:**
```typescript
// Replace lines 60-61 with:
if (startDate) {
  const parsed = new Date(startDate)
  if (isNaN(parsed.getTime())) {
    throw new AuditQueryTooBroadError() // or create InvalidDateError
  }
  filters.startDate = parsed
}
if (endDate) {
  const parsed = new Date(endDate)
  if (isNaN(parsed.getTime())) {
    throw new AuditQueryTooBroadError()
  }
  filters.endDate = parsed
}
```

## Warnings

### WR-01: Stubbed API Submission in DailyRecording

**File:** `client/src/pages/recordings/DailyRecording.tsx:100-101`
**Issue:** The form submission is stubbed with a delay - it only logs data to console and doesn't actually call any API endpoint. This means recording data is never persisted.

**Fix:**
```typescript
// Add real API call - import/create createRecording function
import { createRecording } from '../../api/recordings'

const onSubmit = async (data: RecordingFormData) => {
  setIsSubmitting(true)
  try {
    await createRecording({
      ...data,
      cycleId: Number(data.cycleId),
      tenantId: user!.tenantId,
    })
    setSubmitSuccess(true)
    setTimeout(() => setSubmitSuccess(false), 3000)
  } catch (err) {
    console.error('Failed to submit:', err)
    // Add user-facing error handling
  } finally {
    setIsSubmitting(false)
  }
}
```

## Info

### IN-01: Dead Code - Unused mockUsers Array

**File:** `client/src/pages/rbac/RbacManager.tsx:81-87`
**Issue:** The `mockUsers` constant is defined but never used. Users now come from the API via `useQuery` at line 109. This is dead code that should be removed.

**Fix:**
```typescript
// Remove lines 81-87 (mockUsers array)
```

### IN-02: Missing Error Handling in Role Mutations

**File:** `client/src/pages/rbac/RbacManager.tsx:141-154`
**Issue:** The `createRole`, `updateRole`, and `deleteRole` mutations don't handle error states. If the API call fails, there's no feedback to the user.

**Fix:**
```typescript
const createRoleMutation = useMutation({
  mutationFn: createRole,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['roles'] })
    setRoleDialogOpen(false)
  },
  onError: (error) => {
    // Add error toast/alert
    console.error('Failed to create role:', error)
  },
})
```

### IN-03: Delete Action Doesn't Call API

**File:** `client/src/pages/rbac/RbacManager.tsx:173-177`
**Issue:** The delete role button at line 173-177 confirms with `window.confirm()` but only removes the role from local state (`setRoles(roles.filter(...))`) without calling the `deleteRoleMutation`. The role won't be deleted on the server.

**Fix:**
```typescript
<IconButton size="small" color="error" onClick={(e) => {
  e.stopPropagation()
  if (window.confirm(`Delete role "${params.row.name}"?`)) {
    deleteRoleMutation.mutate(params.row.id, {
      onSuccess: () => {
        // Role deleted - query already invalidated
      },
    })
  }
}}>
  <DeleteIcon fontSize="small" />
</IconButton>
```

---

_Reviewed: 2026-04-18T11:48:10+07:00_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_