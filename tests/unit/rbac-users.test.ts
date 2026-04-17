import { describe, it, expect } from 'vitest'
import {
  RoleHasUsersError,
  DefaultRoleError,
  PermissionAssignmentError,
} from '../../server/src/modules/rbac/rbac.errors'
import {
  DuplicateEmailError,
  InvalidRoleError,
  CsvImportError,
  UserNotFoundError,
  WeakPasswordError,
  InvalidTenantError,
} from '../../server/src/modules/users/users.errors'

describe('rbac.errors.ts', () => {
  describe('RoleHasUsersError', () => {
    it('should create error with correct message and name', () => {
      const error = new RoleHasUsersError('Admin', 5)
      expect(error.message).toBe('Cannot delete role "Admin": 5 active user(s) assigned')
      expect(error.name).toBe('RoleHasUsersError')
    })

    it('should handle zero users', () => {
      const error = new RoleHasUsersError('Viewer', 0)
      expect(error.message).toBe('Cannot delete role "Viewer": 0 active user(s) assigned')
    })
  })

  describe('DefaultRoleError', () => {
    it('should create error with correct message and name', () => {
      const error = new DefaultRoleError('Super Admin')
      expect(error.message).toBe('Cannot modify default role "Super Admin": system-protected')
      expect(error.name).toBe('DefaultRoleError')
    })
  })

  describe('PermissionAssignmentError', () => {
    it('should create error with message', () => {
      const error = new PermissionAssignmentError('Invalid permission action')
      expect(error.message).toBe('Invalid permission action')
      expect(error.name).toBe('PermissionAssignmentError')
    })
  })
})

describe('users.errors.ts', () => {
  describe('DuplicateEmailError', () => {
    it('should create error with correct message and name', () => {
      const error = new DuplicateEmailError('test@example.com')
      expect(error.message).toBe('Email "test@example.com" is already registered')
      expect(error.name).toBe('DuplicateEmailError')
    })
  })

  describe('InvalidRoleError', () => {
    it('should create error with correct message and name', () => {
      const error = new InvalidRoleError(999)
      expect(error.message).toBe('Role ID 999 does not exist')
      expect(error.name).toBe('InvalidRoleError')
    })
  })

  describe('CsvImportError', () => {
    it('should create error with row and message', () => {
      const error = new CsvImportError(5, 'Missing email')
      expect(error.message).toBe('CSV row 5: Missing email')
      expect(error.name).toBe('CsvImportError')
    })
  })

  describe('UserNotFoundError', () => {
    it('should create error with correct message and name', () => {
      const error = new UserNotFoundError('abc123')
      expect(error.message).toBe('User "abc123" not found')
      expect(error.name).toBe('UserNotFoundError')
    })
  })

  describe('WeakPasswordError', () => {
    it('should create error with message', () => {
      const error = new WeakPasswordError('Password too short')
      expect(error.message).toBe('Password too short')
      expect(error.name).toBe('WeakPasswordError')
    })
  })

  describe('InvalidTenantError', () => {
    it('should create error with correct message and name', () => {
      const error = new InvalidTenantError(999)
      expect(error.message).toBe('Tenant ID 999 does not exist')
      expect(error.name).toBe('InvalidTenantError')
    })
  })
})