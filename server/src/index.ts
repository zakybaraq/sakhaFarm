import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { env, validateEnv } from './config/env'
import { authController } from './modules/auth/auth.controller'
import { sessionPlugin } from './plugins/session'
import { tenantPlugin } from './plugins/tenant'
import { rbacPlugin } from './plugins/rbac'
import { rateLimit } from './plugins/rate-limit'
import { securityHeadersPlugin } from './plugins/security-headers'

const app = new Elysia()
  .use(securityHeadersPlugin)
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
