import Redis from 'ioredis'
import { env } from './env'

/**
 * ioredis client instance connected to the configured Redis server.
 *
 * Handles automatic reconnection and command queuing. Connects to the
 * Redis server specified by the `REDIS_URL` environment variable.
 *
 * Use this instance for all Redis operations including:
 * - Session storage (via @elysiajs/session)
 * - Response caching
 * - Rate limiting counters
 * - Job queue management
 *
 * @example
 * ```typescript
 * // Cache-aside pattern
 * async function getCachedUser(userId: string) {
 *   const cached = await redis.get(`user:${userId}`)
 *   if (cached) return JSON.parse(cached)
 *
 *   const user = await getUserFromDB(userId)
 *   await redis.setex(`user:${userId}`, 300, JSON.stringify(user))
 *   return user
 * }
 * ```
 */
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 100, 5000)
    return delay
  },
})

/**
 * Verifies the Redis connection by sending a PING command.
 *
 * @returns 'PONG' if the connection is successful
 * @throws Error if Redis is unreachable or the connection fails
 * @example
 * ```typescript
 * await testRedisConnection() // logs 'Redis connected: PONG'
 * ```
 */
export async function testRedisConnection(): Promise<string> {
  const result = await redis.ping()
  console.log(`Redis connected: ${result}`)
  return result
}
