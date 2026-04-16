import { Elysia, t } from 'elysia'
import { lucia } from '../../auth/lucia'
import { db } from '../../config/database'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
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

export const authController = new Elysia({ prefix: '/api/auth' })
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
        password: t.String(),
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
        password: t.String(),
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
  .get('/me', async ({ cookie }) => {
    const sessionId = cookie.auth_session?.value as string | undefined
    if (!sessionId) {
      return { error: 'Not authenticated' }
    }
    const { user, session } = await validateUserSession(sessionId)
    if (!user || !session) {
      return { error: 'Session expired' }
    }
    return { user: { id: user.id, email: user.email, name: user.name } }
  })
  .get('/profile', async ({ cookie }) => {
    const sessionId = cookie.auth_session?.value as string | undefined
    if (!sessionId) {
      return { error: 'Not authenticated' }
    }
    const { user, session } = await validateUserSession(sessionId)
    if (!user || !session) {
      return { error: 'Session expired' }
    }
    const profile = await getUserProfile(user.id)
    return { profile }
  })
  .put(
    '/profile',
    async ({ cookie, body }) => {
      const sessionId = cookie.auth_session?.value as string | undefined
      if (!sessionId) {
        return { error: 'Not authenticated' }
      }
      const { user, session } = await validateUserSession(sessionId)
      if (!user || !session) {
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
    async ({ cookie, body }) => {
      const sessionId = cookie.auth_session?.value as string | undefined
      if (!sessionId) {
        return { error: 'Not authenticated' }
      }
      const { user, session } = await validateUserSession(sessionId)
      if (!user || !session) {
        return { error: 'Session expired' }
      }
      await changePassword(user.id, body.currentPassword, body.newPassword)
      return { success: true }
    },
    {
      body: t.Object({
        currentPassword: t.String(),
        newPassword: t.String(),
      }),
    },
  )
  .post(
    '/reset-password',
    async ({ cookie, body }) => {
      const sessionId = cookie.auth_session?.value as string | undefined
      if (!sessionId) {
        return { error: 'Not authenticated' }
      }
      const { user, session } = await validateUserSession(sessionId)
      if (!user || !session) {
        return { error: 'Not authenticated' }
      }
      const tempPassword = await adminResetPassword(body.userId, user.id)
      return { success: true, tempPassword }
    },
    {
      body: t.Object({
        userId: t.String(),
      }),
    },
  )
  .get('/sessions', async ({ cookie }) => {
    const sessionId = cookie.auth_session?.value as string | undefined
    if (!sessionId) {
      return { error: 'Not authenticated' }
    }
    const { user, session } = await validateUserSession(sessionId)
    if (!user || !session) {
      return { error: 'Session expired' }
    }
    const sessions = await getUserSessions(user.id)
    return { sessions }
  })
  .delete('/sessions/:id', async ({ params }) => {
    await revokeSession(params.id)
    return { success: true }
  })
  .delete('/sessions', async ({ cookie }) => {
    const sessionId = cookie.auth_session?.value as string | undefined
    if (!sessionId) {
      return { error: 'Not authenticated' }
    }
    const { user, session } = await validateUserSession(sessionId)
    if (!user || !session) {
      return { error: 'Session expired' }
    }
    await revokeAllOtherSessions(user.id, sessionId)
    return { success: true }
  })
