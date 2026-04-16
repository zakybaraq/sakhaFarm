import { Elysia, t } from 'elysia'
import { lucia } from '../../auth/lucia'
import { registerUser, loginUser, logoutUser, validateUserSession } from './auth.service'

export const authController = new Elysia({ prefix: '/api/auth' })
  .post(
    '/register',
    async ({ body, cookie }) => {
      const { sessionCookie } = await registerUser(body.email, body.password, body.name, body.roleId, body.tenantId)
      sessionCookie.set(cookie)
      return { success: true }
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
      sessionCookie.set(cookie)
      return { success: true, user: { id: user.userId, email: user.email, name: user.name } }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String(),
      }),
    },
  )
  .post('/logout', async ({ cookie }) => {
    const sessionId = cookie.auth_session?.value
    if (sessionId) {
      await logoutUser(sessionId)
    }
    const blankCookie = lucia.createBlankSessionCookie()
    blankCookie.set(cookie)
    return { success: true }
  })
  .get('/me', async ({ cookie }) => {
    const sessionId = cookie.auth_session?.value
    if (!sessionId) {
      return { error: 'Not authenticated' }
    }
    const { user, session } = await validateUserSession(sessionId)
    if (!user || !session) {
      return { error: 'Session expired' }
    }
    return { user: { id: user.userId, email: user.email, name: user.name } }
  })
