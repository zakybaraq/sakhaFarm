export class FeedTypeNotFoundError extends Error {
  constructor(id: number) {
    super(`Feed type "${id}" not found`)
    this.name = 'FeedTypeNotFoundError'
  }
}

export class DuplicateFeedTypeCodeError extends Error {
  constructor(code: string) {
    super(`Feed type code "${code}" already exists`)
    this.name = 'DuplicateFeedTypeCodeError'
  }
}

export class FeedTypeInUseError extends Error {
  constructor(feedTypeId: number, productCount: number) {
    super(`Cannot delete feed type "${feedTypeId}": ${productCount} feed product(s) reference it`)
    this.name = 'FeedTypeInUseError'
  }
}
