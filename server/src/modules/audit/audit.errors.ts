export class AuditLogNotFoundError extends Error {
  constructor(id: number) {
    super(`Audit log entry ${id} not found`)
    this.name = 'AuditLogNotFoundError'
  }
}

export class AuditQueryTooBroadError extends Error {
  constructor() {
    super('Query too broad: specify at least one filter (userId, action, resource, or date range)')
    this.name = 'AuditQueryTooBroadError'
  }
}
