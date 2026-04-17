import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().url(),
  RATE_LIMIT_LOGIN: z.coerce.number().default(5),
  RATE_LIMIT_API: z.coerce.number().default(100),
  RATE_LIMIT_HEAVY: z.coerce.number().default(10),
  TRUST_PROXY: z.enum(['true', 'false']).default('false'),
})

export function validateEnv() {
  return envSchema.parse(process.env)
}

export const env = validateEnv()
