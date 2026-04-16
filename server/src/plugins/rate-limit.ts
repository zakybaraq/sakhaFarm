import { Elysia } from 'elysia'
import { redis } from '../config/redis'
import { env } from '../config/env'

export type RateLimitTier = 'login' | 'api' | 'heavy'

const TIER_LIMITS: Record<RateLimitTier, { max: number; window: number }> = {
  login: { max: env.RATE_LIMIT_LOGIN, window: 60 },
  api: { max: env.RATE_LIMIT_API, window: 60 },
  heavy: { max: env.RATE_LIMIT_HEAVY, window: 60 },
}

/**
 * Redis-based rate limiting middleware.
 *
 * Tracks request counts per IP using Redis INCR/EXPIRE pattern.
 * Returns 429 Too Many Requests when limit exceeded.
 *
 * @param tier - Rate limit tier: 'login' (5/min), 'api' (100/min), 'heavy' (10/min)
 *
 * @example
 * ```typescript
 * app.post('/auth/login', rateLimit('login'), loginHandler)
 * app.use(rateLimit('api')) // global API rate limiting
 * ```
 */
export function rateLimit(tier: RateLimitTier = 'api') {
  const { max, window: windowSeconds } = TIER_LIMITS[tier]

  return new Elysia({ name: `rate-limit-${tier}` })
    .onBeforeHandle(async ({ request, set }) => {
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown'
      const key = `ratelimit:${tier}:${ip}`

      const current = await redis.incr(key)
      if (current === 1) {
        await redis.expire(key, windowSeconds)
      }

      if (current > max) {
        set.status = 429
        return {
          error: 'Too Many Requests',
          retryAfter: windowSeconds,
        }
      }
    })
}

/**
 * Global rate limiting plugin that applies 'api' tier to all routes.
 * Mount this early in the app chain for blanket protection.
 */
export const rateLimitPlugin = new Elysia({ name: 'rate-limit-global' }).use(
  rateLimit('api'),
)
