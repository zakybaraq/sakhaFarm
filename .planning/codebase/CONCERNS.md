# Codebase Concerns

**Analysis Date:** 2026-04-17

## Tech Debt

**Audit Logging Fire-and-Forget:**
- Issue: Audit logging failures are silently caught and ignored in `recordings.service.ts` (lines 229-239, 433-444, 469-478), `auth.service.ts`, and other services
- Files: `server/src/modules/recordings/recordings.service.ts`, `server/src/modules/cycle/cycle.service.ts`, `server/src/modules/plasma/plasma.service.ts`
- Impact: Audit trail gaps; compliance violations; no visibility into logging failures
- Fix approach: Implement a proper audit queue with retry logic, or at minimum log failures to a secondary destination

**Duplicate Rate-Limiting Implementation:**
- Issue: Login rate limiting is implemented both in `auth.controller.ts` (lines 21-38) and in `rate-limit.ts` plugin, creating redundancy and potential for inconsistent behavior
- Files: `server/src/modules/auth/auth.controller.ts`, `server/src/plugins/rate-limit.ts`
- Impact: Maintenance confusion; inconsistent limits between controller-level and plugin-level enforcement
- Fix approach: Remove duplicate controller-level rate limiting and rely solely on the plugin-based approach

**Environment Validation Gaps:**
- Issue: `validateEnv()` in `env.ts` throws on missing required fields without descriptive messages; no runtime validation of Redis/MySQL connectivity at startup
- Files: `server/src/config/env.ts`
- Impact: Silent startup failures with cryptic errors; no health checks before accepting traffic
- Fix approach: Add startup connectivity checks for Redis and MySQL; enhance error messages

**Security Header Duplication:**
- Issue: Security headers defined in both `index.ts` (lines 17-25) and `security-headers.ts` plugin
- Files: `server/src/index.ts`, `server/src/plugins/security-headers.ts`
- Impact: Maintenance inconsistency; potential for drift
- Fix approach: Use only `security-headers.ts` plugin and remove inline headers from `index.ts`

**Password Generation Uses Math.random:**
- Issue: `generateTempPassword()` in `auth.service.ts` uses `Math.random()` which is not cryptographically secure
- Files: `server/src/modules/auth/auth.service.ts` (lines 126-133)
- Impact: Predictable temporary passwords; potential account takeover via password prediction
- Fix approach: Use `crypto.getRandomValues()` or Node's `crypto` module for secure random generation

## Known Bugs

**Tenant Validation Only on Header Presence:**
- Issue: `tenantPlugin` only validates tenant when `X-Tenant-ID` header is present; no automatic tenant assignment based on user's `tenantId` from session
- Files: `server/src/plugins/tenant.ts` (lines 8-36)
- Trigger: API calls without `X-Tenant-ID` header return null tenant without blocking access
- Workaround: Always include `X-Tenant-ID` header in client requests

**RBAC Permission Check Database Hit Per Request:**
- Issue: `requirePermission` performs a database query on every request to check permissions, even for cached roles
- Files: `server/src/plugins/rbac.ts` (lines 20-31)
- Impact: Performance degradation under load; no caching of permission lookups
- Workaround: None — requires implementation of permission caching

**Session Plugin Swallows Errors:**
- Issue: Session validation catches all errors and returns blank session without distinguishing between invalid session, expired, or infrastructure failures
- Files: `server/src/plugins/session.ts` (lines 34-41)
- Impact: No differentiation between auth failure types; debugging difficult
- Workaround: Add logging for caught errors

**Password Validation Regex Incomplete:**
- Issue: Password validation regex only checks for minimum requirements but doesn't enforce exclusion of common passwords
- Files: `server/src/modules/auth/auth.service.ts` (line 14-18)
- Impact: Weak passwords that meet format requirements but are easily guessable
- Workaround: Integrate a common password blacklist

## Security Considerations

**No Input Sanitization on User-Provided Data:**
- Risk: User `name` field, `notes` fields in recordings, and other text inputs are not sanitized for XSS when rendered in client
- Files: `server/src/modules/auth/auth.controller.ts`, `server/src/modules/recordings/recordings.service.ts`
- Current mitigation: Content-Security-Policy header in place
- Recommendations: Add server-side sanitization; validate max lengths strictly

**CSRF Check Missing for GET Requests:**
- Risk: `verifyRequestOrigin` in `index.ts` only runs for non-GET requests, potentially allowing CSRF on state-changing GET (e.g., logout)
- Files: `server/src/index.ts` (lines 30-37)
- Current mitigation: Same-site cookie attribute
- Recommendations: Consider applying origin verification to all mutating methods including GET if used for actions

**No Rate Limiting on Registration Endpoint:**
- Risk: Registration endpoint has no rate limiting, allowing mass account creation
- Files: `server/src/modules/auth/auth.controller.ts` (lines 41-60)
- Current mitigation: None detected
- Recommendations: Add rate limiting to `/api/auth/register`

**Sensitive Data in JWT Not Excluded:**
- Risk: JWT payload includes user data that may be logged or exposed; unclear if JWT is used only for internal session or also for API auth
- Files: `server/src/auth/lucia.ts`, `server/src/modules/auth/auth.service.ts`
- Current mitigation: Cookies use httpOnly; session stored in DB
- Recommendations: Audit JWT usage; ensure no sensitive data in JWT claims if used externally

**Missing Audit Trail for Role/Permission Changes:**
- Risk: RBAC module changes to roles and permissions are not logged
- Files: `server/src/modules/rbac/rbac.service.ts`
- Current mitigation: Audit logs exist for recordings only
- Recommendations: Add audit logging for all RBAC modifications

**No HTTPS Enforcement in Development Config:**
- Risk: Security headers include HSTS but development environment may not enforce HTTPS
- Files: `server/src/plugins/security-headers.ts`, `server/src/config/env.ts`
- Current mitigation: HSTS only applies in production (conditional on NODE_ENV)
- Recommendations: Document HTTPS requirement for production

## Performance Bottlenecks

**Redis Not Used for Session Storage:**
- Problem: Sessions stored in MySQL via `Mysql2Adapter` despite Redis being available; comment in `lucia.ts` indicates Redis remains available "for caching and rate limiting"
- Files: `server/src/auth/lucia.ts` (lines 1-14)
- Cause: MySQL session storage requires DB round-trip on every authenticated request
- Improvement path: Migrate to `@lucia-auth/adapter-session-redis` for in-memory session storage (dependency already in package.json)

**N+1 Query Pattern in Recording Metrics:**
- Problem: `getRecording()` and `createRecording()` make multiple sequential database queries for cumulative statistics
- Files: `server/src/modules/recordings/recordings.service.ts` (lines 194-214, 315-327)
- Cause: No aggregation queries combining metrics
- Improvement path: Use SQL subqueries or window functions for cumulative calculations

**No Query Pagination:**
- Problem: `listRecordings()` returns all records for a cycle without pagination
- Files: `server/src/modules/recordings/recordings.service.ts` (lines 259-284)
- Cause: No limit/offset applied
- Improvement path: Add pagination parameters; implement cursor-based pagination for large datasets

**Missing Database Indexes:**
- Problem: Several frequently queried columns may lack indexes (e.g., `daily_recordings.cycleId`, `daily_recordings.recordingDate` for time-range queries)
- Files: `server/src/db/schema/daily_recordings.ts`
- Cause: Indexes not defined in schema
- Improvement path: Add indexes for `cycleId` + `recordingDate` composite index

## Fragile Areas

**Tenant Isolation Relies on Header:**
- Files: `server/src/plugins/tenant.ts`
- Why fragile: If client fails to send `X-Tenant-ID`, queries may return data from wrong tenant or no tenant; no default fallback to session tenant
- Safe modification: Ensure all controllers check `ctx.tenantId` before querying; add validation that rejects requests without valid tenant for non-admin users
- Test coverage: Missing — no tenant isolation tests

**RBAC Require Permission Not Integrated:**
- Files: `server/src/plugins/rbac.ts`, `server/src/modules/*/`
- Why fragile: `requirePermission()` function exists but is not applied to any routes; all endpoints rely on session presence only
- Safe modification: Apply `requirePermission` decorator to create/update/delete routes in each controller
- Test coverage: Missing — no permission enforcement tests

**Password Reset Returns Plain Text Password:**
- Files: `server/src/modules/auth/auth.controller.ts` (lines 155-174), `server/src/modules/auth/auth.service.ts` (lines 206-227)
- Why fragile: Temporary password returned in API response; should be communicated via secure channel
- Safe modification: Return only confirmation; send password via email or show once in UI with confirmation flow
- Test coverage: Missing

## Scaling Limits

**Session Storage in MySQL:**
- Current capacity: ~10,000 concurrent sessions before performance degradation (estimated)
- Limit: DB connection pool exhaustion; query latency under high load
- Scaling path: Migrate to Redis session adapter; implement session cleanup cron job

**Single-Tenant Database Architecture:**
- Current capacity: Single MySQL instance with tenant_id column for isolation
- Limit: No horizontal scaling; tenant data not physically isolated
- Scaling path: Consider multi-tenant database architecture (schema per tenant or database per tenant) for larger deployments

**In-Memory Rate Limiting with Redis:**
- Current capacity: 100 requests/minute per IP (configurable)
- Limit: Redis latency under extreme load; no distributed rate limiting across multiple API instances
- Scaling path: Implement sliding window algorithm; consider Redis Cluster

## Dependencies at Risk

**Lucia Auth v3.2.2:**
- Risk: Active development; breaking changes possible in minor versions; limited documentation compared to v2
- Impact: Authentication breakage on upgrade
- Migration plan: Pin to specific version; review changelog before upgrades; consider migrating to Auth.js if it gains better Elysia support

**Elysia v1.4.0:**
- Risk: Newer framework with evolving API; type definitions may change
- Impact: Compile errors on upgrade; runtime behavior changes
- Migration plan: Pin version; monitor Elysia changelog

**Drizzle ORM v0.44.0:**
- Risk: Recent version with potential undiscovered bugs
- Impact: Query failures; migration issues
- Migration plan: Test thoroughly with staging data before production deployment

**@node-rs/argon2 v2.0.2:**
- Risk: Native module; potential compatibility issues with Node/Bun versions
- Impact: Build failures; password hashing failures
- Migration plan: Test on target deployment environment early

## Missing Critical Features

**Multi-Factor Authentication (MFA):**
- Problem: No MFA support; single-factor authentication only
- Blocks: Enterprise compliance requirements; high-security use cases

**Password Expiry Policy:**
- Problem: No automatic password expiration; only manual force password change via admin
- Blocks: Compliance with password rotation policies

**API Key Authentication:**
- Problem: No support for API keys; only session-based auth
- Blocks: System-to-system integrations; programmatic access

**Webhooks:**
- Problem: No webhook system for external integrations
- Blocks: Real-time notifications to external systems; ERP integrations

**Data Export:**
- Problem: No bulk data export functionality
- Blocks: Reporting; data backup; migration to other systems

**Audit Log Viewer:**
- Problem: Audit logs exist in database but no UI to view them
- Blocks: Compliance reporting; security monitoring

## Test Coverage Gaps

**No Permission Enforcement Tests:**
- What's not tested: RBAC `requirePermission` decorator is never used in routes; no tests verify permission-based access control
- Files: `server/src/plugins/rbac.ts`, all route files in `server/src/modules/*/`
- Risk: Broken permission checks go undetected; unauthorized access possible
- Priority: High

**No Tenant Isolation Tests:**
- What's not tested: Cross-tenant data leakage; tenant header spoofing
- Files: `server/src/plugins/tenant.ts`, all service files
- Risk: Data from one tenant accessible to another
- Priority: High

**No Rate Limiting Tests:**
- What's not tested: Rate limit enforcement; blocked request behavior
- Files: `server/src/plugins/rate-limit.ts`
- Risk: Rate limiting not working; DoS vulnerability
- Priority: Medium

**No Session Invalidation Tests:**
- What's not tested: Session revocation; force logout behavior; session expiration
- Files: `server/src/modules/auth/auth.service.ts`
- Risk: Users not properly logged out; sessions persist incorrectly
- Priority: Medium

**No Input Validation Tests:**
- What's not tested: Zod schema validation; malformed request handling
- Files: All controller files with body validation
- Risk: Invalid data accepted; potential injection attacks
- Priority: Medium

---

*Concerns audit: 2026-04-17*