import { Lucia } from 'lucia'
import { Mysql2Adapter } from '@lucia-auth/adapter-mysql'
import { pool } from '../config/database'

/**
 * Lucia Auth v3 instance configured with MySQL adapter.
 *
 * Sessions are stored in MySQL via Mysql2Adapter (Lucia v3 architecture).
 * Redis remains available for caching and rate limiting (Waves 2-3).
 */
const adapter = new Mysql2Adapter(pool, {
  user: 'users',
  session: 'sessions',
})

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    name: 'auth_session',
    expires: true,
    attributes: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    },
  },
  getUserAttributes: (attributes) => ({
    email: attributes.email,
    name: attributes.name,
    roleId: attributes.role_id,
    tenantId: attributes.tenant_id,
    isActive: attributes.is_active,
    isLocked: attributes.is_locked,
    forcePasswordChange: attributes.force_password_change,
    failedLoginAttempts: attributes.failed_login_attempts,
    lastLoginAt: attributes.last_login_at,
  }),
})

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: {
      email: string
      name: string
      role_id: number
      tenant_id: number
      is_active: number
      is_locked: number
      force_password_change: number
      failed_login_attempts: number
      last_login_at: Date | null
    }
  }
}
