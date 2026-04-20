/**
 * Custom error classes for supplier operations.
 */

export class SupplierNotFoundError extends Error {
  constructor(id: number) {
    super(`Supplier with id ${id} not found`);
    this.name = "SupplierNotFoundError";
  }
}

export class SupplierCodeExistsError extends Error {
  constructor(code: string) {
    super(`Supplier with code '${code}' already exists`);
    this.name = "SupplierCodeExistsError";
  }
}

export class SupplierInUseError extends Error {
  constructor(name: string) {
    super(`Supplier '${name}' is in use and cannot be deleted`);
    this.name = "SupplierInUseError";
  }
}
