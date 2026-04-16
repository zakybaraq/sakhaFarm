import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { env } from './env'

/**
 * MySQL connection pool configured with Drizzle ORM.
 *
 * Uses mysql2's promise-based connection pool for efficient query execution.
 * Connections are established lazily on first query and managed automatically.
 *
 * @example
 * ```typescript
 * import { db } from './config/database'
 * const users = await db.select().from(usersTable)
 * ```
 */
const pool = mysql.createPool({
  uri: env.DATABASE_URL,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
})

/**
 * Drizzle ORM database instance backed by a MySQL connection pool.
 *
 * Use this instance for all database operations. It provides type-safe
 * query building and execution through Drizzle's API.
 *
 * @example
 * ```typescript
 * // Select query
 * const users = await db.select().from(usersTable).where(eq(usersTable.isActive, 1))
 *
 * // Insert query
 * await db.insert(usersTable).values({ name: 'John', email: 'john@example.com' })
 *
 * // Transaction
 * await db.transaction(async (tx) => {
 *   await tx.insert(ordersTable).values(orderData)
 *   await tx.update(inventoryTable).set({ stock: sql`stock - 1` })
 * })
 * ```
 */
export const db = drizzle(pool)

export { pool }
