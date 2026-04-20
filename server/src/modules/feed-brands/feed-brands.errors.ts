export class FeedBrandNotFoundError extends Error {
  constructor(id: number) {
    super(`Feed brand "${id}" not found`)
    this.name = 'FeedBrandNotFoundError'
  }
}

export class DuplicateFeedBrandCodeError extends Error {
  constructor(code: string) {
    super(`Feed brand code "${code}" already exists`)
    this.name = 'DuplicateFeedBrandCodeError'
  }
}

export class FeedBrandInUseError extends Error {
  constructor(feedBrandId: number, productCount: number) {
    super(`Cannot delete feed brand "${feedBrandId}": ${productCount} feed product(s) reference it`)
    this.name = 'FeedBrandInUseError'
  }
}
