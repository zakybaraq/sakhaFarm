import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(__dirname, '../server/.env') })

vi.mock('../../server/src/config/env', () => ({
  env: {
    PORT: 3000,
    NODE_ENV: 'test',
    DATABASE_URL: 'mysql://localhost:3306/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'test-secret-key-for-testing-purposes-only-32chars',
    CORS_ORIGIN: 'http://localhost:5173',
    RATE_LIMIT_LOGIN: 5,
    RATE_LIMIT_API: 100,
    RATE_LIMIT_HEAVY: 10,
  },
  validateEnv: vi.fn(() => ({})),
}))
