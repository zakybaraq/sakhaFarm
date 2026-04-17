import { Elysia } from 'elysia'
import { redis } from '../config/redis'
import { env } from '../config/env'

/**
 * Extracts client IP from request headers.
 *
 * When behind a trusted reverse proxy, uses the rightmost value from
 * X-Forwarded-For (set by the proxy). Falls back to X-Real-IP, then
 * to 'unknown' for direct connections.
 *
 * IMPORTANT: Only deploy behind a trusted reverse proxy that strips
 * untrusted X-Forwarded-For values. Set TRUST_PROXY=true in env to
 * enable header-based IP extraction.
 */
function getClientIp(request: Request): string {
  const trustProxy = env.TRUST_PROXY === 'true'

  if (trustProxy) {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
      const ips = forwarded.split(',').map(s => s.trim())
      const rightmostIp = ips[ips.length - 1]
      if (rightmostIp) return rightmostIp
    }
    const realIp = request.headers.get('x-real-ip')
    if (realIp) return realIp
  }

  return 'unknown'
}

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
      const ip = getClientIp(request)
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
