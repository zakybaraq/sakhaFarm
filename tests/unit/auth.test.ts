import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  loginUser,
  logoutUser,
} from '../../server/src/modules/auth/auth.service'


const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}

vi.mock('../../server/src/config/database', () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  },
}))

vi.mock('../../server/src/config/redis', () => ({
  redis: mockRedis,
}))

describe('auth.service.ts', () => {
  const TENANT_ID = 1
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('loginUser', () => {
    it('should throw error for invalid credentials', async () => {
      mockSelect.mockReturnValue([] as any)
      
      await expect(loginUser('invalid@test.com', 'wrongpass')).rejects.toThrow('Invalid email or password')
    })
  })

  describe('logoutUser', () => {
    it('should delete session from Redis', async () => {
      mockRedis.del.mockResolvedValue(1)
      
      await logoutUser('session123')
      expect(mockRedis.del).toHaveBeenCalledWith('session:session123')
    })
  })
})