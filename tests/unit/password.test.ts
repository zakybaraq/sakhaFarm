import { describe, it, expect } from 'vitest'
import {
  validatePasswordStrength,
  generateTempPassword,
} from '../../server/src/lib/password'

describe('lib/password.ts', () => {
  describe('validatePasswordStrength', () => {
    it('should return null for valid password', () => {
      const result = validatePasswordStrength('Password1!')
      expect(result).toBeNull()
    })

    it('should return error for password too short', () => {
      const result = validatePasswordStrength('Pass1!')
      expect(result).toBe('Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character')
    })

    it('should return error for missing uppercase', () => {
      const result = validatePasswordStrength('password1!')
      expect(result).toContain('uppercase')
    })

    it('should return error for missing lowercase', () => {
      const result = validatePasswordStrength('PASSWORD1!')
      expect(result).toContain('lowercase')
    })

    it('should return error for missing number', () => {
      const result = validatePasswordStrength('Password!')
      expect(result).toContain('number')
    })

    it('should return error for missing special character', () => {
      const result = validatePasswordStrength('Password1')
      expect(result).toContain('special')
    })

    it('should accept common special characters', () => {
      expect(validatePasswordStrength('Password1@')).toBeNull()
      expect(validatePasswordStrength('Password1!')).toBeNull()
      expect(validatePasswordStrength('Password1#')).toBeNull()
      expect(validatePasswordStrength('Password1$')).toBeNull()
      expect(validatePasswordStrength('Password1%')).toBeNull()
    })
  })

  describe('generateTempPassword', () => {
    it('should generate password of default length', () => {
      const password = generateTempPassword()
      expect(password).toHaveLength(12)
    })

    it('should generate password of custom length', () => {
      const password = generateTempPassword(16)
      expect(password).toHaveLength(16)
    })

    it('should contain at least one uppercase', () => {
      const password = generateTempPassword()
      expect(password).toMatch(/[A-Z]/)
    })

    it('should contain at least one lowercase', () => {
      const password = generateTempPassword()
      expect(password).toMatch(/[a-z]/)
    })

    it('should contain at least one digit', () => {
      const password = generateTempPassword()
      expect(password).toMatch(/[2-9]/)
    })

    it('should contain at least one special character', () => {
      const password = generateTempPassword()
      expect(password).toMatch(/[@$!#]/)
    })

    it('should generate different passwords each time', () => {
      const password1 = generateTempPassword()
      const password2 = generateTempPassword()
      const password3 = generateTempPassword()
      expect(password1).not.toBe(password2)
      expect(password2).not.toBe(password3)
    })
  })
})