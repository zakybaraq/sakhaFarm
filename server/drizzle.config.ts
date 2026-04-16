import { defineConfig } from 'drizzle-kit'
import { env } from './src/config/env'

/**
 * Drizzle Kit configuration for MySQL schema management.
 *
 * Used by drizzle-kit CLI commands:
 * - `bunx drizzle-kit push` — Apply schema changes directly to database
 * - `bunx drizzle-kit studio` — Interactive schema browser
 * - `bunx drizzle-kit generate` — Generate migration files
 *
 * Schema files are located at `./src/db/schema/`.
 * Output migrations are written to `./drizzle/`.
 */
export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
})
