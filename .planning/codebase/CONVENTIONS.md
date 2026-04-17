# Coding Conventions

**Analysis Date:** 2026-04-17

## Naming Patterns

### Files
- **Modules/Domains:** kebab-case with dots (e.g., `cycle.service.ts`, `cycle.controller.ts`, `cycle.errors.ts`)
- **Configuration:** kebab-case (e.g., `vitest.config.ts`, `drizzle.config.ts`)
- **Schema:** kebab-case (e.g., `cycles.ts`, `feed_products.ts`)

### Functions
- **Naming:** camelCase for all functions (e.g., `createCycle`, `listCycles`, `getCycle`)
- **Async Functions:** Always use `async`/`await` pattern, no callback-style
- **Export Pattern:** Named exports for services, controllers

### Variables
- **Naming:** camelCase (e.g., `tenantId`, `userId`, `currentTenantId`)
- **Constants:** PascalCase for TypeScript types (e.g., `VALID_DOC_TYPES`), uppercase for runtime constants

### Types
- **Naming:** PascalCase (e.g., `Cycle`, `Plasma`, `User`)
- **Schema Exports:** Export both inferred types: `export type Cycle = typeof cycles.$inferSelect`
- **Input Types:** Use inline object types for function parameters

## Code Style

### Formatting
- **Tool:** Not explicitly configured (no Prettier/ESLint found in project)
- **Indentation:** 2 spaces
- **Line Endings:** Unix-style (LF)

### Linting
- **Tool:** Not configured - no ESLint config found

### Import Organization
1. **First party/Internal imports** (relative paths)
   ```typescript
   import { db } from '../../config/database'
   import { cycles, plasmas } from '../../db/schema'
   import { eq, and } from 'drizzle-orm'
   ```
2. **Third party/External imports**
   ```typescript
   import { Elysia, t } from 'elysia'
   ```
3. **Type imports** (if using `type` keyword)

### Path Aliases
- **Client:** `@/*` alias configured in `client/vite.config.ts` pointing to `./src`

## Error Handling Patterns

### Custom Error Classes
Each module defines its own error classes in a dedicated `.errors.ts` file. Pattern:

```typescript
export class CycleNotFoundError extends Error {
  constructor(id: number) {
    super(`Cycle "${id}" not found`)
    this.name = 'CycleNotFoundError'
  }
}
```

**Conventions:**
- Extend `Error` class
- Include descriptive constructor parameters
- Set `this.name` to match class name for runtime identification

### Error Files by Module
- `server/src/modules/cycle/cycle.errors.ts` - 5 error classes
- `server/src/modules/plasma/plasma.errors.ts` - 3 error classes
- `server/src/modules/users/users.errors.ts` - 4 error classes
- `server/src/modules/unit/unit.errors.ts`
- `server/src/modules/rbac/rbac.errors.ts`

### Controller Error Handling
Controllers use Elysia's `.onError` hook to map error classes to HTTP responses:

```typescript
export const cycleController = new Elysia({ prefix: '/api/cycles' })
  .onError(({ error }) => {
    if (error instanceof CycleNotFoundError) {
      return { error: error.message, code: 'CYCLE_NOT_FOUND' }
    }
    // ... other mappings
  })
```

### Error Codes
Each error maps to a snake_case error code:
- `CycleNotFoundError` → `'CYCLE_NOT_FOUND'`
- `CycleCapacityExceededError` → `'CYCLE_CAPACITY_EXCEEDED'`
- `InvalidCycleStatusTransitionError` → `'INVALID_STATUS_TRANSITION'`

## Plugin Structure Conventions

### Plugin Files
- Located in `server/src/plugins/`
- Each plugin wraps an Elysia instance:
  ```typescript
  export const tenantPlugin = new Elysia({ name: 'tenant-plugin' })
    .derive({ as: 'global' }, async (ctx) => { ... })
  ```

### Plugin Pattern
- **Registration:** Plugins are imported and registered in `server/src/index.ts`
- **Naming:** `{feature}Plugin` pattern (e.g., `tenantPlugin`, `rbacPlugin`)

### Key Plugins
- `server/src/plugins/tenant.ts` - Tenant isolation via header derivation
- `server/src/plugins/rbac.ts` - Permission-based route protection
- `server/src/plugins/session.ts` - Session management
- `server/src/plugins/security-headers.ts` - HTTP security headers
- `server/src/plugins/rate-limit.ts` - API rate limiting

## Service Layer Patterns

### Service File Structure
Each domain has a service file with CRUD and business logic functions:

```typescript
// server/src/modules/cycle/cycle.service.ts
export async function createCycle(input, tenantId, userId) { ... }
export async function listCycles(tenantId, plasmaId?, status?) { ... }
export async function getCycle(id, tenantId) { ... }
export async function updateCycle(id, input, tenantId, userId) { ... }
export async function softDeleteCycle(id, tenantId, userId) { ... }
export async function completeCycle(id, input, tenantId, userId) { ... }
export async function failCycle(id, input, tenantId, userId) { ... }
```

### Function Parameters
- **Tenant Isolation:** All service functions accept `tenantId: number` as second parameter
- **Audit Trail:** Functions requiring user tracking accept `userId: string`
- **Input Objects:** Use object destructuring for optional fields

### Database Access
- Database instance imported from `server/src/config/database`
- Use Drizzle ORM chain methods: `select()`, `insert()`, `update()`
- Always filter by `tenantId` for multi-tenant isolation

### Audit Logging
Fire-and-forget pattern:
```typescript
try {
  await db.insert(auditLogs).values({ ... })
} catch {
  // Fire-and-forget - no action needed
}
```

## Controller/Routes Patterns

### Controller File
- Located in `server/src/modules/{domain}/{domain}.controller.ts`
- Uses Elysia's decorator pattern:

```typescript
export const cycleController = new Elysia({ prefix: '/api/cycles' })
  .post('/', async ({ body, store, cookie, headers, tenantId }) => { ... })
  .get('/', async ({ query, store, headers, tenantId }) => { ... })
  // ...
```

### Routes File
- Simple re-export: `export { cycleController } from './cycle.controller'`
- All routes are centralized in `server/src/index.ts`

### Request Validation
Use Elysia's `t` (typed) for body/query/param validation:
```typescript
body: t.Object({
  plasmaId: t.Number(),
  docType: t.String({ minLength: 1, maxLength: 50 }),
  chickInDate: t.String(),
  initialPopulation: t.Number({ minimum: 1 }),
})
```

### Permission Guards
Controllers use RBAC middleware via `beforeHandle`:
```typescript
{
  beforeHandle: requirePermission('cycle.create'),
}
```

### Tenant ID Resolution
Controllers derive tenant ID from multiple sources:
```typescript
function getTenantId(store: Record<string, unknown>, headers: Record<string, string>, deriveTenantId?: number | null): number {
  const storeTenantId = (store as Record<string, unknown>).tenantId as number | undefined
  const headerTenantId = parseInt(headers['x-tenant-id'] || '0', 10)
  return storeTenantId ?? deriveTenantId ?? headerTenantId
}
```

## Database Schema Patterns (Drizzle)

### Table Definition
Located in `server/src/db/schema/{table}.ts`:

```typescript
// server/src/db/schema/cycles.ts
export const cycles = mysqlTable(
  'cycles',
  {
    id: int('id').autoincrement().primaryKey(),
    plasmaId: int('plasma_id').notNull().references(() => plasmas.id, { onDelete: 'cascade' }),
    cycleNumber: int('cycle_number').notNull(),
    // ...
  },
  (table) => ({
    idxCyclesPlasma: index('idx_cycles_plasma').on(table.plasmaId),
  })
)

export type Cycle = typeof cycles.$inferSelect
export type NewCycle = typeof cycles.$inferInsert
```

### Index Patterns
Define indexes as function return value in table definition

### Schema Barrel File
`server/src/db/schema/index.ts` exports all schemas and types:
```typescript
export { cycles } from './cycles'
export type { Cycle, NewCycle } from './cycles'
```

### Multi-Tenancy
- Tenant ID stored in related tables (e.g., `units.tenantId`)
- Queries use JOINs to enforce tenant isolation
- Soft delete via `deletedAt` timestamp column

## Module Organization

### Directory Structure per Feature
```
server/src/modules/cycle/
├── cycle.controller.ts   # Elysia route handlers
├── cycle.routes.ts      # Re-exports controller
├── cycle.service.ts    # Business logic
├── cycle.errors.ts      # Custom error classes
```

### Cross-Module Dependencies
- Services import from other modules when needed (e.g., `getCycleSummary` from recordings)
- Controllers import services and error classes

---

*Convention analysis: 2026-04-17*