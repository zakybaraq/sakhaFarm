/**
 * Plasma module-specific error classes.
 *
 * These errors are thrown when plasma operations fail due to
 * business rule violations, such as non-existent plasmas,
 * active cycles preventing deletion, or tenant isolation breaches.
 */

/**
 * Thrown when attempting to retrieve, update, or delete a plasma that does not exist
 * or has been soft-deleted.
 *
 * @param id - The plasma ID that was not found
 */
export class PlasmaNotFoundError extends Error {
  constructor(id: number) {
    super(`Plasma "${id}" not found`)
    this.name = 'PlasmaNotFoundError'
  }
}

/**
 * Thrown when attempting to soft-delete a plasma that has active farming cycles.
 *
 * @param plasmaId - The plasma ID being deleted
 * @param cycleCount - The number of active cycles blocking the deletion
 */
export class PlasmaHasActiveCyclesError extends Error {
  constructor(plasmaId: number, cycleCount: number) {
    super(`Cannot delete plasma "${plasmaId}": ${cycleCount} active cycle(s) exist`)
    this.name = 'PlasmaHasActiveCyclesError'
  }
}

/**
 * Thrown when attempting to create a plasma for a unit that does not belong
 * to the current tenant.
 *
 * @param unitId - The unit ID that was not found in the tenant
 */
export class PlasmaNotInTenantUnitError extends Error {
  constructor(unitId: number) {
    super(`Unit "${unitId}" not found in your tenant`)
    this.name = 'PlasmaNotInTenantUnitError'
  }
}
