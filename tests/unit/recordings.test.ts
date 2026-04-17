import { describe, it, expect, vi } from 'vitest'
import {
  RecordingNotFoundError,
  CycleNotActiveError,
  FutureDateError,
  DuplicateRecordingDateError,
  CycleNotFoundError,
} from '../../server/src/modules/recordings/recordings.errors'
import { parseCSV, validateRow, importBulk } from '../../server/src/modules/recordings/recordings.bulk'

describe('recordings.errors.ts', () => {
  describe('RecordingNotFoundError', () => {
    it('should create error with correct message and name', () => {
      const error = new RecordingNotFoundError(42)
      expect(error.message).toBe('Recording "42" not found')
      expect(error.name).toBe('RecordingNotFoundError')
    })
  })

  describe('CycleNotActiveError', () => {
    it('should create error with correct message and name', () => {
      const error = new CycleNotActiveError(5, 'completed')
      expect(error.message).toBe('Cycle "5" is not active (status: "completed")')
      expect(error.name).toBe('CycleNotActiveError')
    })

    it('should include status in message', () => {
      const error = new CycleNotActiveError(5, 'failed')
      expect(error.message).toBe('Cycle "5" is not active (status: "failed")')
    })
  })

  describe('FutureDateError', () => {
    it('should create error with correct message and name', () => {
      const error = new FutureDateError('2099-12-31')
      expect(error.message).toBe('Recording date "2099-12-31" cannot be in the future')
      expect(error.name).toBe('FutureDateError')
    })
  })

  describe('DuplicateRecordingDateError', () => {
    it('should create error with correct message and name', () => {
      const error = new DuplicateRecordingDateError(5, '2026-04-17')
      expect(error.message).toBe('Recording for cycle "5" on date "2026-04-17" already exists')
      expect(error.name).toBe('DuplicateRecordingDateError')
    })
  })
})

describe('recordings.bulk.ts - parseCSV', () => {
  it('should parse valid CSV correctly', () => {
    const csv = `date,dead,culled,remaining_population,body_weight_g,feed_consumed_kg
2026-01-15,10,5,2985,500,100
2026-01-16,5,0,2980,520,110`

    const result = parseCSV(csv)

    expect(result).toHaveLength(2)
    expect(result[0].date).toBe('2026-01-15')
    expect(result[0].dead).toBe(10)
    expect(result[0].remaining_population).toBe(2985)
    expect(result[1].date).toBe('2026-01-16')
  })

  it('should throw error when CSV has no data rows', () => {
    const csv = `date,dead,culled,remaining_population,body_weight_g,feed_consumed_kg`

    expect(() => parseCSV(csv)).toThrow('CSV must contain at least a header row and one data row')
  })

  it('should throw error when required column is missing', () => {
    const csv = `date,dead,remaining_population,body_weight_g
2026-01-15,10,2985,500`

    expect(() => parseCSV(csv)).toThrow('Missing required column: culled')
  })

  it('should parse notes column when present', () => {
    const csv = `date,dead,culled,remaining_population,body_weight_g,feed_consumed_kg,notes
2026-01-15,10,5,2985,500,100,Test note`

    const result = parseCSV(csv)

    expect(result[0].notes).toBe('Test note')
  })

  it('should throw error for row with insufficient columns', () => {
    const csv = `date,dead,culled,remaining_population,body_weight_g,feed_consumed_kg
2026-01-15,10`

    expect(() => parseCSV(csv)).toThrow('Not enough columns')
  })
})

describe('recordings.bulk.ts - validateRow', () => {
  const mockDb: any = {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ id: 1, status: 'active' }]),
    })),
  }

  it('should return error for invalid date format', async () => {
    const row = {
      date: '01-15-2026',
      dead: 0,
      culled: 0,
      remaining_population: 3000,
      body_weight_g: 500,
      feed_consumed_kg: 100,
    }

    const result = await validateRow(row, 1, 1)

    expect(result).toContain('Invalid date format')
  })

  it('should return error for future date', async () => {
    const row = {
      date: '2099-12-31',
      dead: 0,
      culled: 0,
      remaining_population: 3000,
      body_weight_g: 500,
      feed_consumed_kg: 100,
    }

    const result = await validateRow(row, 1, 1)

    expect(result).toContain('Future date not allowed')
  })

  it('should return error for negative dead value', async () => {
    const row = {
      date: '2026-01-15',
      dead: -5,
      culled: 0,
      remaining_population: 3000,
      body_weight_g: 500,
      feed_consumed_kg: 100,
    }

    const result = await validateRow(row, 1, 1)

    expect(result).toContain('must be non-negative')
  })

  it('should return error for negative body_weight_g', async () => {
    const row = {
      date: '2026-01-15',
      dead: 0,
      culled: 0,
      remaining_population: 3000,
      body_weight_g: -5,
      feed_consumed_kg: 100,
    }

    const result = await validateRow(row, 1, 1)

    expect(result).toContain('must be non-negative')
  })
})

describe('recordings.bulk.ts - importBulk', () => {
  it('should return error when exceeds 1000 rows', async () => {
    const csv = 'date,dead,culled,remaining_population,body_weight_g,feed_consumed_kg\n' +
      Array(1001).fill('2026-01-15,0,0,3000,500,100').join('\n')

    const result = await importBulk(csv, 1, 1, 'user123')

    expect(result.success).toBe(false)
    expect(result.errors[0].error).toContain('Maximum 1000 rows')
  })

  it('should return parse error for invalid CSV', async () => {
    const csv = 'invalid-csv-content'

    const result = await importBulk(csv, 1, 1, 'user123')

    expect(result.success).toBe(false)
    expect(result.errors[0].row).toBe(0)
  })
})

describe('recordings.errors.ts - CycleNotFoundError', () => {
  it('should create error with correct message and name', () => {
    const error = new CycleNotFoundError(42)
    expect(error.message).toBe('Cycle "42" not found')
    expect(error.name).toBe('CycleNotFoundError')
  })
})