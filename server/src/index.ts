import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { env, validateEnv } from './config/env'

/**
 * SakhaFarm API — Poultry Plasma Farm Management System
 * 
 * Main application entry point. Configures middleware, plugins, and routes.
 */

const app = new Elysia()
  .use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }))
  .get('/api/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'sakhafarm-api',
  }))
  .listen(env.PORT)

console.log(`🐔 SakhaFarm API running at ${app.server?.hostname}:${app.server?.port}`)

export type App = typeof app
