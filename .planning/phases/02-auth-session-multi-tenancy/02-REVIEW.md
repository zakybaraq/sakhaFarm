# Phase 2 Code Review — Auth, Session & Multi-Tenancy

**Reviewer**: Automated code review  
**Date**: 2026-04-17  
**Scope**: Phase 2.01–2.04 (Auth, Session, RBAC, Rate Limiting, Security Headers)  
**Files reviewed**: 10 source files  

---

## Summary

Phase 2 implements authentication (Lucia v3), session management, multi-tenant isolation, RBAC, rate limiting, and security headers. The architecture is sound — Lucia for session management, Redis for rate limiting, Argon2id for hashing. However, there are **critical security vulnerabilities** (missing auth on session deletion, insecure temp password generation, missing RBAC enforcement on admin endpoints) and several high-severity logic bugs that must be fixed before production.

---

## Findings

### 🔴 CRITICAL

#### C-01: Unauthenticated session deletion endpoint
**File**: `auth.controller.ts:187-189`  
**Line**: `DELETE /sessions/:id`

```typescript
.delete('/sessions/:id', async ({ params }) => {
  await revokeSession(params.id)
  return { success: true }
})
```

**Issue**: This endpoint has **zero authentication**. Any unauthenticated user can delete any session by ID. No session validation, no ownership check, no RBAC guard. An attacker can revoke sessions for any user.

**Fix**: Add session validation and ownership verification:
```typescript
.delete('/sessions/:id', async ({ cookie, params }) => {
  const sessionId = cookie.auth_session?.value as string | undefined
  if (!sessionId) return { error: 'Not authenticated' }
  const { user, session } = await validateUserSession(sessionId)
  if (!user || !session) return { error: 'Session expired' }
  // Verify the session belongs to this user or user is admin
  const targetSession = await db.select().from(sessions).where(eq(sessions.id, params.id)).limit(1)
  if (targetSession.length === 0) return { error: 'Session not found' }
  if (targetSession[0].userId !== user.id && user.roleId !== SUPER_ADMIN_ROLE_ID) {
    return { error: 'Forbidden' }
  }
  await revokeSession(params.id)
  return { success: true }
})
```

---

#### C-02: Insecure temporary password generation using `Math.random()`
**File**: `auth.service.ts:126-133`

```typescript
export function generateTempPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
```

**Issue**: `Math.random()` is **not cryptographically secure**. It uses a PRNG that can be predicted. A dedicated `lib/password.ts` file already exists with a secure `generateTempPassword()` using `oslo/crypto`'s `generateRandomInteger`, but `auth.service.ts` defines its own **duplicate, insecure version** and uses it instead.

**Fix**: Remove the insecure `generateTempPassword()` from `auth.service.ts` and import the secure one from `lib/password.ts`:
```typescript
import { generateTempPassword, validatePasswordStrength } from '../../lib/password'
```

---

#### C-03: Admin password reset returns temporary password in API response
**File**: `auth.controller.ts:166-168`

```typescript
const tempPassword = await adminResetPassword(body.userId, user.id)
return { success: true, tempPassword }
```

**Issue**: The temporary password is returned **in the HTTP response body**. This means:
1. It's visible in server logs, proxy logs, and browser dev tools
2. Any MITM attacker can intercept it
3. It violates the principle that passwords should never be transmitted in clear text in API responses

**Fix**: Remove `tempPassword` from the response. Instead, send it via a secure out-of-band channel (email, SMS) or require the admin to set a password directly:
```typescript
return { success: true } // Remove tempPassword from response
```

---

#### C-04: Missing RBAC enforcement on admin reset-password endpoint
**File**: `auth.controller.ts:155-174`

**Issue**: The `/reset-password` endpoint only checks that the authenticated user is a Super Admin **inside the service function** (`adminResetPassword`), but the controller doesn't use the `requirePermission()` middleware. The authorization check is done via a DB query inside the service, which is a defense-in-depth violation — if the service function is called from another context, the check would still apply, but the endpoint itself should enforce RBAC at the middleware level.

Additionally, the service function does a full `select()` on the admin user (including `passwordHash`) when it only needs `roleId`:
```typescript
const admin = await db.select().from(users).where(eq(users.id, adminUserId)).limit(1)
```

**Fix**: Add RBAC middleware and minimize the query:
```typescript
.post('/reset-password', async ({ body }) => { ... }, {
  beforeHandle: requirePermission('users.reset-password')
})
// In service: select only needed fields
const admin = await db.select({ roleId: users.roleId }).from(users).where(eq(users.id, adminUserId)).limit(1)
```

---

### 🟠 HIGH

#### H-01: Duplicate `validatePasswordStrength` — auth.service uses undefined `PASSWORD_REGEX`
**File**: `auth.service.ts:14-18`

```typescript
export function validatePasswordStrength(password: string): void {
  if (!PASSWORD_REGEX.test(password)) {
    throw new Error('Password must be at least 8 characters...')
  }
}
```

**Issue**: `PASSWORD_REGEX` is **not imported** in `auth.service.ts`. The import line only brings in `ARGON2_OPTIONS, BRUTE_FORCE, SUPER_ADMIN_ROLE_ID`. This will cause a **runtime ReferenceError** when `registerUser()` or `changePassword()` is called. A separate `lib/password.ts` file exists with a proper `validatePasswordStrength()` that returns `string | null`.

**Fix**: Remove the local `validatePasswordStrength` and import from `lib/password.ts`:
```typescript
import { validatePasswordStrength, generateTempPassword } from '../../lib/password'
```
Note: The signatures differ — `lib/password.ts` returns `string | null`, while `auth.service.ts` throws. The callers need to be adapted.

---

#### H-02: Brute-force lock counter race condition
**File**: `auth.service.ts:86-94`

```typescript
if (!validPassword) {
  await redis.incr(bruteForceKey)
  await redis.expire(bruteForceKey, BRUTE_FORCE.WINDOW)
  const attempts = (user.failedLoginAttempts || 0) + 1
  await db.update(users).set({ failedLoginAttempts: attempts }).where(eq(users.id, user.id))
  if (attempts >= 5) {
    await db.update(users).set({ isLocked: 1 }).where(eq(users.id, user.id))
  }
}
```

**Issue**: Two race conditions:
1. **Redis INCR + EXPIRE are not atomic**. If the process crashes between `incr` and `expire`, the key persists forever without a TTL, permanently locking the account.
2. **DB counter is read-then-write**. Two concurrent login attempts can both read `failedLoginAttempts = 4`, both increment to 5, but neither triggers the lock (or both do). The `isLocked` check at line 80 also has a TOCTOU issue.

**Fix**: Use Redis `INCR` with `EXPIRE` in a pipeline/multi, or use `SET` with `NX` and `EX`. For the DB counter, use a raw SQL increment: `SET failed_login_attempts = failed_login_attempts + 1` and check the result.

---

#### H-03: Login rate limit bypass via IP spoofing
**File**: `auth.controller.ts:23-26` and `rate-limit.ts:32-35`

```typescript
const ip =
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  request.headers.get('x-real-ip') ||
  'unknown'
```

**Issue**: `X-Forwarded-For` and `X-Real-IP` headers can be **spoofed by clients** unless the server is behind a trusted reverse proxy that strips/replaces these headers. An attacker can rotate IPs in the header to bypass rate limiting entirely.

**Fix**: Only trust these headers when behind a trusted proxy. Use the rightmost value from `X-Forwarded-For` (set by the trusted proxy), or better, use the actual socket address when not behind a proxy. Consider adding a configurable trust proxy setting.

---

#### H-04: Tenant plugin doesn't enforce user-tenant matching
**File**: `tenant.ts:23-25`

```typescript
if (user && user.roleId === SUPER_ADMIN_ROLE_ID) {
  return { tenantId }
}
```

**Issue**: For Super Admins, the plugin accepts **any** `X-Tenant-ID` header value without verifying the tenant exists or is active. While the tenant existence check is skipped for admins (which is correct for cross-tenant access), there's **no validation that non-admin users can only access their own tenant**. A regular user could send `X-Tenant-ID: 999` (a different tenant) and the plugin would return `tenantId: 999` without checking if the user belongs to that tenant.

**Fix**: For non-admin users, verify that the `X-Tenant-ID` matches `user.tenantId`:
```typescript
if (user && user.roleId !== SUPER_ADMIN_ROLE_ID) {
  if (tenantId !== user.tenantId) {
    return { tenantId: null, tenantError: 'Tenant access denied' }
  }
}
```

---

#### H-05: No password minimum length validation in controller schema
**File**: `auth.controller.ts:54`

```typescript
password: t.String(),
```

**Issue**: The `/register` and `/login` endpoints accept any password string, including empty strings. While `validatePasswordStrength()` in the service checks complexity, the controller schema doesn't enforce a minimum length, allowing very short passwords to reach the service layer. Same issue on `/login` (line 75) and `/change-password` (lines 150-151).

**Fix**: Add minimum length to the schema:
```typescript
password: t.String({ minLength: 8 }),
```

---

#### H-06: Session cookie not set with `httpOnly` flag
**File**: `lucia.ts:17-25`

```typescript
sessionCookie: {
  name: 'auth_session',
  expires: true,
  attributes: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  },
},
```

**Issue**: The `httpOnly` attribute is **not set** on the session cookie. Without `httpOnly`, JavaScript running in the browser can access the session cookie via `document.cookie`, making the application vulnerable to **XSS-based session theft**.

**Fix**: Add `httpOnly: true` to the cookie attributes:
```typescript
attributes: {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  httpOnly: true,
},
```

---

### 🟡 MEDIUM

#### M-01: Duplicate rate limiting logic
**Files**: `auth.controller.ts:21-38` and `rate-limit.ts:27-51`

**Issue**: The `loginRateLimit` plugin in `auth.controller.ts` duplicates the rate limiting logic from `rate-limit.ts`. The controller uses `env.RATE_LIMIT_LOGIN` directly while `rate-limit.ts` uses the `TIER_LIMITS` map. This means:
1. Two sources of truth for login rate limits
2. The controller version doesn't set `X-RateLimit-*` headers
3. Any bug fix must be applied in two places

**Fix**: Remove the inline `loginRateLimit` and use `rateLimit('login')` from the plugin:
```typescript
.use(rateLimit('login'))
```

---

#### M-02: CSP allows `unsafe-inline` for scripts and styles
**File**: `security-headers.ts:8`

```typescript
'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
```

**Issue**: `unsafe-inline` in `script-src` and `style-src` significantly weakens CSP protection. It allows inline `<script>` and `<style>` tags, which are common XSS vectors. This essentially negates the XSS protection that CSP provides.

**Fix**: Use nonce-based or hash-based CSP. Remove `unsafe-inline` and generate nonces per request:
```typescript
// In a middleware:
const nonce = crypto.randomUUID()
set.headers['Content-Security-Policy'] = `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'`
```

---

#### M-03: `revokeAllOtherSessions` uses N+1 queries
**File**: `auth.service.ts:261-269`

```typescript
const userSessions = await db.select().from(sessions).where(and(eq(sessions.userId, userId), ne(sessions.id, currentSessionId)))
for (const session of userSessions) {
  await lucia.invalidateSession(session.id)
}
```

**Issue**: This fetches all sessions then invalidates them one by one. Lucia's `invalidateUserSessions(userId)` already invalidates all sessions for a user, so this could be simplified. If the intent is to keep the current session, the current approach is correct but inefficient — each `invalidateSession` is a separate DB query.

**Fix**: Use a batch approach or accept that `invalidateUserSessions` invalidates all (including current) and let the user re-authenticate:
```typescript
// Option A: Simple — invalidate all, user re-logs in
await lucia.invalidateUserSessions(userId)
// Option B: Keep current — batch delete from DB directly
await db.delete(sessions).where(and(eq(sessions.userId, userId), ne(sessions.id, currentSessionId)))
```

---

#### M-04: Error messages leak information
**Files**: `auth.service.ts:67`, `auth.service.ts:81`

```typescript
throw new Error('Account temporarily locked due to too many failed login attempts')
throw new Error('Account is locked due to too many failed login attempts')
```

**Issue**: These error messages reveal that the account exists and is locked, which is useful information for attackers performing account enumeration. The generic "Invalid email or password" message used elsewhere (lines 75, 95) is better.

**Fix**: Use a generic message:
```typescript
throw new Error('Invalid email or password')
```
And communicate lockout status through a separate channel (e.g., email notification).

---

#### M-05: `getUserSessions` doesn't filter by tenant
**File**: `auth.service.ts:234-246`

**Issue**: The function fetches all sessions for a user without tenant scoping. While sessions are per-user (not per-tenant), in a multi-tenant system, a Super Admin viewing sessions might need tenant context. More importantly, the session data returned doesn't include any tenant information.

**Fix**: Consider adding tenant/IP metadata to sessions for audit purposes. This is a low-priority enhancement.

---

#### M-06: No `httpOnly` or `secure` flags on cookie sets in controller
**Files**: `auth.controller.ts:45-48`, `auth.controller.ts:66-69`

```typescript
cookie[sessionCookie.name].set({
  value: sessionCookie.value,
  ...sessionCookie.attributes,
})
```

**Issue**: While Lucia's `createSessionCookie()` should set attributes based on the Lucia config, the controller spreads `sessionCookie.attributes` without verifying the attributes include `httpOnly`. If Lucia's config is missing `httpOnly` (which it is — see H-06), the cookies set here will also lack it.

**Fix**: This is resolved by fixing H-06 in `lucia.ts`.

---

#### M-07: Rate limit key collision between inline and plugin rate limiters
**Files**: `auth.controller.ts:27` vs `rate-limit.ts:36`

```typescript
// auth.controller.ts
const key = `ratelimit:login:${ip}`
// rate-limit.ts
const key = `ratelimit:${tier}:${ip}`
```

**Issue**: The inline login rate limiter uses `ratelimit:login:` prefix, and the plugin version also uses `ratelimit:login:` when `tier='login'`. If both are applied to the same route, they'll share the same Redis key and double-count requests. If only one is applied, they'll work independently but with different configurations.

**Fix**: Remove the duplicate inline rate limiter (see M-01).

---

### 🔵 LOW

#### L-01: `ctx` typed as `any` in RBAC middleware
**File**: `rbac.ts:8`

```typescript
export function requirePermission(requiredPermission: string) {
  return async (ctx: any) => {
```

**Issue**: Using `any` bypasses TypeScript's type safety. The context should be typed properly using Elysia's typed context.

**Fix**: Use Elysia's route context type or define a proper interface.

---

#### L-02: `rbacPlugin` is declared but empty
**File**: `rbac.ts:45`

```typescript
export const rbacPlugin = new Elysia({ name: 'rbac-plugin' })
```

**Issue**: The `rbacPlugin` is exported but has no middleware or decorators. It's a no-op plugin. The actual RBAC logic is in `requirePermission()`, which is a standalone function, not a plugin.

**Fix**: Either remove the unused `rbacPlugin` export or integrate `requirePermission` into it as a decorator.

---

#### L-03: `generateTempPassword` in `auth.service.ts` doesn't guarantee complexity requirements
**File**: `auth.service.ts:126-133`

**Issue**: The insecure `generateTempPassword()` in `auth.service.ts` uses `Math.random()` and doesn't guarantee at least one of each character class (uppercase, lowercase, digit, special). The secure version in `lib/password.ts` does guarantee this. This is moot if C-02 is fixed by using the secure version.

**Fix**: Resolved by C-02 fix.

---

#### L-04: Missing `updatedAt` trigger on password change
**File**: `auth.service.ts:194`

```typescript
await db.update(users).set({ passwordHash, forcePasswordChange: 0 }).where(eq(users.id, userId))
```

**Issue**: The `users` table has an `updatedAt` field with `onUpdateNow()`, so Drizzle should handle this automatically. However, it's worth verifying that the ORM actually triggers the update timestamp on this operation.

**Fix**: Verify Drizzle's `onUpdateNow()` works with explicit `set()` calls. If not, add `updatedAt: new Date()` explicitly.

---

#### L-05: No CORS configuration
**Issue**: No CORS plugin or configuration is visible in the reviewed files. If the API is accessed from a browser frontend on a different origin, CORS headers are needed. If it's same-origin, this is fine.

**Fix**: Add CORS configuration if the frontend is on a different origin.

---

#### L-06: Session schema `userId` length mismatch
**File**: `sessions.ts:13` vs `users.ts:23`

```typescript
// sessions.ts
userId: varchar('user_id', { length: 16 })
// users.ts
id: varchar('id', { length: 16 })
```

**Note**: These match (both `varchar(16)`), so this is fine. However, the Lucia adapter configuration in `lucia.ts` uses table names `'users'` and `'sessions'` as strings, which are not type-checked against the actual Drizzle schema. If a table is renamed, this will fail silently at runtime.

---

## Findings Summary Table

| ID | Severity | File | Issue |
|----|----------|------|-------|
| C-01 | 🔴 CRITICAL | auth.controller.ts | Unauthenticated session deletion endpoint |
| C-02 | 🔴 CRITICAL | auth.service.ts | Insecure `Math.random()` temp password (secure version exists in lib/password.ts) |
| C-03 | 🔴 CRITICAL | auth.controller.ts | Temp password returned in API response |
| C-04 | 🔴 CRITICAL | auth.controller.ts + auth.service.ts | Missing RBAC middleware on admin reset-password; over-fetches admin data |
| H-01 | 🟠 HIGH | auth.service.ts | `PASSWORD_REGEX` undefined — will crash at runtime |
| H-02 | 🟠 HIGH | auth.service.ts | Brute-force counter race condition (Redis INCR+EXPIRE not atomic; DB read-then-write) |
| H-03 | 🟠 HIGH | auth.controller.ts + rate-limit.ts | IP spoofing bypasses rate limiting via X-Forwarded-For |
| H-04 | 🟠 HIGH | tenant.ts | Non-admin users can access other tenants via X-Tenant-ID header |
| H-05 | 🟠 HIGH | auth.controller.ts | No password minimum length in request schema |
| H-06 | 🟠 HIGH | lucia.ts | Missing `httpOnly` flag on session cookie |
| M-01 | 🟡 MEDIUM | auth.controller.ts | Duplicate rate limiting logic |
| M-02 | 🟡 MEDIUM | security-headers.ts | CSP allows `unsafe-inline` |
| M-03 | 🟡 MEDIUM | auth.service.ts | N+1 queries in `revokeAllOtherSessions` |
| M-04 | 🟡 MEDIUM | auth.service.ts | Error messages leak account lock status |
| M-05 | 🟡 MEDIUM | auth.service.ts | Sessions lack tenant/IP metadata |
| M-06 | 🟡 MEDIUM | auth.controller.ts | Cookie attributes depend on Lucia config (linked to H-06) |
| M-07 | 🟡 MEDIUM | auth.controller.ts + rate-limit.ts | Rate limit key collision if both applied |
| L-01 | 🔵 LOW | rbac.ts | `ctx` typed as `any` |
| L-02 | 🔵 LOW | rbac.ts | Empty `rbacPlugin` export |
| L-03 | 🔵 LOW | auth.service.ts | Insecure temp password doesn't guarantee complexity (moot after C-02 fix) |
| L-04 | 🔵 LOW | auth.service.ts | Verify `updatedAt` auto-trigger on password change |
| L-05 | 🔵 LOW | — | No CORS configuration visible |
| L-06 | 🔵 LOW | lucia.ts | Table names as untyped strings in adapter config |

---

## Priority Fix Order

1. **H-01** — `PASSWORD_REGEX` undefined will crash registration and password change at runtime. Immediate fix.
2. **C-01** — Unauthenticated session deletion is an active exploit vector.
3. **C-02** — Replace `Math.random()` with crypto-secure generation from `lib/password.ts`.
4. **H-06** — Add `httpOnly: true` to session cookie config.
5. **H-04** — Enforce tenant matching for non-admin users.
6. **H-05** — Add `minLength` to password schemas.
7. **C-03** — Remove temp password from API response.
8. **C-04** — Add RBAC middleware to admin endpoints.
9. **H-02** — Fix race conditions in brute-force counter.
10. **H-03** — Add trusted proxy configuration for IP extraction.
11. **M-01** — Remove duplicate rate limiter.
12. **M-02** — Harden CSP policy.
13. Remaining MEDIUM and LOW items.