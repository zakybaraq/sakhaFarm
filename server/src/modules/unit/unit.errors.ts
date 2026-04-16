export class UnitNotFoundError extends Error {
  constructor(id: number) {
    super(`Unit "${id}" not found`)
    this.name = 'UnitNotFoundError'
  }
}

export class UnitHasActivePlasmasError extends Error {
  constructor(unitId: number, plasmaCount: number) {
    super(`Cannot delete unit "${unitId}": ${plasmaCount} active plasma(s) exist`)
    this.name = 'UnitHasActivePlasmasError'
  }
}

export class DuplicateUnitCodeError extends Error {
  constructor(code: string) {
    super(`Unit code "${code}" already exists`)
    this.name = 'DuplicateUnitCodeError'
  }
}
