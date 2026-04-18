---
phase: 05-data-integration
plan: '03'
subsystem: audit-log
tags: [api-connection, blocker]
dependency_graph:
  requires: []
  provides:
    - client/src/pages/admin/AuditLog.tsx
  affects: []
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  modified:
    - client/src/pages/admin/AuditLog.tsx
decisions: []
---

# Phase 05 Plan 03: Connect AuditLog to API Summary

## Objective

Connect AuditLog page to API - replace DUMMY_AUDIT with real audit data.

## Status: BLOCKED

**Reason**: Backend `/api/audit` endpoint does not exist.

## Investigation Results

### Backend Audit Infrastructure (Verified)
1. **Schema exists**: `server/src/db/schema/audit_logs.ts` with proper schema
   - Columns: userId, action, resource, resourceId, oldValue, newValue, ipAddress, userAgent, createdAt
   - Indexes on: userId, action, createdAt, resource

2. **Services write audit logs**: Verified multiple services insert audit entries:
   - `feed.service.ts` - feed operations
   - `plasma.service.ts` - plasma CRUD
   - `cycle.service.ts` - cycle operations
   - `unit.service.ts` - unit CRUD
   - `recordings.service.ts` - daily recordings

3. **Permission exists**: `audit.read` permission defined in `server/src/db/seed/rbac.ts`

### Missing Components
- **No API controller**: No `/api/audit` route in `server/src/modules/`
- **No audit query service**: No service to query/filter audit logs by date, user, action, resource

### Frontend State
- `client/src/pages/admin/AuditLog.tsx` uses hardcoded `mockAuditLogs` array
- No API call present

## Blocker Details

The backend lacks an API endpoint to query audit logs. The plan's success criteria explicitly states:

> "If backend has /api/audit - connect to it. If not - document as blocker"

Creating the backend endpoint would require:
1. New service: `server/src/modules/audit/audit.service.ts`
2. New controller: `server/src/modules/audit/audit.controller.ts`
3. New routes: `server/src/modules/audit/audit.routes.ts`
4. Register in `server/src/index.ts`

This is outside the scope of this plan which only specifies `client/src/pages/admin/AuditLog.tsx` in `files_modified`.

## Deviation Documentation

### Blockers

**1. Backend API endpoint missing**
- **Location**: server/src/modules/
- **Issue**: No `/api/audit` endpoint exists
- **Impact**: Cannot connect frontend to real data
- **Recommendation**: Create new audit module with query endpoints, or add audit routes to existing module
- **Files needed**: audit.service.ts, audit.controller.ts, audit.routes.ts
- **Scope**: Backend work required (outside this plan)

## Self-Check: PASSED

- Investigation completed: ✅
- Blocker documented: ✅
- No incorrect claims made