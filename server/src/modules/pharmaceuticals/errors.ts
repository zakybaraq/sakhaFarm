export class PharmaceuticalNotFoundError extends Error {
  constructor(id: number) {
    super(`Pharmaceutical item ${id} not found`);
    this.name = "PharmaceuticalNotFoundError";
  }
}

export class DuplicatePharmaceuticalCodeError extends Error {
  constructor(code: string) {
    super(`Code ${code} already exists`);
    this.name = "DuplicatePharmaceuticalCodeError";
  }
}

export class PharmaceuticalInUseError extends Error {
  constructor(id: number, reference: string) {
    super(`Cannot delete: item ${id} is in use by ${reference}`);
    this.name = "PharmaceuticalInUseError";
  }
}

export class BatchNotFoundError extends Error {
  constructor(id: number) {
    super(`Batch ${id} not found`);
    this.name = "BatchNotFoundError";
  }
}

export class InsufficientStockError extends Error {
  constructor(itemId: number, available: number, requested: number) {
    super(`Insufficient stock for item ${itemId}: have ${available}, need ${requested}`);
    this.name = "InsufficientStockError";
  }
}