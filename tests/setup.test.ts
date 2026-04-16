import { describe, it, expect } from 'vitest'

describe('Test Setup', () => {
  it('should pass basic assertions', () => {
    expect(true).toBe(true)
    expect(1 + 1).toBe(2)
    expect([1, 2, 3]).toContain(2)
  })

  it('should handle async assertions', async () => {
    const result = await Promise.resolve('ok')
    expect(result).toBe('ok')
  })
})
