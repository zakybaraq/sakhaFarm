import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  PlasmaNotFoundError,
  PlasmaHasActiveCyclesError,
  PlasmaNotInTenantUnitError,
} from '../../server/src/modules/plasma/plasma.errors'
import {
  createPlasma,
  listPlasmas,
  getPlasma,
  updatePlasma,
  softDeletePlasma,
} from '../../server/src/modules/plasma/plasma.service'
import { db } from '../../server/src/config/database'
import { plasmas } from '../../server/src/db/schema/plasmas'
import { units } from '../../server/src/db/schema/units'
import { tenants } from '../../server/src/db/schema/tenants'
import { cycles } from '../../server/src/db/schema/cycles'
import { eq } from 'drizzle-orm'

describe('Plasma Errors', () => {
  describe('PlasmaNotFoundError', () => {
    it('should have correct message and name', () => {
      const error = new PlasmaNotFoundError(42)
      expect(error.message).toBe('Plasma "42" not found')
      expect(error.name).toBe('PlasmaNotFoundError')
    })
  })

  describe('PlasmaHasActiveCyclesError', () => {
    it('should have correct message and name', () => {
      const error = new PlasmaHasActiveCyclesError(42, 3)
      expect(error.message).toBe('Cannot delete plasma "42": 3 active cycle(s) exist')
      expect(error.name).toBe('PlasmaHasActiveCyclesError')
    })

    it('should handle zero cycles', () => {
      const error = new PlasmaHasActiveCyclesError(1, 0)
      expect(error.message).toBe('Cannot delete plasma "1": 0 active cycle(s) exist')
    })
  })

  describe('PlasmaNotInTenantUnitError', () => {
    it('should have correct message and name', () => {
      const error = new PlasmaNotInTenantUnitError(99)
      expect(error.message).toBe('Unit "99" not found in your tenant')
      expect(error.name).toBe('PlasmaNotInTenantUnitError')
    })
  })
})

describe('Plasma Service', () => {
  const TEST_TENANT_ID = 9999
  const TEST_UNIT_ID = 9999
  const TEST_USER_ID = 'testuser01'

  beforeAll(async () => {
    // Create test tenant
    await db.insert(tenants).values({
      id: TEST_TENANT_ID,
      name: 'Test Tenant',
      code: 'TEST',
    }).onDuplicateKeyUpdate({ set: { name: 'Test Tenant' } })

    // Create test unit
    await db.insert(units).values({
      id: TEST_UNIT_ID,
      tenantId: TEST_TENANT_ID,
      name: 'Test Unit',
      code: 'TST',
    }).onDuplicateKeyUpdate({ set: { name: 'Test Unit' } })
  })

  afterAll(async () => {
    // Clean up test data
    await db.delete(plasmas).where(eq(plasmas.unitId, TEST_UNIT_ID))
    await db.delete(units).where(eq(units.id, TEST_UNIT_ID))
    await db.delete(tenants).where(eq(tenants.id, TEST_TENANT_ID))
  })

  describe('createPlasma', () => {
    it('should create a plasma with valid unit', async () => {
      const result = await createPlasma(
        { unitId: TEST_UNIT_ID, name: 'Test Plasma', farmerName: 'John Doe', capacity: 5000 },
        TEST_TENANT_ID,
        TEST_USER_ID,
      )

      expect(result).toBeDefined()
      expect(result.name).toBe('Test Plasma')
      expect(result.farmerName).toBe('John Doe')
      expect(result.capacity).toBe(5000)
      expect(result.unitId).toBe(TEST_UNIT_ID)
    })

    it('should throw PlasmaNotInTenantUnitError for invalid unit', async () => {
      await expect(
        createPlasma(
          { unitId: 999999, name: 'Bad Plasma', capacity: 100 },
          TEST_TENANT_ID,
          TEST_USER_ID,
        ),
      ).rejects.toThrow(PlasmaNotInTenantUnitError)
    })

    it('should create plasma with optional fields omitted', async () => {
      const result = await createPlasma(
        { unitId: TEST_UNIT_ID, name: 'Minimal Plasma' },
        TEST_TENANT_ID,
        TEST_USER_ID,
      )

      expect(result.name).toBe('Minimal Plasma')
    })
  })

  describe('listPlasmas', () => {
    it('should return non-deleted plasmas for tenant', async () => {
      const result = await listPlasmas(TEST_TENANT_ID)
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should filter by unitId when provided', async () => {
      const result = await listPlasmas(TEST_TENANT_ID, TEST_UNIT_ID)
      expect(result.every((p: any) => p.unitId === TEST_UNIT_ID)).toBe(true)
    })

    it('should exclude soft-deleted plasmas', async () => {
      // Create a plasma to soft-delete
      const plasma = await createPlasma(
        { unitId: TEST_UNIT_ID, name: 'To Delete', capacity: 100 },
        TEST_TENANT_ID,
        TEST_USER_ID,
      )

      await softDeletePlasma(plasma.id, TEST_TENANT_ID, TEST_USER_ID)

      const result = await listPlasmas(TEST_TENANT_ID, TEST_UNIT_ID)
      const deletedExists = result.some((p: any) => p.id === plasma.id)
      expect(deletedExists).toBe(false)
    })
  })

  describe('getPlasma', () => {
    it('should return a plasma by id', async () => {
      const plasma = await createPlasma(
        { unitId: TEST_UNIT_ID, name: 'Get Test', capacity: 200 },
        TEST_TENANT_ID,
        TEST_USER_ID,
      )

      const result = await getPlasma(plasma.id, TEST_TENANT_ID)
      expect(result.id).toBe(plasma.id)
      expect(result.name).toBe('Get Test')
    })

    it('should throw PlasmaNotFoundError for non-existent id', async () => {
      await expect(getPlasma(999999, TEST_TENANT_ID)).rejects.toThrow(PlasmaNotFoundError)
    })

    it('should throw PlasmaNotFoundError for soft-deleted plasma', async () => {
      const plasma = await createPlasma(
        { unitId: TEST_UNIT_ID, name: 'Delete Test', capacity: 100 },
        TEST_TENANT_ID,
        TEST_USER_ID,
      )

      await softDeletePlasma(plasma.id, TEST_TENANT_ID, TEST_USER_ID)

      await expect(getPlasma(plasma.id, TEST_TENANT_ID)).rejects.toThrow(PlasmaNotFoundError)
    })
  })

  describe('updatePlasma', () => {
    it('should update plasma fields', async () => {
      const plasma = await createPlasma(
        { unitId: TEST_UNIT_ID, name: 'Update Test', capacity: 100 },
        TEST_TENANT_ID,
        TEST_USER_ID,
      )

      const result = await updatePlasma(
        plasma.id,
        { name: 'Updated Name', capacity: 200 },
        TEST_TENANT_ID,
        TEST_USER_ID,
      )

      expect(result.success).toBe(true)

      const updated = await getPlasma(plasma.id, TEST_TENANT_ID)
      expect(updated.name).toBe('Updated Name')
      expect(updated.capacity).toBe(200)
    })

    it('should throw PlasmaNotFoundError for non-existent id', async () => {
      await expect(
        updatePlasma(999999, { name: 'Nope' }, TEST_TENANT_ID, TEST_USER_ID),
      ).rejects.toThrow(PlasmaNotFoundError)
    })
  })

  describe('softDeletePlasma', () => {
    it('should soft-delete a plasma without active cycles', async () => {
      const plasma = await createPlasma(
        { unitId: TEST_UNIT_ID, name: 'Soft Delete Test', capacity: 100 },
        TEST_TENANT_ID,
        TEST_USER_ID,
      )

      const result = await softDeletePlasma(plasma.id, TEST_TENANT_ID, TEST_USER_ID)
      expect(result.success).toBe(true)

      // Verify it's excluded from list
      const listResult = await listPlasmas(TEST_TENANT_ID, TEST_UNIT_ID)
      expect(listResult.some((p: any) => p.id === plasma.id)).toBe(false)
    })

    it('should throw PlasmaHasActiveCyclesError when active cycles exist', async () => {
      const plasma = await createPlasma(
        { unitId: TEST_UNIT_ID, name: 'Active Cycle Test', capacity: 100 },
        TEST_TENANT_ID,
        TEST_USER_ID,
      )

      // Create an active cycle
      await db.insert(cycles).values({
        plasmaId: plasma.id,
        cycleNumber: 1,
        docType: 'CP',
        chickInDate: new Date().toISOString().split('T')[0],
        initialPopulation: 50,
        status: 'active',
      })

      await expect(
        softDeletePlasma(plasma.id, TEST_TENANT_ID, TEST_USER_ID),
      ).rejects.toThrow(PlasmaHasActiveCyclesError)
    })
  })
})
