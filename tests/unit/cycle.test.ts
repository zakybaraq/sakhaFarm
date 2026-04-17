import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  CycleNotFoundError,
  CycleCapacityExceededError,
  InvalidCycleStatusTransitionError,
  CycleNotInTenantPlasmaError,
  CycleHasRecordingsError,
  InvalidDocTypeError,
} from '../../server/src/modules/cycle/cycle.errors'
import {
  createCycle,
  listCycles,
  getCycle,
  updateCycle,
  softDeleteCycle,
  completeCycle,
  failCycle,
} from '../../server/src/modules/cycle/cycle.service'

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

describe('cycle.errors.ts', () => {
  describe('CycleNotFoundError', () => {
    it('should create error with correct message and name', () => {
      const error = new CycleNotFoundError(42)
      expect(error.message).toBe('Cycle "42" not found')
      expect(error.name).toBe('CycleNotFoundError')
    })
  })

  describe('CycleCapacityExceededError', () => {
    it('should create error with correct message and name', () => {
      const error = new CycleCapacityExceededError(5000, 3000)
      expect(error.message).toBe('Initial population (5000) exceeds plasma capacity (3000)')
      expect(error.name).toBe('CycleCapacityExceededError')
    })
  })

  describe('InvalidCycleStatusTransitionError', () => {
    it('should create error with correct message and name', () => {
      const error = new InvalidCycleStatusTransitionError('completed', 'active')
      expect(error.message).toBe('Cannot transition cycle from "completed" to "active"')
      expect(error.name).toBe('InvalidCycleStatusTransitionError')
    })
  })

  describe('CycleNotInTenantPlasmaError', () => {
    it('should create error with correct message and name', () => {
      const error = new CycleNotInTenantPlasmaError(7)
      expect(error.message).toBe('Plasma "7" not found in your tenant')
      expect(error.name).toBe('CycleNotInTenantPlasmaError')
    })
  })

  describe('CycleHasRecordingsError', () => {
    it('should create error with correct message and name', () => {
      const error = new CycleHasRecordingsError(3, 5)
      expect(error.message).toBe('Cannot delete cycle "3": 5 daily recording(s) exist')
      expect(error.name).toBe('CycleHasRecordingsError')
    })

    it('should handle zero recording count', () => {
      const error = new CycleHasRecordingsError(3, 0)
      expect(error.message).toBe('Cannot delete cycle "3": 0 daily recording(s) exist')
    })
  })

  describe('InvalidDocTypeError', () => {
    it('should create error with correct message and name', () => {
      const error = new InvalidDocTypeError('InvalidType', ['CP', 'Patriot', 'Ayam Unggul', 'MBU'])
      expect(error.message).toBe('Invalid DOC type "InvalidType". Must be one of: CP, Patriot, Ayam Unggul, MBU')
      expect(error.name).toBe('InvalidDocTypeError')
    })

    it('should include provided type in message', () => {
      const error = new InvalidDocTypeError('BROILER', ['CP', 'Cobb'])
      expect(error.message).toContain('BROILER')
    })
  })
})

describe('cycle.service.ts', () => {
  const TENANT_ID = 1
  const USER_ID = 'user123'
  const PLASMA_ID = 1

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createCycle', () => {
    it('should throw Error for invalid DOC type', async () => {
      await expect(
        createCycle(
          { plasmaId: PLASMA_ID, docType: 'INVALID', chickInDate: '2026-01-01', initialPopulation: 1000 },
          TENANT_ID,
          USER_ID,
        ),
      ).rejects.toThrow('Invalid DOC type')
    })

    it('should throw CycleNotInTenantPlasmaError when plasma not in tenant', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      await expect(
        createCycle(
          { plasmaId: PLASMA_ID, docType: 'CP', chickInDate: '2026-01-01', initialPopulation: 1000 },
          TENANT_ID,
          USER_ID,
        ),
      ).rejects.toThrow(CycleNotInTenantPlasmaError)
    })

    it('should throw CycleCapacityExceededError when population exceeds capacity', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ plasmas: { id: PLASMA_ID, capacity: 2000 } }]),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      await expect(
        createCycle(
          { plasmaId: PLASMA_ID, docType: 'CP', chickInDate: '2026-01-01', initialPopulation: 5000 },
          TENANT_ID,
          USER_ID,
        ),
      ).rejects.toThrow(CycleCapacityExceededError)
    })

    it('should create cycle with auto-calculated cycleNumber', async () => {
      const mockPlasma = { plasmas: { id: PLASMA_ID, capacity: 5000 } }
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockPlasma]),
      }
      const mockMaxSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ max: null }]),
      }
      const mockInsert = {
        values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
      }
      const mockAuditInsert = {
        values: vi.fn().mockResolvedValue(undefined),
      }

      mockSelect
        .mockReturnValueOnce(mockSelect as any)
        .mockReturnValueOnce(mockMaxSelect as any)
      mockInsert
        .mockReturnValueOnce(mockInsert as any)
        .mockReturnValueOnce(mockAuditInsert as any)

      const result = await createCycle(
        { plasmaId: PLASMA_ID, docType: 'CP', chickInDate: '2026-01-01', initialPopulation: 3000 },
        TENANT_ID,
        USER_ID,
      )

      expect(result).toBeDefined()
      expect(result.cycleNumber).toBe(1)
    })
  })

  describe('listCycles', () => {
    it('should return cycles for tenant excluding deleted', async () => {
      const mockCycles = [
        { id: 1, plasmaId: PLASMA_ID, cycleNumber: 1, docType: 'CP', status: 'active' },
        { id: 2, plasmaId: PLASMA_ID, cycleNumber: 2, docType: 'Patriot', status: 'completed' },
      ]
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockCycles),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      const result = await listCycles(TENANT_ID)

      expect(result).toEqual(mockCycles)
  })

  describe('getCycle', () => {
    it('should throw CycleNotFoundError when cycle does not exist', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      await expect(getCycle(999, TENANT_ID)).rejects.toThrow(CycleNotFoundError)
    })

    it('should return cycle when found', async () => {
      const mockCycle = { id: 1, plasmaId: PLASMA_ID, cycleNumber: 1, docType: 'CP', status: 'active' }
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockCycle]),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      const result = await getCycle(1, TENANT_ID)

      expect(result).toEqual(mockCycle)
    })
  })

    it('should filter by plasmaId when provided', async () => {
      const mockCycles = [
        { id: 1, plasmaId: PLASMA_ID, cycleNumber: 1, docType: 'CP', status: 'active' },
      ]
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockCycles),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      const result = await listCycles(TENANT_ID, PLASMA_ID)

      expect(result).toEqual(mockCycles)
    })

    it('should filter by status when provided', async () => {
      const mockCycles = [
        { id: 1, plasmaId: PLASMA_ID, cycleNumber: 1, docType: 'CP', status: 'active' },
      ]
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockCycles),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      const result = await listCycles(TENANT_ID, undefined, 'active')

      expect(result).toEqual(mockCycles)
    })
  })

  describe('getCycle', () => {
    it('should throw CycleNotFoundError when cycle does not exist', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      await expect(getCycle(999, TENANT_ID)).rejects.toThrow(CycleNotFoundError)
    })

    it('should return cycle when found', async () => {
      const mockCycle = { id: 1, plasmaId: PLASMA_ID, cycleNumber: 1, docType: 'CP', status: 'active' }
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockCycle]),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      const result = await getCycle(1, TENANT_ID)

      expect(result).toEqual(mockCycle)
    })
  })

  describe('updateCycle', () => {
    it('should throw CycleNotFoundError when cycle does not exist', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      await expect(
        updateCycle(999, { docType: 'CP' }, TENANT_ID, USER_ID),
      ).rejects.toThrow(CycleNotFoundError)
    })

    it('should throw InvalidCycleStatusTransitionError when cycle is not active', async () => {
      const existingCycle = { id: 1, plasmaId: PLASMA_ID, cycleNumber: 1, docType: 'CP', status: 'completed', capacity: 5000 }
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existingCycle]),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      await expect(
        updateCycle(1, { docType: 'Patriot' }, TENANT_ID, USER_ID),
      ).rejects.toThrow(InvalidCycleStatusTransitionError)
    })

    it('should update cycle when active and valid', async () => {
      const existingCycle = { id: 1, plasmaId: PLASMA_ID, cycleNumber: 1, docType: 'CP', status: 'active', capacity: 5000 }
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existingCycle]),
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

      const result = await updateCycle(1, { docType: 'Patriot' }, TENANT_ID, USER_ID)

      expect(result).toEqual({ success: true })
    })
  })

  describe('softDeleteCycle', () => {
    it('should throw CycleNotFoundError when cycle does not exist', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      await expect(softDeleteCycle(999, TENANT_ID, USER_ID)).rejects.toThrow(CycleNotFoundError)
    })

    it('should throw CycleHasRecordingsError when daily recordings exist', async () => {
      const existingCycle = { id: 1, plasmaId: PLASMA_ID, cycleNumber: 1, docType: 'CP', status: 'active' }
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existingCycle]),
      }
      const mockRecordingSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 5 }]),
      }

      mockSelect
        .mockReturnValueOnce(mockSelect as any)
        .mockReturnValueOnce(mockRecordingSelect as any)

      await expect(softDeleteCycle(1, TENANT_ID, USER_ID)).rejects.toThrow(CycleHasRecordingsError)
    })

    it('should soft-delete cycle when no recordings exist', async () => {
      const existingCycle = { id: 1, plasmaId: PLASMA_ID, cycleNumber: 1, docType: 'CP', status: 'active' }
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existingCycle]),
      }
      const mockRecordingSelect = {
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
        .mockReturnValueOnce(mockRecordingSelect as any)
      mockUpdate.mockReturnValue(mockUpdate as any)
      mockInsert.mockReturnValue(mockAuditInsert as any)

      const result = await softDeleteCycle(1, TENANT_ID, USER_ID)

      expect(result).toEqual({ success: true })
    })
  })

  describe('completeCycle', () => {
    it('should throw CycleNotFoundError when cycle does not exist', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      await expect(
        completeCycle(999, { harvestDate: '2026-02-01', finalPopulation: 2800 }, TENANT_ID, USER_ID),
      ).rejects.toThrow(CycleNotFoundError)
    })

    it('should throw InvalidCycleStatusTransitionError when cycle is not active', async () => {
      const existingCycle = { id: 1, plasmaId: PLASMA_ID, cycleNumber: 1, docType: 'CP', status: 'failed' }
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existingCycle]),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      await expect(
        completeCycle(1, { harvestDate: '2026-02-01', finalPopulation: 2800 }, TENANT_ID, USER_ID),
      ).rejects.toThrow(InvalidCycleStatusTransitionError)
    })

    it('should complete cycle when active', async () => {
      const existingCycle = { id: 1, plasmaId: PLASMA_ID, cycleNumber: 1, docType: 'CP', status: 'active' }
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existingCycle]),
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

      const result = await completeCycle(1, { harvestDate: '2026-02-01', finalPopulation: 2800 }, TENANT_ID, USER_ID)

      expect(result).toEqual({ success: true })
    })
  })

  describe('failCycle', () => {
    it('should throw CycleNotFoundError when cycle does not exist', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      await expect(
        failCycle(999, { harvestDate: '2026-02-01', notes: 'Disease outbreak' }, TENANT_ID, USER_ID),
      ).rejects.toThrow(CycleNotFoundError)
    })

    it('should throw InvalidCycleStatusTransitionError when cycle is not active', async () => {
      const existingCycle = { id: 1, plasmaId: PLASMA_ID, cycleNumber: 1, docType: 'CP', status: 'completed' }
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existingCycle]),
      }
      mockSelect.mockReturnValue(mockSelect as any)

      await expect(
        failCycle(1, { harvestDate: '2026-02-01', notes: 'Disease outbreak' }, TENANT_ID, USER_ID),
      ).rejects.toThrow(InvalidCycleStatusTransitionError)
    })

    it('should fail cycle when active', async () => {
      const existingCycle = { id: 1, plasmaId: PLASMA_ID, cycleNumber: 1, docType: 'CP', status: 'active' }
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existingCycle]),
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

      const result = await failCycle(1, { harvestDate: '2026-02-01', notes: 'Disease outbreak' }, TENANT_ID, USER_ID)

      expect(result).toEqual({ success: true })
    })
  })
})
