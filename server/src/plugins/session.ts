import { Elysia } from 'elysia'
import { lucia } from '../auth/lucia'
import { verifyRequestOrigin } from 'lucia'

export const sessionPlugin = new Elysia({ name: 'session-plugin' })
  .derive({ as: 'global' }, async ({ request, cookie }) => {
    // CSRF check for non-GET requests
    if (request.method !== 'GET') {
      const origin = request.headers.get('Origin')
      const host = request.headers.get('Host')
      if (!origin || !host || !verifyRequestOrigin(origin, [host])) {
        return { user: null, session: null, csrfError: 'Invalid origin' }
      }
    }

    const sessionCookie = cookie['auth_session']
    const sessionId = sessionCookie?.value as string | undefined

    if (!sessionId) {
      return { user: null, session: null }
    }

    const { user, session } = await lucia.validateSession(sessionId)

    if (!session) {
      const blankCookie = lucia.createBlankSessionCookie()
      sessionCookie?.set({
        value: blankCookie.value,
        ...blankCookie.attributes,
      })
      return { user: null, session: null }
    }

    if (session.fresh) {
      const newCookie = lucia.createSessionCookie(session.id)
      sessionCookie?.set({
        value: newCookie.value,
        ...newCookie.attributes,
      })
    }

    return { user, session }
  })
