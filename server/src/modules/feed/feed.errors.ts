export class FeedProductNotFoundError extends Error {
  constructor(id: number) {
    super(`Feed product "${id}" not found`)
    this.name = 'FeedProductNotFoundError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class FeedStockNotFoundError extends Error {
  constructor(plasmaId: number, feedProductId: number) {
    super(`Feed stock not found for plasma "${plasmaId}" and product "${feedProductId}"`)
    this.name = 'FeedStockNotFoundError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class DuplicateFeedCodeError extends Error {
  constructor(code: string) {
    super(`Feed product code "${code}" already exists`)
    this.name = 'DuplicateFeedCodeError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class NegativeStockError extends Error {
  constructor(current: string, requested: string) {
    super(`Insufficient stock: current="${current}kg", requested="${requested}kg"`)
    this.name = 'NegativeStockError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class InvalidSuratJalanError extends Error {
  constructor(number: string) {
    super(`Surat Jalan number "${number}" already exists`)
    this.name = 'InvalidSuratJalanError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class PlasmaNotInTenantError extends Error {
  constructor(plasmaId: number) {
    super(`Plasma "${plasmaId}" does not belong to your tenant`)
    this.name = 'PlasmaNotInTenantError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}