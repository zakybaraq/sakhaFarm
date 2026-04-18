import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getAllStock, getStockForPlasmaFeed } from '../../server/src/modules/feed/feed.service'

const mockDb = {
  select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
  transaction: () => Promise.resolve({}),
}

vi.mock('../../server/src/config/database', () => ({
  db: mockDb,
}))

describe('inventory.service.ts', () => {
  const TENANT_ID = 1

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getStockForPlasmaFeed', () => {
    it('should return stock for specific plasma', async () => {
      const mockStock = [
        { feedProductCode: 'BR10', feedProductName: 'Feed BR10', currentStock: 100, unit: 'kg' },
        { feedProductCode: 'BR11', feedProductName: 'Feed BR11', currentStock: 50, unit: 'kg' },
      ]
      mockSelect.mockReturnValue(mockStock as any)

      const result = await getStockForPlasmaFeed(1, 1, TENANT_ID)
      expect(result).toHaveLength(2)
      expect(result[0].feedProductCode).toBe('BR10')
    })

    it('should return empty array if no stock', async () => {
      mockSelect.mockReturnValue([] as any)

      const result = await getStockForPlasmaFeed(999, 1, TENANT_ID)
      expect(result).toHaveLength(0)
    })
  })

  describe('getAllStock', () => {
    it('should return all stock for tenant', async () => {
      const mockStock = [
        { unitName: 'Unit Kuningan', plasmaName: 'Plasma A', feedProductCode: 'BR10', currentStock: 100 },
        { unitName: 'Unit Kuningan', plasmaName: 'Plasma B', feedProductCode: 'BR10', currentStock: 50 },
      ]
      mockSelect.mockReturnValue(mockStock as any)

      const result = await getAllStock(TENANT_ID)
      expect(result).toHaveLength(2)
    })
  })
})