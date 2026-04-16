import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { env, validateEnv } from './config/env'
import { authController } from './modules/auth/auth.controller'
import { sessionPlugin } from './plugins/session'
import { tenantPlugin } from './plugins/tenant'
import { rbacPlugin } from './plugins/rbac'
import { rateLimit } from './plugins/rate-limit'

const HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

const app = new Elysia()
  .onBeforeHandle(({ set }) => {
    Object.assign(set.headers, HEADERS)
  })
  .use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }))
  .use(sessionPlugin)
  .use(tenantPlugin)
  .use(rbacPlugin)
  .use(authController)
  .get('/api/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'sakhafarm-api',
  }))
  .listen(env.PORT)

console.log(`🐔 SakhaFarm API running at ${app.server?.hostname}:${app.server?.port}`)

export type App = typeof app
