import { describe, it, expect } from 'vitest'
import {
  stockResumeToCSV,
  performanceToCSV,
  StockResumeRow,
  PerformanceRow,
} from '../../server/src/modules/reporting/reporting.service'

describe('reporting.service.ts - CSV Export', () => {
  describe('stockResumeToCSV', () => {
    it('should generate CSV with correct headers', () => {
      const rows: StockResumeRow[] = []
      const result = stockResumeToCSV(rows)
      const headers = result.split('\n')[0]
      expect(headers).toBe(
        'feed_product_id,feed_product_name,feed_product_code,phase,zak_kg_conversion,total_opening_stock_kg,total_in_kg,total_out_kg,total_closing_stock_kg,total_closing_stock_zak,plasma_id,plasma_name,unit_id,unit_name,plasma_opening_stock_kg,plasma_in_kg,plasma_out_kg,plasma_closing_stock_kg,plasma_closing_stock_zak'
      )
    })

    it('should export single row with single plasma', () => {
      const rows: StockResumeRow[] = [
        {
          feedProductId: 1,
          feedProductName: 'Starter Feed',
          feedProductCode: 'SF-001',
          phase: 'starter',
          zakKgConversion: '50',
          totalOpeningStockKg: '100.000',
          totalInKg: '50.000',
          totalOutKg: '30.000',
          totalClosingStockKg: '120.000',
          totalClosingStockZak: '2.400',
          plasmas: [
            {
              plasmaId: 1,
              plasmaName: 'Plasma A',
              unitId: 1,
              unitName: 'Unit 1',
              openingStockKg: '100.000',
              totalInKg: '50.000',
              totalOutKg: '30.000',
              closingStockKg: '120.000',
              closingStockZak: '2.400',
            },
          ],
        },
      ]
      const result = stockResumeToCSV(rows)
      const lines = result.split('\n')
      expect(lines).toHaveLength(2)
      expect(lines[1]).toContain('1')
      expect(lines[1]).toContain('Starter Feed')
      expect(lines[1]).toContain('SF-001')
      expect(lines[1]).toContain('starter')
    })

    it('should export multiple plasmas for same product', () => {
      const rows: StockResumeRow[] = [
        {
          feedProductId: 1,
          feedProductName: 'Starter Feed',
          feedProductCode: 'SF-001',
          phase: 'starter',
          zakKgConversion: '50',
          totalOpeningStockKg: '200.000',
          totalInKg: '100.000',
          totalOutKg: '60.000',
          totalClosingStockKg: '240.000',
          totalClosingStockZak: '4.800',
          plasmas: [
            {
              plasmaId: 1,
              plasmaName: 'Plasma A',
              unitId: 1,
              unitName: 'Unit 1',
              openingStockKg: '100.000',
              totalInKg: '50.000',
              totalOutKg: '30.000',
              closingStockKg: '120.000',
              closingStockZak: '2.400',
            },
            {
              plasmaId: 2,
              plasmaName: 'Plasma B',
              unitId: 1,
              unitName: 'Unit 1',
              openingStockKg: '100.000',
              totalInKg: '50.000',
              totalOutKg: '30.000',
              closingStockKg: '120.000',
              closingStockZak: '2.400',
            },
          ],
        },
      ]
      const result = stockResumeToCSV(rows)
      const lines = result.split('\n')
      expect(lines).toHaveLength(3)
    })

    it('should escape values containing commas', () => {
      const rows: StockResumeRow[] = [
        {
          feedProductId: 1,
          feedProductName: 'Feed, with comma',
          feedProductCode: 'SF-001',
          phase: 'starter',
          zakKgConversion: '50',
          totalOpeningStockKg: '100.000',
          totalInKg: '50.000',
          totalOutKg: '30.000',
          totalClosingStockKg: '120.000',
          totalClosingStockZak: '2.400',
          plasmas: [
            {
              plasmaId: 1,
              plasmaName: 'Plasma, A',
              unitId: 1,
              unitName: 'Unit, 1',
              openingStockKg: '100.000',
              totalInKg: '50.000',
              totalOutKg: '30.000',
              closingStockKg: '120.000',
              closingStockZak: '2.400',
            },
          ],
        },
      ]
      const result = stockResumeToCSV(rows)
      expect(result).toContain('"Feed, with comma"')
      expect(result).toContain('"Plasma, A"')
      expect(result).toContain('"Unit, 1"')
    })

    it('should escape values containing quotes', () => {
      const rows: StockResumeRow[] = [
        {
          feedProductId: 1,
          feedProductName: 'Feed "Premium"',
          feedProductCode: 'SF-001',
          phase: 'starter',
          zakKgConversion: '50',
          totalOpeningStockKg: '100.000',
          totalInKg: '50.000',
          totalOutKg: '30.000',
          totalClosingStockKg: '120.000',
          totalClosingStockZak: '2.400',
          plasmas: [
            {
              plasmaId: 1,
              plasmaName: 'Plasma "A"',
              unitId: 1,
              unitName: 'Unit 1',
              openingStockKg: '100.000',
              totalInKg: '50.000',
              totalOutKg: '30.000',
              closingStockKg: '120.000',
              closingStockZak: '2.400',
            },
          ],
        },
      ]
      const result = stockResumeToCSV(rows)
      expect(result).toContain('"Feed ""Premium"""')
      expect(result).toContain('"Plasma ""A"""')
    })
  })

  describe('performanceToCSV', () => {
    it('should generate CSV with correct headers', () => {
      const rows: PerformanceRow[] = []
      const result = performanceToCSV(rows)
      const headers = result.split('\n')[0]
      expect(headers).toBe(
        'date,cycle_id,cycle_number,doc_type,plasma_id,plasma_name,unit_id,unit_name,day_age,avg_body_weight_g,feed_consumed_kg,fcr,deplesi_percent,mortality_percent,population,cumulative_mortality_percent'
      )
    })

    it('should export single performance row', () => {
      const rows: PerformanceRow[] = [
        {
          date: '2026-04-01',
          cycleId: 1,
          cycleNumber: 1,
          docType: 'DOC',
          plasmaId: 1,
          plasmaName: 'Plasma A',
          unitId: 1,
          unitName: 'Unit 1',
          dayAge: 7,
          avgBodyWeightG: 150,
          feedConsumedKg: 5.5,
          fcr: 1.2,
          deplesiPercent: 2.5,
          mortalityPercent: 0.5,
          population: 9500,
          cumulativeMortalityPercent: 0.5,
        },
      ]
      const result = performanceToCSV(rows)
      const lines = result.split('\n')
      expect(lines).toHaveLength(2)
      expect(lines[1]).toContain('2026-04-01')
      expect(lines[1]).toContain('1')
      expect(lines[1]).toContain('DOC')
      expect(lines[1]).toContain('Plasma A')
      expect(lines[1]).toContain('7')
      expect(lines[1]).toContain('150')
      expect(lines[1]).toContain('1.2')
    })

    it('should handle null avgBodyWeightG', () => {
      const rows: PerformanceRow[] = [
        {
          date: '2026-04-01',
          cycleId: 1,
          cycleNumber: 1,
          docType: 'DOC',
          plasmaId: 1,
          plasmaName: 'Plasma A',
          unitId: 1,
          unitName: 'Unit 1',
          dayAge: 1,
          avgBodyWeightG: null,
          feedConsumedKg: 2.0,
          fcr: null,
          deplesiPercent: 0,
          mortalityPercent: 0,
          population: 10000,
          cumulativeMortalityPercent: 0,
        },
      ]
      const result = performanceToCSV(rows)
      const lines = result.split('\n')
      expect(lines[1]).toContain(',,2,')
    })

    it('should handle null fcr', () => {
      const rows: PerformanceRow[] = [
        {
          date: '2026-04-01',
          cycleId: 1,
          cycleNumber: 1,
          docType: 'DOC',
          plasmaId: 1,
          plasmaName: 'Plasma A',
          unitId: 1,
          unitName: 'Unit 1',
          dayAge: 7,
          avgBodyWeightG: 150,
          feedConsumedKg: 0,
          fcr: null,
          deplesiPercent: 0,
          mortalityPercent: 0,
          population: 10000,
          cumulativeMortalityPercent: 0,
        },
      ]
      const result = performanceToCSV(rows)
      const lines = result.split('\n')
      expect(lines[1]).toContain(',,')
    })

    it('should export multiple rows', () => {
      const rows: PerformanceRow[] = [
        {
          date: '2026-04-01',
          cycleId: 1,
          cycleNumber: 1,
          docType: 'DOC',
          plasmaId: 1,
          plasmaName: 'Plasma A',
          unitId: 1,
          unitName: 'Unit 1',
          dayAge: 7,
          avgBodyWeightG: 150,
          feedConsumedKg: 5.5,
          fcr: 1.2,
          deplesiPercent: 2.5,
          mortalityPercent: 0.5,
          population: 9500,
          cumulativeMortalityPercent: 0.5,
        },
        {
          date: '2026-04-02',
          cycleId: 1,
          cycleNumber: 1,
          docType: 'DOC',
          plasmaId: 1,
          plasmaName: 'Plasma A',
          unitId: 1,
          unitName: 'Unit 1',
          dayAge: 8,
          avgBodyWeightG: 180,
          feedConsumedKg: 6.0,
          fcr: 1.1,
          deplesiPercent: 3.0,
          mortalityPercent: 0.5,
          population: 9450,
          cumulativeMortalityPercent: 0.55,
        },
      ]
      const result = performanceToCSV(rows)
      const lines = result.split('\n')
      expect(lines).toHaveLength(3)
    })

    it('should escape docType with special characters', () => {
      const rows: PerformanceRow[] = [
        {
          date: '2026-04-01',
          cycleId: 1,
          cycleNumber: 1,
          docType: 'DOC, Premium',
          plasmaId: 1,
          plasmaName: 'Plasma A',
          unitId: 1,
          unitName: 'Unit 1',
          dayAge: 7,
          avgBodyWeightG: 150,
          feedConsumedKg: 5.5,
          fcr: 1.2,
          deplesiPercent: 2.5,
          mortalityPercent: 0.5,
          population: 9500,
          cumulativeMortalityPercent: 0.5,
        },
      ]
      const result = performanceToCSV(rows)
      expect(result).toContain('"DOC, Premium"')
    })
  })
})