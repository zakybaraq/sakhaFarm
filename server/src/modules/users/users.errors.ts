/**
 * User Management-specific error classes.
 *
 * These errors are thrown when user management operations fail due to
 * business rule violations, such as duplicate emails or invalid role assignments.
 */

/**
 * Thrown when attempting to create a user with an email that already exists.
 *
 * @param email - The duplicate email address
 */
export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`Email "${email}" is already registered`)
    this.name = 'DuplicateEmailError'
  }
}

/**
 * Thrown when attempting to assign a non-existent role to a user.
 *
 * @param roleId - The invalid role ID
 */
export class InvalidRoleError extends Error {
  constructor(roleId: number) {
    super(`Role ID ${roleId} does not exist`)
    this.name = 'InvalidRoleError'
  }
}

/**
 * Thrown when CSV import fails due to invalid data.
 *
 * @param row - The row number where the error occurred
 * @param message - Description of the validation failure
 */
export class CsvImportError extends Error {
  constructor(row: number, message: string) {
    super(`CSV row ${row}: ${message}`)
    this.name = 'CsvImportError'
  }
}

/**
 * Thrown when attempting to operate on a user that does not exist.
 *
 * @param userId - The user ID that was not found
 */
export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User "${userId}" not found`)
    this.name = 'UserNotFoundError'
  }
}

/**
 * Thrown when a password does not meet strength requirements.
 *
 * @param message - Description of the password requirement that was not met
 */
export class WeakPasswordError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WeakPasswordError'
  }
}

/**
 * Thrown when attempting to assign a non-existent tenant to a user.
 *
 * @param tenantId - The invalid tenant ID
 */
export class InvalidTenantError extends Error {
  constructor(tenantId: number) {
    super(`Tenant ID ${tenantId} does not exist`)
    this.name = 'InvalidTenantError'
  }
}
