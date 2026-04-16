import { hash, verify } from '@node-rs/argon2'
import { generateIdFromEntropySize } from 'lucia'
import { lucia } from '../../auth/lucia'
import { db } from '../../config/database'
import { redis } from '../../config/redis'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'

const BRUTE_FORCE_WINDOW = 900
const BRUTE_FORCE_MAX_ATTEMPTS = 5

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

/**
 * Validates password meets complexity requirements.
 */
export function validatePasswordStrength(password: string): void {
  if (!PASSWORD_REGEX.test(password)) {
    throw new Error('Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character')
  }
}

/**
 * Registers a new user with Lucia Auth.
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
  roleId: number,
  tenantId: number,
) {
  validatePasswordStrength(password)

  const existingUser = await db.select().from(users).where(eq(users.email, email.toLowerCase()))
  if (existingUser.length > 0) {
    throw new Error('Email already registered')
  }

  const userId = generateIdFromEntropySize(10)
  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })

  await db.insert(users).values({
    id: userId,
    email: email.toLowerCase(),
    passwordHash,
    name,
    roleId,
    tenantId,
    isActive: 1,
    isLocked: 0,
    forcePasswordChange: 0,
  })

  const session = await lucia.createSession(userId, {})
  const sessionCookie = lucia.createSessionCookie(session.id)

  return { userId, session, sessionCookie }
}

/**
 * Authenticates user with email and password.
 */
export async function loginUser(email: string, password: string) {
  const normalizedEmail = email.toLowerCase()
  const bruteForceKey = `bruteforce:login:${normalizedEmail}`

  const redisAttempts = await redis.get(bruteForceKey)
  if (redisAttempts && parseInt(redisAttempts, 10) >= BRUTE_FORCE_MAX_ATTEMPTS) {
    throw new Error('Account temporarily locked due to too many failed login attempts')
  }

  const existingUser = await db.select().from(users).where(eq(users.email, normalizedEmail))

  if (existingUser.length === 0) {
    await redis.incr(bruteForceKey)
    await redis.expire(bruteForceKey, BRUTE_FORCE_WINDOW)
    throw new Error('Invalid email or password')
  }

  const user = existingUser[0]

  if (user.isLocked === 1) {
    throw new Error('Account is locked due to too many failed login attempts')
  }

  const validPassword = await verify(user.passwordHash, password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })

  if (!validPassword) {
    await redis.incr(bruteForceKey)
    await redis.expire(bruteForceKey, BRUTE_FORCE_WINDOW)

    const attempts = (user.failedLoginAttempts || 0) + 1
    await db.update(users).set({ failedLoginAttempts: attempts }).where(eq(users.id, user.id))
    if (attempts >= 5) {
      await db.update(users).set({ isLocked: 1 }).where(eq(users.id, user.id))
    }
    throw new Error('Invalid email or password')
  }

  await redis.del(bruteForceKey)

  const session = await lucia.createSession(user.id, {})
  const sessionCookie = lucia.createSessionCookie(session.id)

  await db.update(users).set({ lastLoginAt: new Date(), failedLoginAttempts: 0 }).where(eq(users.id, user.id))

  return { user, session, sessionCookie }
}

/**
 * Logs out user by invalidating session.
 */
export async function logoutUser(sessionId: string) {
  await lucia.invalidateSession(sessionId)
}

/**
 * Validates session and returns user data.
 */
export async function validateUserSession(sessionId: string) {
  return await lucia.validateSession(sessionId)
}
