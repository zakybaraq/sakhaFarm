import { Elysia, t } from 'elysia'
import { lucia } from '../../auth/lucia'
import { db } from '../../config/database'
import { users, sessions } from '../../db/schema'
import { SUPER_ADMIN_ROLE_ID } from '../../lib/constants'
import { eq } from 'drizzle-orm'
import { redis } from '../../config/redis'
import { env } from '../../config/env'
import {
  registerUser,
  loginUser,
  logoutUser,
  validateUserSession,
  getUserProfile,
  changePassword,
  adminResetPassword,
  getUserSessions,
  revokeSession,
  revokeAllOtherSessions,
} from './auth.service'
import { getRolePermissions } from '../rbac/rbac.service'
import { requirePermission } from '../../plugins/rbac'

const loginRateLimit = new Elysia({ name: 'login-rate-limit' })
  .onBeforeHandle(async ({ request, set }) => {
    const ip =
      (env.TRUST_PROXY === 'true' && request.headers.get('x-forwarded-for')?.split(',').pop()?.trim()) ||
      (env.TRUST_PROXY === 'true' && request.headers.get('x-real-ip')) ||
      'unknown'
    const key = `ratelimit:login:${ip}`

    const current = await redis.incr(key)
    if (current === 1) {
      await redis.expire(key, 60)
    }

    if (current > env.RATE_LIMIT_LOGIN) {
      set.status = 429
      return { error: 'Too Many Requests', retryAfter: 60 }
    }
  })

export const authController = new Elysia({ prefix: '/api/auth' })
  .use(loginRateLimit)
  .post(
    '/register',
    async ({ body, cookie }) => {
      const { userId, sessionCookie } = await registerUser(body.email, body.password, body.name, body.roleId, body.tenantId)
      cookie[sessionCookie.name].set({
        value: sessionCookie.value,
        ...sessionCookie.attributes,
      })
      return { success: true, userId }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 8 }),
        name: t.String({ minLength: 2, maxLength: 100 }),
        roleId: t.Number(),
        tenantId: t.Number(),
      }),
    },
  )
  .post(
    '/login',
    async ({ body, cookie }) => {
      const { user, sessionCookie } = await loginUser(body.email, body.password)
      cookie[sessionCookie.name].set({
        value: sessionCookie.value,
        ...sessionCookie.attributes,
      })
      return { success: true, user: { id: user.id, email: user.email, name: user.name } }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 8 }),
      }),
    },
  )
  .post('/logout', async ({ cookie }) => {
    const sessionId = cookie.auth_session?.value as string | undefined
    if (sessionId) {
      await logoutUser(sessionId)
    }
    const blankCookie = lucia.createBlankSessionCookie()
    cookie[blankCookie.name].set({
      value: blankCookie.value,
      ...blankCookie.attributes,
    })
    return { success: true }
  })
  .get('/me', async ({ cookie, set }) => {
    const sessionId = cookie.auth_session?.value as string | undefined
    if (!sessionId) {
      return { user: null }
    }
    const { user, session } = await validateUserSession(sessionId)
    if (!user || !session) {
      return { user: null }
    }
    return { user: { id: user.id, email: user.email, name: user.name, roleId: user.roleId, tenantId: user.tenantId } }
  })
  .get('/permissions', async ({ cookie, set }) => {
    const sessionId = cookie.auth_session?.value as string | undefined
    if (!sessionId) {
      set.status = 401
      return { error: 'Not authenticated' }
    }
    const { user, session } = await validateUserSession(sessionId)
    if (!user || !session) {
      set.status = 401
      return { error: 'Session expired' }
    }
    const permissions = await getRolePermissions(user.roleId)
    return { permissions }
  })
  .get('/profile', async ({ cookie, set }) => {
    const sessionId = cookie.auth_session?.value as string | undefined
    if (!sessionId) {
      set.status = 401
      return { error: 'Not authenticated' }
    }
    const { user, session } = await validateUserSession(sessionId)
    if (!user || !session) {
      set.status = 401
      return { error: 'Session expired' }
    }
    const profile = await getUserProfile(user.id)
    return { profile }
  })
  .put(
    '/profile',
    async ({ cookie, body, set }) => {
      const sessionId = cookie.auth_session?.value as string | undefined
      if (!sessionId) {
        set.status = 401
        return { error: 'Not authenticated' }
      }
      const { user, session } = await validateUserSession(sessionId)
      if (!user || !session) {
        set.status = 401
        return { error: 'Session expired' }
      }
      await db.update(users).set({ name: body.name }).where(eq(users.id, user.id))
      return { success: true }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 100 }),
      }),
    },
  )
  .post(
    '/change-password',
    async ({ cookie, body, set }) => {
      const sessionId = cookie.auth_session?.value as string | undefined
      if (!sessionId) {
        set.status = 401
        return { error: 'Not authenticated' }
      }
      const { user, session } = await validateUserSession(sessionId)
      if (!user || !session) {
        set.status = 401
        return { error: 'Session expired' }
      }
      await changePassword(user.id, body.currentPassword, body.newPassword)
      return { success: true }
    },
    {
      body: t.Object({
        currentPassword: t.String(),
        newPassword: t.String({ minLength: 8 }),
      }),
    },
  )
  .post(
    '/reset-password',
    async ({ cookie, body, set }) => {
      const sessionId = cookie.auth_session?.value as string | undefined
      if (!sessionId) {
        set.status = 401
        return { error: 'Not authenticated' }
      }
      const { user, session } = await validateUserSession(sessionId)
      if (!user || !session) {
        set.status = 401
        return { error: 'Not authenticated' }
      }
      await adminResetPassword(body.userId, user.id)
      return { success: true }
    },
    {
      beforeHandle: requirePermission('users.reset-password'),
      body: t.Object({
        userId: t.String(),
      }),
    },
  )
  .get('/sessions', async ({ cookie, set }) => {
    const sessionId = cookie.auth_session?.value as string | undefined
    if (!sessionId) {
      set.status = 401
      return { error: 'Not authenticated' }
    }
    const { user, session } = await validateUserSession(sessionId)
    if (!user || !session) {
      set.status = 401
      return { error: 'Session expired' }
    }
    const sessions = await getUserSessions(user.id)
    return { sessions }
  })
  .delete('/sessions/:id', async ({ cookie, params, set }) => {
    const sessionId = cookie.auth_session?.value as string | undefined
    if (!sessionId) {
      set.status = 401
      return { error: 'Not authenticated' }
    }
    const { user, session } = await validateUserSession(sessionId)
    if (!user || !session) {
      set.status = 401
      return { error: 'Session expired' }
    }
    // Verify the target session belongs to this user or user is Super Admin
    const userSessions = await db.select({ userId: sessions.userId }).from(sessions).where(eq(sessions.id, params.id)).limit(1)
    if (userSessions.length === 0) {
      return { error: 'Session not found' }
    }
    if (userSessions[0].userId !== user.id && user.roleId !== SUPER_ADMIN_ROLE_ID) {
      set.status = 403
      return { error: 'Forbidden' }
    }
    await revokeSession(params.id)
    return { success: true }
  })
  .delete('/sessions', async ({ cookie, set }) => {
    const sessionId = cookie.auth_session?.value as string | undefined
    if (!sessionId) {
      set.status = 401
      return { error: 'Not authenticated' }
    }
    const { user, session } = await validateUserSession(sessionId)
    if (!user || !session) {
      set.status = 401
      return { error: 'Session expired' }
    }
    await revokeAllOtherSessions(user.id, sessionId)
    return { success: true }
  })
