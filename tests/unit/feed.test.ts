import { describe, it, expect } from 'vitest'
import {
  FeedProductNotFoundError,
  FeedStockNotFoundError,
  DuplicateFeedCodeError,
  NegativeStockError,
  InvalidSuratJalanError,
  PlasmaNotInTenantError,
} from '../../server/src/modules/feed/feed.errors'

describe('feed.errors.ts', () => {
  describe('FeedProductNotFoundError', () => {
    it('should create error with correct message and name', () => {
      const error = new FeedProductNotFoundError(42)
      expect(error.message).toBe('Feed product "42" not found')
      expect(error.name).toBe('FeedProductNotFoundError')
    })
  })

  describe('FeedStockNotFoundError', () => {
    it('should create error with correct message and name', () => {
      const error = new FeedStockNotFoundError(1, 2)
      expect(error.message).toBe('Feed stock not found for plasma "1" and product "2"')
      expect(error.name).toBe('FeedStockNotFoundError')
    })
  })

  describe('DuplicateFeedCodeError', () => {
    it('should create error with correct message and name', () => {
      const error = new DuplicateFeedCodeError('CP-10')
      expect(error.message).toBe('Feed product code "CP-10" already exists')
      expect(error.name).toBe('DuplicateFeedCodeError')
    })
  })

  describe('NegativeStockError', () => {
    it('should create error with correct message and name', () => {
      const error = new NegativeStockError('100', '150')
      expect(error.message).toBe('Insufficient stock: current="100kg", requested="150kg"')
      expect(error.name).toBe('NegativeStockError')
    })

    it('should show current less than requested', () => {
      const error = new NegativeStockError('50', '200')
      expect(error.message).toContain('current="50kg"')
      expect(error.message).toContain('requested="200kg"')
    })
  })

  describe('InvalidSuratJalanError', () => {
    it('should create error with correct message and name', () => {
      const error = new InvalidSuratJalanError('SJ-2026-001')
      expect(error.message).toBe('Surat Jalan number "SJ-2026-001" already exists')
      expect(error.name).toBe('InvalidSuratJalanError')
    })
  })

  describe('PlasmaNotInTenantError', () => {
    it('should create error with correct message and name', () => {
      const error = new PlasmaNotInTenantError(5)
      expect(error.message).toBe('Plasma "5" does not belong to your tenant')
      expect(error.name).toBe('PlasmaNotInTenantError')
    })
  })
})