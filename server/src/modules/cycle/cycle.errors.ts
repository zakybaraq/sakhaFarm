/**
 * Cycle Management-specific error classes.
 *
 * These errors are thrown when cycle operations fail due to
 * business rule violations, such as capacity exceeded or invalid status transitions.
 */

/**
 * Thrown when attempting to retrieve, update, or delete a cycle that
 * does not exist or has been soft-deleted.
 *
 * @param id - The cycle ID that was not found
 */
export class CycleNotFoundError extends Error {
  constructor(id: number) {
    super(`Cycle "${id}" not found`)
    this.name = 'CycleNotFoundError'
  }
}

/**
 * Thrown when attempting to create a cycle with initial population
 * exceeding the plasma's capacity.
 *
 * @param initialPopulation - The requested initial population
 * @param capacity - The plasma's maximum capacity
 */
export class CycleCapacityExceededError extends Error {
  constructor(initialPopulation: number, capacity: number) {
    super(`Initial population (${initialPopulation}) exceeds plasma capacity (${capacity})`)
    this.name = 'CycleCapacityExceededError'
  }
}

/**
 * Thrown when attempting an invalid status transition on a cycle,
 * such as transitioning from completed or failed back to active.
 *
 * @param from - The current status
 * @param to - The requested target status
 */
export class InvalidCycleStatusTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot transition cycle from "${from}" to "${to}"`)
    this.name = 'InvalidCycleStatusTransitionError'
  }
}

/**
 * Thrown when attempting to create a cycle for a plasma that
 * does not belong to the current tenant.
 *
 * @param plasmaId - The plasma ID that is not in the tenant
 */
export class CycleNotInTenantPlasmaError extends Error {
  constructor(plasmaId: number) {
    super(`Plasma "${plasmaId}" not found in your tenant`)
    this.name = 'CycleNotInTenantPlasmaError'
  }
}

/**
 * Thrown when attempting to soft-delete a cycle that has
 * associated daily recordings.
 *
 * @param cycleId - The cycle ID being deleted
 * @param recordingCount - The number of existing daily recordings
 */
export class CycleHasRecordingsError extends Error {
  constructor(cycleId: number, recordingCount: number) {
    super(`Cannot delete cycle "${cycleId}": ${recordingCount} daily recording(s) exist`)
    this.name = 'CycleHasRecordingsError'
  }
}
