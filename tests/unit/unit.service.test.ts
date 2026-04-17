import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  UnitNotFoundError,
  UnitHasActivePlasmasError,
  DuplicateUnitCodeError,
} from '../../server/src/modules/unit/unit.errors'
import {
  createUnit,
  listUnits,
  getUnit,
  updateUnit,
  softDeleteUnit,
} from '../../server/src/modules/unit/unit.service'

const { mockSelect, mockInsert, mockUpdate, mockTransaction } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockTransaction: vi.fn(),
}))

vi.mock('../../server/src/config/database', () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    transaction: mockTransaction,
  },
}))

describe('unit.errors.ts', () => {
  describe('UnitNotFoundError', () => {
    it('should create error with correct message and name', () => {
      const error = new UnitNotFoundError(42)
      expect(error.message).toBe('Unit "42" not found')
      expect(error.name).toBe('UnitNotFoundError')
    })
  })

  describe('UnitHasActivePlasmasError', () => {
    it('should create error with correct message and name', () => {
      const error = new UnitHasActivePlasmasError(1, 3)
      expect(error.message).toBe('Cannot delete unit "1": 3 active plasma(s) exist')
      expect(error.name).toBe('UnitHasActivePlasmasError')
    })

    it('should handle zero plasma count', () => {
      const error = new UnitHasActivePlasmasError(1, 0)
      expect(error.message).toBe('Cannot delete unit "1": 0 active plasma(s) exist')
    })
  })

  describe('DuplicateUnitCodeError', () => {
    it('should create error with correct message and name', () => {
      const error = new DuplicateUnitCodeError('UK-001')
      expect(error.message).toBe('Unit code "UK-001" already exists')
      expect(error.name).toBe('DuplicateUnitCodeError')
    })
  })
})

describe('unit.service.ts', () => {
  const TENANT_ID = 1
  const USER_ID = 'user123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createUnit', () => {
    it('should throw DuplicateUnitCodeError when code already exists', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ id: 1, code: 'UK-001' }]),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      await expect(
        createUnit({ name: 'Unit Kuningan', code: 'UK-001', location: 'Kuningan' }, TENANT_ID, USER_ID),
      ).rejects.toThrow(DuplicateUnitCodeError)
    })

    it('should create unit and return it when code is unique', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      }
      const mockInsert = {
        values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
      }
      const mockAuditInsert = {
        values: vi.fn().mockResolvedValue(undefined),
      }

      mockSelect.mockReturnValue(mockSelect as any)
      mockInsert
        .mockReturnValueOnce(mockInsert as any)
        .mockReturnValueOnce(mockAuditInsert as any)

      const result = await createUnit(
        { name: 'Unit Kuningan', code: 'UK-001', location: 'Kuningan' },
        TENANT_ID,
        USER_ID,
      )

      expect(result).toBeDefined()
      expect(result.id).toBe(1)
    })
  })

  describe('listUnits', () => {
    it('should return units for tenant excluding deleted', async () => {
      const mockUnits = [
        { id: 1, name: 'Unit A', code: 'UK-001', tenantId: TENANT_ID },
        { id: 2, name: 'Unit B', code: 'UK-002', tenantId: TENANT_ID },
      ]
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockUnits),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      const result = await listUnits(TENANT_ID)

      expect(result).toEqual(mockUnits)
    })

    it('should return empty array when no units exist', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      const result = await listUnits(TENANT_ID)

      expect(result).toEqual([])
    })
  })

  describe('getUnit', () => {
    it('should throw UnitNotFoundError when unit does not exist', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      await expect(getUnit(999, TENANT_ID)).rejects.toThrow(UnitNotFoundError)
    })

    it('should return unit when found', async () => {
      const mockUnit = { id: 1, name: 'Unit A', code: 'UK-001', tenantId: TENANT_ID }
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockUnit]),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      const result = await getUnit(1, TENANT_ID)

      expect(result).toEqual(mockUnit)
    })
  })

  describe('updateUnit', () => {
    it('should throw UnitNotFoundError when unit does not exist', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      await expect(
        updateUnit(999, { name: 'New Name' }, TENANT_ID, USER_ID),
      ).rejects.toThrow(UnitNotFoundError)
    })

    it('should update unit and return success', async () => {
      const existingUnit = { id: 1, name: 'Old Name', code: 'UK-001', tenantId: TENANT_ID }
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existingUnit]),
      }
      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      }
      const mockAuditInsert = {
        values: vi.fn().mockResolvedValue(undefined),
      }

      mockSelect.mockReturnValue(mockSelect as any)
      mockUpdate.mockReturnValue(mockUpdate as any)
      mockInsert.mockReturnValue(mockAuditInsert as any)

      const result = await updateUnit(1, { name: 'New Name' }, TENANT_ID, USER_ID)

      expect(result).toEqual({ success: true })
    })
  })

  describe('softDeleteUnit', () => {
    it('should throw UnitNotFoundError when unit does not exist', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      await expect(softDeleteUnit(999, TENANT_ID, USER_ID)).rejects.toThrow(UnitNotFoundError)
    })

    it('should throw UnitHasActivePlasmasError when plasmas exist', async () => {
      const existingUnit = { id: 1, name: 'Unit A', code: 'UK-001', tenantId: TENANT_ID }
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existingUnit]),
      }
      const mockPlasmaSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 2 }]),
      }

      mockSelect
        .mockReturnValueOnce(mockSelect as any)
        .mockReturnValueOnce(mockPlasmaSelect as any)

      await expect(softDeleteUnit(1, TENANT_ID, USER_ID)).rejects.toThrow(UnitHasActivePlasmasError)
    })

    it('should soft-delete unit when no active plasmas exist', async () => {
      const existingUnit = { id: 1, name: 'Unit A', code: 'UK-001', tenantId: TENANT_ID }
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existingUnit]),
      }
      const mockPlasmaSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      }
      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      }
      const mockAuditInsert = {
        values: vi.fn().mockResolvedValue(undefined),
      }

      mockSelect
        .mockReturnValueOnce(mockSelect as any)
        .mockReturnValueOnce(mockPlasmaSelect as any)
      mockUpdate.mockReturnValue(mockUpdate as any)
      mockInsert.mockReturnValue(mockAuditInsert as any)

      const result = await softDeleteUnit(1, TENANT_ID, USER_ID)

      expect(result).toEqual({ success: true })
    })
  })
})
