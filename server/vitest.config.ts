import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig({
  test: {
    include: ['../tests/**/*.test.ts'],
    environment: 'node',
    globals: true,
    setupFiles: ['../tests/setup.ts'],
  },
})
