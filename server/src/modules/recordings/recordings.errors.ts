/**
 * Recording Management-specific error classes.
 *
 * These errors are thrown when recording operations fail due to
 * business rule violations, such as future dates or inactive cycles.
 */

/**
 * Thrown when attempting to retrieve, update, or delete a recording that
 * does not exist or has been soft-deleted.
 *
 * @param id - The recording ID that was not found
 */
export class RecordingNotFoundError extends Error {
  constructor(id: number) {
    super(`Recording "${id}" not found`)
    this.name = 'RecordingNotFoundError'
  }
}

/**
 * Thrown when attempting to create or update a recording for a cycle
 * that is not in 'active' status.
 *
 * @param cycleId - The cycle ID that is not active
 * @param status - The current cycle status
 */
export class CycleNotActiveError extends Error {
  constructor(cycleId: number, status: string) {
    super(`Cycle "${cycleId}" is not active (status: "${status}")`)
    this.name = 'CycleNotActiveError'
  }
}

/**
 * Thrown when attempting to create a recording with a date in the future.
 *
 * @param recordingDate - The recording date that is in the future
 */
export class FutureDateError extends Error {
  constructor(recordingDate: string) {
    super(`Recording date "${recordingDate}" cannot be in the future`)
    this.name = 'FutureDateError'
  }
}

/**
 * Thrown when attempting to create a recording for a date that
 * already has a recording entry for the same cycle.
 *
 * @param cycleId - The cycle ID
 * @param recordingDate - The duplicate recording date
 */
export class DuplicateRecordingDateError extends Error {
  constructor(cycleId: number, recordingDate: string) {
    super(`Recording for cycle "${cycleId}" on date "${recordingDate}" already exists`)
    this.name = 'DuplicateRecordingDateError'
  }
}

export class CycleNotFoundError extends Error {
  constructor(cycleId: number) {
    super(`Cycle "${cycleId}" not found`)
    this.name = 'CycleNotFoundError'
  }
}