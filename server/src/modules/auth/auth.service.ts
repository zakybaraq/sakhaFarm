import { hash, verify } from '@node-rs/argon2'
import { generateIdFromEntropySize } from 'lucia'
import { lucia } from '../../auth/lucia'
import { db } from '../../config/database'
import { redis } from '../../config/redis'
import { users, sessions, roles } from '../../db/schema'
import { tenants } from '../../db/schema/tenants'
import { eq, and, ne, desc } from 'drizzle-orm'

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

/**
 * Generates a temporary password for admin password resets.
 * @returns 12-character temporary password
 */
export function generateTempPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

/**
 * Gets user profile with role and tenant info.
 * @param userId - Lucia user ID
 * @returns User profile with role name and tenant name
 */
export async function getUserProfile(userId: string) {
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      roleId: users.roleId,
      tenantId: users.tenantId,
      isActive: users.isActive,
      isLocked: users.isLocked,
      forcePasswordChange: users.forcePasswordChange,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      roleName: roles.name,
      tenantName: tenants.name,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .leftJoin(tenants, eq(users.tenantId, tenants.id))
    .where(eq(users.id, userId))
    .limit(1)

  if (result.length === 0) {
    throw new Error('User not found')
  }

  return result[0]
}

/**
 * Changes user password. Requires current password for verification.
 * @param userId - Lucia user ID
 * @param currentPassword - Current password for verification
 * @param newPassword - New password to set
 * @throws Error if current password is invalid or new password is weak
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  validatePasswordStrength(newPassword)

  // Get user's current password hash for verification
  const userResult = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, userId)).limit(1)
  if (userResult.length === 0) {
    throw new Error('User not found')
  }

  // Verify current password using Argon2
  const validPassword = await verify(userResult[0].passwordHash, currentPassword, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })

  if (!validPassword) {
    throw new Error('Current password is incorrect')
  }

  // Hash new password and update user
  const passwordHash = await hash(newPassword, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })
  await db.update(users).set({ passwordHash, forcePasswordChange: 0 }).where(eq(users.id, userId))

  // Invalidate all sessions (force re-login)
  await lucia.invalidateUserSessions(userId)
}

/**
 * Admin-only password reset. Generates temporary password.
 * @param targetUserId - User ID to reset password for
 * @param adminUserId - Admin performing the reset
 * @returns Temporary password (must be communicated to user securely)
 */
export async function adminResetPassword(targetUserId: string, adminUserId: string) {
  // Verify admin exists and has Super Admin role (roleId = 1)
  const admin = await db.select().from(users).where(eq(users.id, adminUserId)).limit(1)
  if (admin.length === 0 || admin[0].roleId !== 1) {
    throw new Error('Only Super Admin can reset passwords')
  }

  const tempPassword = generateTempPassword()
  const passwordHash = await hash(tempPassword, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })

  await db.update(users).set({
    passwordHash,
    forcePasswordChange: 1,
    failedLoginAttempts: 0,
    isLocked: 0,
  }).where(eq(users.id, targetUserId))

  // Invalidate all sessions for target user
  await lucia.invalidateUserSessions(targetUserId)

  return tempPassword
}

/**
 * Lists active sessions for a user.
 * @param userId - User ID
 * @returns Array of active sessions
 */
export async function getUserSessions(userId: string) {
  const userSessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.expiresAt))

  return userSessions.map(s => ({
    id: s.id,
    expiresAt: s.expiresAt,
    isActive: s.expiresAt > new Date(),
  }))
}

/**
 * Revokes a specific session.
 * @param sessionId - Session ID to revoke
 */
export async function revokeSession(sessionId: string) {
  await lucia.invalidateSession(sessionId)
}

/**
 * Revokes all sessions except the current one.
 * @param userId - User ID
 * @param currentSessionId - Session to keep active
 */
export async function revokeAllOtherSessions(userId: string, currentSessionId: string) {
  const userSessions = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), ne(sessions.id, currentSessionId)))

  for (const session of userSessions) {
    await lucia.invalidateSession(session.id)
  }
}
