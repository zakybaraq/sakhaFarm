import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { env, validateEnv } from './config/env'
import { authController } from './modules/auth/auth.controller'

const app = new Elysia()
  .use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }))
  .use(authController)
  .get('/api/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'sakhafarm-api',
  }))
  .listen(env.PORT)

console.log(`🐔 SakhaFarm API running at ${app.server?.hostname}:${app.server?.port}`)

export type App = typeof app
