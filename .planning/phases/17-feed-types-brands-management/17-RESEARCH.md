# Phase 17: Feed Types & Brands Management - Research

**Researched:** 2026-04-21
**Domain:** Full-stack CRUD — Drizzle ORM schema migration + Elysia.js backend modules + React/MUI frontend pages
**Confidence:** HIGH — all findings verified directly from project source code

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `feed_types` table: `id`, `tenantId`, `code` (varchar 20), `name` (varchar 100), `isActive` (int default 1), `deletedAt`, `createdAt`, `updatedAt`. Unique on (tenantId, code).
- **D-02:** `feed_brands` table: `id`, `tenantId`, `code` (varchar 20), `name` (varchar 100), `phone` (varchar 20, nullable), `isActive` (int default 1), `deletedAt`, `createdAt`, `updatedAt`. Unique on (tenantId, code).
- **D-03:** Migrate `feed_products`: drop `phase` varchar, add `typeId` int nullable FK → `feed_types.id`, add `brandId` int nullable FK → `feed_brands.id`.
- **D-04:** Migration seeds `feed_types` from distinct `phase` values, sets `typeId` on existing products, then drops `phase`. No data loss.
- **D-05:** New modules at `server/src/modules/feed-types/` and `server/src/modules/feed-brands/` following feature-based pattern (controller, service, schema, errors).
- **D-06:** Feed Types endpoints: GET list, POST create, PUT edit, PUT toggle, DELETE soft.
- **D-07:** Feed Brands endpoints: same pattern as Feed Types.
- **D-08:** Update `feed.controller.ts` / `feed.service.ts` to accept `typeId` and `brandId` replacing `phase`.
- **D-09:** New `FeedTypes.tsx` page — full CRUD, Units/Plasmas pattern.
- **D-10:** New `FeedBrands.tsx` page — full CRUD, name/code/phone fields.
- **D-11:** New `FeedProducts.tsx` management page — list products, create/edit with type (Autocomplete) and brand (Autocomplete).
- **D-12:** Update `SuratJalanModal.tsx` feed product dropdown to use updated `listFeedProducts` API.
- **D-13:** Full CRUD for both types and brands: create, edit, toggle active, soft delete.
- **D-14:** Delete guard: if feed_type or feed_brand is referenced by a feed_product → soft delete only; descriptive error on attempted hard delete of referenced record.

### Claude's Discretion

- Route/path naming for new pages (e.g., `/feed/types`, `/feed/brands`, `/feed/products`)
- Whether Feed Types, Feed Brands, Feed Products appear as sidebar sub-items under "Feed" or as top-level items
- Permission names for new entities (follow existing naming convention: `feed-types.create`, `feed-brands.read`, etc.)

### Deferred Ideas (OUT OF SCOPE)

- Supplier management (Phase 18)
- Sidebar reorganization into Master Data / Operations / Reports groups (Phase 20)
- Nutritional info (protein%, moisture%) as brand/type attributes
- Brand-to-type relationship constraint
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FEED-TYPE-01 | Feed Types management page: list, create, edit, toggle, delete feed types (Starter, Grower, Finisher) | DB schema D-01, backend D-05/D-06, frontend D-09 all verified from codebase patterns |
| FEED-BRAND-01 | Feed Brands management page: list, create, edit, toggle, delete feed brands (CP, Wonokoyo) with phone field | DB schema D-02, backend D-05/D-07, frontend D-10 all verified from codebase patterns |
</phase_requirements>

---

## Summary

Phase 17 adds master data management for feed product types and brands — two new MySQL tables with full CRUD REST APIs and corresponding React pages. The work also includes a schema migration that replaces the existing free-text `feed_products.phase` column with proper FK references to the new `feed_types` table, and adds a `brandId` FK to `feed_brands`.

The entire implementation follows a well-established pattern in this codebase: the Units module (`server/src/modules/unit/`, `client/src/pages/units/`) is the canonical template. Every layer — Drizzle schema, Elysia controller, service with transactions and audit logging, React page with `ResponsiveTable`, modal with `react-hook-form` + `zod`, TanStack Query mutations — is directly replicable.

The highest-risk task is the `feed_products` migration (D-03/D-04): it must seed `feed_types` from distinct `phase` values, back-fill `typeId`, then drop the `phase` column in a single coordinated operation. All downstream consumers that reference `phase` (feed controller body schemas, feed service insert/update, frontend `FeedProduct` interface, `SuratJalanModal`) must be updated in the same plan wave.

**Primary recommendation:** Implement in four sequential waves: (1) DB schemas + migration, (2) backend modules + feed.controller/service update, (3) frontend pages + routing, (4) SuratJalanModal + sidebar entries + API client cleanup.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Feed types catalog storage | Database | — | New `feed_types` table scoped to `tenantId` |
| Feed brands catalog storage | Database | — | New `feed_brands` table scoped to `tenantId` |
| `feed_products` schema migration | Database | — | One-time data migration seeding types from `phase` values |
| Feed types CRUD API | API / Backend | — | Elysia module, RBAC-gated, tenant-scoped |
| Feed brands CRUD API | API / Backend | — | Same pattern as feed types |
| Feed products update (typeId/brandId) | API / Backend | — | Extend existing feed.controller/service |
| Feed Types list page | Browser / Client | — | React page: ResponsiveTable + modal |
| Feed Brands list page | Browser / Client | — | React page: ResponsiveTable + modal |
| Feed Products management page | Browser / Client | — | React page: ResponsiveTable + modal with Autocomplete |
| Feed product dropdown in SuratJalan | Browser / Client | API / Backend | Reads updated listFeedProducts (now with typeId/brandId) |
| Sidebar navigation entries | Browser / Client | — | Minimal addition under "Feed" group; full reorganization is Phase 20 |

---

## Standard Stack

### Core (all verified from project source)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Drizzle ORM | (project-installed) | Schema definition + queries | Already used for all existing tables |
| Elysia.js | (project-installed) | HTTP controller + route registration | All existing modules use this |
| `drizzle-kit push` | (project-installed) | Apply schema changes to MySQL | Confirmed: `bunx drizzle-kit push` in drizzle.config.ts |
| React + MUI | (project-installed) | UI pages | All existing CRUD pages use MUI |
| TanStack Query | (project-installed) | Server state (queries + mutations) | All existing pages use useQuery/useMutation |
| react-hook-form + zod | (project-installed) | Form validation in modals | UnitModal pattern, confirmed in source |
| @tanstack/react-query | (project-installed) | queryClient.invalidateQueries after mutations | Confirmed pattern in Units.tsx |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| MUI Autocomplete | (bundled in @mui/material) | Type + brand dropdowns in FeedProducts modal | When selecting from a dynamic list; replaces static Select for catalog items |
| MUI Switch | (bundled) | isActive toggle in list pages | All master data list pages use this pattern |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Drizzle `push` for migration | Raw SQL ALTER TABLE | Push is faster; raw SQL needed if data migration logic is complex (D-04 requires seeding, so use raw SQL migration file OR a one-time seed script after push) |
| MUI Autocomplete for dropdowns | MUI Select | Autocomplete better for catalog items that may grow; Select fine for small fixed lists |

**Installation:** No new packages needed — all required libraries are already installed.

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (React)
     |
     | useQuery(['feed-types'])        useQuery(['feed-brands'])
     v                                  v
FeedTypes.tsx                      FeedBrands.tsx
  ResponsiveTable                    ResponsiveTable
  FeedTypesModal                     FeedBrandsModal
  (code, name, isActive toggle)      (code, name, phone, isActive toggle)
     |                                  |
     v                                  v
client/src/api/feed-types.ts       client/src/api/feed-brands.ts
  listFeedTypes()                    listFeedBrands()
  createFeedType()                   createFeedBrand()
  updateFeedType()                   updateFeedBrand()
  deleteFeedType()                   deleteFeedBrand()
     |                                  |
     v                                  v
GET /api/feed-types              GET /api/feed-brands
POST /api/feed-types             POST /api/feed-brands
PUT  /api/feed-types/:id         PUT  /api/feed-brands/:id
PUT  /api/feed-types/:id/toggle  PUT  /api/feed-brands/:id/toggle
DEL  /api/feed-types/:id         DEL  /api/feed-brands/:id
     |                                  |
     v                                  v
feedTypesController              feedBrandsController
feedTypesService                 feedBrandsService
     |                                  |
     +----------+   +------------------+
                |   |
                v   v
           MySQL DB
    feed_types      feed_brands
         |               |
         +-------+-------+
                 |
            feed_products
          (typeId FK, brandId FK)
                 |
                 v
      FeedProducts.tsx (new management page)
      SuratJalanModal.tsx (reads updated listFeedProducts)
```

### Recommended Project Structure

```
server/src/
├── db/schema/
│   ├── feed_types.ts          # New — mirrors units.ts pattern
│   ├── feed_brands.ts         # New — mirrors units.ts + phone field
│   ├── feed_products.ts       # Modified — add typeId, brandId; remove phase
│   └── index.ts               # Add exports for feed_types, feed_brands
├── modules/
│   ├── feed-types/
│   │   ├── feed-types.controller.ts
│   │   ├── feed-types.service.ts
│   │   ├── feed-types.errors.ts
│   │   └── feed-types.routes.ts   # re-exports controller
│   ├── feed-brands/
│   │   ├── feed-brands.controller.ts
│   │   ├── feed-brands.service.ts
│   │   ├── feed-brands.errors.ts
│   │   └── feed-brands.routes.ts
│   └── feed/
│       ├── feed.controller.ts  # Modified: typeId/brandId replaces phase
│       └── feed.service.ts     # Modified: typeId/brandId replaces phase
└── index.ts                   # Register feedTypesController, feedBrandsController

client/src/
├── api/
│   ├── feed-types.ts          # New API client
│   ├── feed-brands.ts         # New API client
│   └── feed.ts                # Modified: FeedProduct interface updated
├── pages/feed/
│   ├── FeedTypes.tsx           # New CRUD page
│   ├── FeedTypesModal.tsx      # New modal
│   ├── FeedBrands.tsx          # New CRUD page
│   ├── FeedBrandsModal.tsx     # New modal
│   ├── FeedProducts.tsx        # New management page
│   ├── FeedProductsModal.tsx   # New modal with Autocomplete
│   ├── FeedStock.tsx           # Unchanged
│   └── SuratJalanModal.tsx     # Modified: wire feedProductId dropdown
├── components/layout/
│   └── Sidebar.tsx            # Add 3 new menu entries under Feed
└── App.tsx                    # Add 3 new routes
```

### Pattern 1: Drizzle Schema (mirror units.ts)

**What:** Define table with `tenantId` FK, `code`/`name` varchar, `isActive` int, `deletedAt` timestamp.
**When to use:** All master data tables in this project.

```typescript
// Source: server/src/db/schema/units.ts (verified)
import { mysqlTable, varchar, int, timestamp, index, unique } from 'drizzle-orm/mysql-core'
import { tenants } from './tenants'

export const feedTypes = mysqlTable(
  'feed_types',
  {
    id: int('id').autoincrement().primaryKey(),
    tenantId: int('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 20 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    isActive: int('is_active').default(1),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    uqFeedTypesCode: unique('uq_feed_types_code').on(table.tenantId, table.code),
    idxFeedTypesTenant: index('idx_feed_types_tenant').on(table.tenantId),
  })
)
```

### Pattern 2: Elysia Controller (mirror unit.controller.ts)

**What:** Elysia route group with `prefix`, error handler, RBAC `requirePermission`, `getTenantId`.
**When to use:** Every new backend module.

```typescript
// Source: server/src/modules/unit/unit.controller.ts (verified)
export const feedTypesController = new Elysia({ prefix: '/api/feed-types' })
  .onError(({ error, set }) => { /* map custom errors to HTTP codes */ })
  .post('/', async (ctx) => { /* requirePermission('feed-types.create') */ })
  .get('/', async (ctx) => { /* requirePermission('feed-types.read') */ })
  .put('/:id', async (ctx) => { /* requirePermission('feed-types.update') */ })
  .put('/:id/toggle', async (ctx) => { /* requirePermission('feed-types.update') */ })
  .delete('/:id', async (ctx) => { /* requirePermission('feed-types.delete') */ })
```

### Pattern 3: React CRUD Page (mirror Units.tsx)

**What:** `useQuery` for list, `useMutation` for delete + toggle, `ResponsiveTable` with `ColumnDef`, modal open/close state, `Snackbar` feedback.
**When to use:** All master data list pages.

```typescript
// Source: client/src/pages/units/Units.tsx (verified)
const { data } = useQuery({ queryKey: ['feed-types'], queryFn: listFeedTypes, enabled: !!user })
const toggleMutation = useMutation({
  mutationFn: async (id: number) => {
    const item = data?.feedTypes.find(t => t.id === id)
    return updateFeedType(id, { isActive: item?.isActive ? 0 : 1 })
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed-types'] }),
})
```

### Pattern 4: React Modal (mirror UnitModal.tsx)

**What:** `react-hook-form` + `zodResolver`, `useEffect` to populate form when `selectedId` provided, `useMutation` for create/update, `queryClient.invalidateQueries` on success.
**When to use:** All create/edit modals.

```typescript
// Source: client/src/pages/units/UnitModal.tsx (verified)
const { control, handleSubmit, reset } = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { name: '', code: '' }
})
useEffect(() => {
  if (selectedId && data?.feedTypes) {
    const item = data.feedTypes.find(t => t.id === selectedId)
    if (item) reset({ name: item.name, code: item.code })
  } else { reset({ name: '', code: '' }) }
}, [selectedId, data, reset])
```

### Pattern 5: Service with Transactions + Audit Log

**What:** `db.transaction()` for all writes, check duplicate before insert, insert audit log in same transaction (fire-and-forget catch), re-fetch after insert to return full record.
**When to use:** All create/update/delete service functions.

```typescript
// Source: server/src/modules/unit/unit.service.ts (verified)
return db.transaction(async (tx) => {
  const existing = await tx.select().from(feedTypes)
    .where(and(eq(feedTypes.code, input.code), eq(feedTypes.tenantId, tenantId), isNull(feedTypes.deletedAt)))
  if (existing.length > 0) throw new DuplicateFeedTypeCodeError(input.code)
  const result = await tx.insert(feedTypes).values({ tenantId, ...input })
  try {
    await tx.insert(auditLogs).values({ userId, action: 'create', resource: 'feed_type', resourceId: String(result[0].insertId), newValue: JSON.stringify(input) })
  } catch { /* fire-and-forget */ }
  return (await tx.select().from(feedTypes).where(eq(feedTypes.id, result[0].insertId)).limit(1))[0]
})
```

### Pattern 6: Feed Products Schema Migration (D-03/D-04)

**What:** Two-step migration — first create `feed_types` + `feed_brands` tables, then alter `feed_products`.
**Critical:** The `phase` → `typeId` migration requires a data-seeding step before dropping the column.

Migration order within a single DB session:
1. `CREATE TABLE feed_types ...`
2. `CREATE TABLE feed_brands ...`
3. `INSERT INTO feed_types (tenant_id, code, name) SELECT DISTINCT tenant_id, phase, phase FROM feed_products WHERE phase IS NOT NULL`
4. `ALTER TABLE feed_products ADD COLUMN type_id INT NULL`
5. `UPDATE feed_products fp JOIN feed_types ft ON fp.tenant_id = ft.tenant_id AND fp.phase = ft.name SET fp.type_id = ft.id`
6. `ALTER TABLE feed_products ADD COLUMN brand_id INT NULL`
7. `ALTER TABLE feed_products DROP COLUMN phase`
8. `ALTER TABLE feed_products ADD CONSTRAINT fk_fp_type FOREIGN KEY (type_id) REFERENCES feed_types(id)`
9. `ALTER TABLE feed_products ADD CONSTRAINT fk_fp_brand FOREIGN KEY (brand_id) REFERENCES feed_brands(id)`

**Implementation approach:** Because `drizzle-kit push` does not support data migrations (only schema), the migration for step 3 and 5 (seed + backfill) must be a separate one-time seed script run after `drizzle-kit push` applies the schema. The Drizzle schema file for `feed_products.ts` should be updated with `typeId` and `brandId` columns (removing `phase`), and the seed script handles data migration.

### Anti-Patterns to Avoid

- **Using `phase` field in new code:** The `phase` varchar is being dropped — new service/controller code must never reference it.
- **Hard-coding feed product options in frontend:** `SuratJalanModal.tsx` currently has `<MenuItem value={1}>BR 10</MenuItem>` hardcoded — this must be replaced with dynamic `listFeedProducts()` query.
- **Missing `isNull(deletedAt)` in queries:** All list queries must filter soft-deleted records. Forgetting this shows deleted records.
- **Skip the toggle endpoint on controller:** The `isActive` toggle uses `PUT /:id` with `isActive` in body (same PUT for all updates). No separate toggle endpoint needed — same pattern as units.
- **Creating routes file differently:** All modules export from `*.routes.ts` which simply re-exports the controller. Follow exactly: `export { feedTypesController } from './feed-types.controller'`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Duplicate code detection | Custom SQL | Existing pattern: `select` before `insert`, throw `DuplicateXxxError` | All existing modules do this; consistent error handling |
| Audit trail | Custom logging | `db.insert(auditLogs).values(...)` in same transaction | Already wired; fire-and-forget pattern established |
| Tenant isolation | Manual tenant checks | `getTenantId(ctx)` plugin + `eq(table.tenantId, tenantId)` on all queries | Already enforced by middleware pattern |
| Form validation | Manual validate() | `zod` schema + `zodResolver` in react-hook-form | Established in UnitModal, PlasmaModal |
| Query cache invalidation | Manual state updates | `queryClient.invalidateQueries({ queryKey: [...] })` | TanStack Query handles re-fetch automatically |
| Soft delete | Set `isDeleted` flag | `db.update().set({ deletedAt: new Date() })` + `isNull(deletedAt)` filter | Consistent with all existing entities |

**Key insight:** This phase is almost entirely pattern replication. The only genuinely new logic is the `phase` → `typeId` data migration and the delete guard that checks FK references before soft-deleting a feed type or brand.

---

## Runtime State Inventory

> This section applies because Phase 17 includes a data migration (renaming/dropping the `phase` column in `feed_products`).

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | `feed_products.phase` varchar column in MySQL — production data may have values like "Starter", "BR-10", "Grower", etc. | Data migration: seed `feed_types` from distinct `phase` values, back-fill `typeId`, then drop `phase` |
| Live service config | None beyond MySQL — no external services store feed product phase values | None |
| OS-registered state | None | None |
| Secrets/env vars | None — `phase` is a data field, not a secret or env var | None |
| Build artifacts | `client/src/api/feed.ts` `FeedProduct` interface has `phase: string` — TypeScript will error after backend change | Code edit: replace `phase` with `typeId`, `brandId`, `typeName`, `brandName` in interface |

**After all files in the repo are updated:** The only remaining concern is existing MySQL data in `feed_products.phase`. The seed script handles this. If production DB has rows with `phase` values not in the seed list, `typeId` will remain NULL (acceptable since `typeId` is nullable per D-03).

---

## Common Pitfalls

### Pitfall 1: Missing `phase` references after migration
**What goes wrong:** After dropping `feed_products.phase`, TypeScript compilation fails on `feed.service.ts` (uses `phase` in insert/update), `feed.controller.ts` (body schema has `phase`), and `client/src/api/feed.ts` (`FeedProduct.phase` field).
**Why it happens:** The schema change is complete but upstream consumers are not updated atomically.
**How to avoid:** Update `feed.service.ts`, `feed.controller.ts`, and `client/src/api/feed.ts` in the same plan wave as the schema migration. Run `bun run build` / `tsc --noEmit` after each wave.
**Warning signs:** TypeScript errors mentioning `phase` on `feedProductsTable`.

### Pitfall 2: Hardcoded feed options in SuratJalanModal
**What goes wrong:** `SuratJalanModal.tsx` has three hardcoded `<MenuItem>` entries (`BR 10`, `BR 11`, `BSP`). After migration, product IDs may shift and new products won't appear.
**Why it happens:** Original implementation used static options as a placeholder.
**How to avoid:** Replace with `useQuery(['feed-products'], listFeedProducts)` and render `products.map(p => <MenuItem value={p.id}>{p.name}</MenuItem>)`. This is required by D-12.
**Warning signs:** Dropdown shows only 3 hardcoded options after phase is complete.

### Pitfall 3: Drizzle `push` doesn't run data migration
**What goes wrong:** `bunx drizzle-kit push` applies the schema (adds `typeId`/`brandId`, removes `phase`) but existing `feed_products` rows have NULL `typeId` and the old `phase` data is lost.
**Why it happens:** `drizzle-kit push` is schema-only — it does not run INSERT/UPDATE statements.
**How to avoid:** The plan must include a separate seed/migration script that runs BEFORE the `push` drops the `phase` column. Order matters: seed `feed_types` → backfill `typeId` → run `drizzle-kit push` (which drops `phase` and adds FKs).
**Warning signs:** After push, `feed_products` rows have `type_id = NULL` for records that previously had `phase` values.

### Pitfall 4: Delete guard not checking FK references
**What goes wrong:** Soft-deleting a `feed_type` that is referenced by active `feed_products` leaves orphaned references.
**Why it happens:** The `softDeleteUnit` pattern checks `plasmas` as a guard — the same pattern must be applied: check `feed_products WHERE type_id = $id AND deleted_at IS NULL` before soft-deleting a feed type.
**How to avoid:** Per D-14, the service must run a count query before soft-delete and throw a descriptive error if references exist.
**Warning signs:** Frontend shows "Tipe pakan dihapus" success but subsequent FeedProducts page shows broken type names.

### Pitfall 5: Route registration forgotten in index.ts
**What goes wrong:** New controllers are implemented but not registered in `server/src/index.ts`, so routes return 404.
**Why it happens:** Pattern requires explicit `.use(controller)` in `index.ts`.
**How to avoid:** Always include `index.ts` update as a task step. Verified pattern: `.use(feedTypesController).use(feedBrandsController)`.
**Warning signs:** GET /api/feed-types returns 404 in browser network tab.

### Pitfall 6: Missing React Router routes in App.tsx
**What goes wrong:** New pages are built but navigating to `/feed/types` returns NotFound.
**Why it happens:** `App.tsx` requires explicit `<Route path="..." element={<Component />} />` entries.
**How to avoid:** Add three routes in App.tsx: `/feed/types`, `/feed/brands`, `/feed/products`.
**Warning signs:** Sidebar link navigates to NotFound page.

---

## Code Examples

### Feed Types Schema (complete)
```typescript
// Source: verified from server/src/db/schema/units.ts pattern
import { mysqlTable, varchar, int, timestamp, index, unique } from 'drizzle-orm/mysql-core'
import { tenants } from './tenants'

export const feedTypes = mysqlTable(
  'feed_types',
  {
    id: int('id').autoincrement().primaryKey(),
    tenantId: int('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 20 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    isActive: int('is_active').default(1),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    uqFeedTypesCode: unique('uq_feed_types_code').on(table.tenantId, table.code),
    idxFeedTypesTenant: index('idx_feed_types_tenant').on(table.tenantId),
  })
)
export type FeedType = typeof feedTypes.$inferSelect
export type NewFeedType = typeof feedTypes.$inferInsert
```

### Feed Brands Schema (complete)
```typescript
// Source: verified from units.ts pattern + D-02 spec
export const feedBrands = mysqlTable(
  'feed_brands',
  {
    id: int('id').autoincrement().primaryKey(),
    tenantId: int('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 20 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 20 }),  // nullable
    isActive: int('is_active').default(1),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    uqFeedBrandsCode: unique('uq_feed_brands_code').on(table.tenantId, table.code),
    idxFeedBrandsTenant: index('idx_feed_brands_tenant').on(table.tenantId),
  })
)
```

### Updated feed_products.ts (drop phase, add FKs)
```typescript
// Source: verified from server/src/db/schema/feed_products.ts (current state)
// Changes: remove phase field, add typeId + brandId
import { feedTypes } from './feed_types'
import { feedBrands } from './feed_brands'

export const feedProducts = mysqlTable(
  'feed_products',
  {
    id: int('id').autoincrement().primaryKey(),
    tenantId: int('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 20 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    // phase: varchar removed (D-03)
    typeId: int('type_id').references(() => feedTypes.id),       // nullable FK
    brandId: int('brand_id').references(() => feedBrands.id),    // nullable FK
    proteinPercent: decimal('protein_percent', { precision: 5, scale: 2 }),
    defaultUnit: varchar('default_unit', { length: 10 }).default('zak'),
    zakKgConversion: decimal('zak_kg_conversion', { precision: 10, scale: 2 }).default('50'),
    isActive: int('is_active').default(1),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  ...
)
```

### Updated FeedProduct TypeScript interface
```typescript
// Source: verified from client/src/api/feed.ts (current state)
// Changes: remove phase, add typeId/brandId/typeName/brandName
export interface FeedProduct {
  id: number;
  tenantId: number;
  code: string;
  name: string;
  // phase: string removed
  typeId: number | null;
  brandId: number | null;
  typeName: string | null;   // joined from feed_types
  brandName: string | null;  // joined from feed_brands
  proteinPercent: string | null;
  defaultUnit: string | null;
  zakKgConversion: string | null;
  isActive: number | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Delete Guard Pattern (feed_type service)
```typescript
// Source: verified from server/src/modules/unit/unit.service.ts softDeleteUnit pattern
export async function softDeleteFeedType(id: number, tenantId: number, userId: string) {
  const existing = await db.select().from(feedTypes)
    .where(and(eq(feedTypes.id, id), eq(feedTypes.tenantId, tenantId), isNull(feedTypes.deletedAt)))
    .limit(1)
  if (existing.length === 0) throw new FeedTypeNotFoundError(id)

  // Delete guard: check if any feed products reference this type
  const productCount = await db.select({ count: count() }).from(feedProducts)
    .where(and(eq(feedProducts.typeId, id), isNull(feedProducts.deletedAt)))
  if (productCount[0].count > 0) throw new FeedTypeInUseError(id, productCount[0].count)

  await db.update(feedTypes).set({ deletedAt: new Date() })
    .where(and(eq(feedTypes.id, id), eq(feedTypes.tenantId, tenantId)))
  // audit log...
}
```

### listFeedProducts with JOINs (updated service)
```typescript
// Source: verified from feed.service.ts listFeedProducts pattern
// Update needed: JOIN feed_types + feed_brands to return typeName/brandName
export async function listFeedProducts(tenantId: number) {
  return db
    .select({
      id: feedProductsTable.id,
      tenantId: feedProductsTable.tenantId,
      code: feedProductsTable.code,
      name: feedProductsTable.name,
      typeId: feedProductsTable.typeId,
      brandId: feedProductsTable.brandId,
      typeName: feedTypes.name,
      brandName: feedBrands.name,
      zakKgConversion: feedProductsTable.zakKgConversion,
      isActive: feedProductsTable.isActive,
      createdAt: feedProductsTable.createdAt,
    })
    .from(feedProductsTable)
    .leftJoin(feedTypes, eq(feedProductsTable.typeId, feedTypes.id))
    .leftJoin(feedBrands, eq(feedProductsTable.brandId, feedBrands.id))
    .where(and(eq(feedProductsTable.tenantId, tenantId), isNull(feedProductsTable.deletedAt)))
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `feed_products.phase` varchar free text | `feed_types` table with FK | Phase 17 (this phase) | Enables consistent taxonomy, avoids typos, enables brand association |
| Hardcoded feed options in SuratJalanModal | Dynamic `listFeedProducts()` from DB | Phase 17 (this phase) | Dropdowns always reflect actual catalog |

**Deprecated after this phase:**
- `feed_products.phase` varchar column: dropped in migration; no new code should reference it
- Static `<MenuItem>` hardcodes in SuratJalanModal: replaced with dynamic query

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `drizzle-kit push` is the migration workflow (not `drizzle-kit generate` + manual SQL runner) | Architecture Patterns, Pitfall 3 | If project uses `generate` + SQL files instead of `push`, the migration plan needs a `.sql` file instead of a seed script | [ASSUMED — drizzle.config.ts confirmed `push` is configured but team may prefer `generate` for this migration] |
| A2 | Existing `feed_products.phase` values in production DB are derived from a known set (Starter/Grower/Finisher) | Runtime State Inventory | If `phase` has arbitrary free-text values, seeded `feed_types` codes/names may not match expectations | [ASSUMED — no prod DB query run; actual values unknown] |
| A3 | `typeName` and `brandName` should be returned as JOIN fields from `listFeedProducts` (not a separate call) | Code Examples | If frontend fetches types/brands separately and joins client-side, the service change is simpler | [ASSUMED — JOIN approach is standard practice; client-side join is an alternative] |

**If A1 is wrong:** Plan should include a `.sql` migration file in `server/drizzle/` instead of a seed script.
**If A2 is wrong:** Seed step should include a fallback (e.g., INSERT IGNORE or ON DUPLICATE KEY UPDATE) to handle unexpected phase values.

---

## Open Questions

1. **Migration execution method**
   - What we know: `drizzle-kit push` is configured; `drizzle-kit generate` output directory is `server/drizzle/` with one existing migration file
   - What's unclear: Should D-04 (seed + backfill) be a Bun script (`server/scripts/migrate-phase-to-type.ts`) or a raw SQL migration file?
   - Recommendation: Use a Bun seed script (`bunx tsx server/scripts/migrate-phase-to-type.ts`) run between the schema push and the column drop — this keeps data logic in TypeScript (consistent with project style) and is explicit in the plan

2. **Actual `feed_products.phase` values in production**
   - What we know: From CONTEXT.md specifics: expected values are Starter, Grower, Finisher
   - What's unclear: Are there other values in production? Running `SELECT DISTINCT phase FROM feed_products` would confirm
   - Recommendation: Plan should include a pre-migration step: log distinct phase values and confirm before proceeding

3. **Sidebar placement for 3 new pages**
   - What we know: Phase 20 handles full reorganization; D-09/D-10/D-11 require new pages to be reachable
   - What's unclear: Whether to add 3 separate top-level items or nest under a "Feed" submenu concept
   - Recommendation (Claude's discretion): Add three flat entries directly in `menuItems` after the existing "Feed" entry. Labels: "Tipe Pakan", "Merek Pakan", "Produk Pakan". Permissions: `feed-types.read`, `feed-brands.read`, `feed.read`. Paths: `/feed/types`, `/feed/brands`, `/feed/products`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| MySQL | D-01/D-02/D-03 schema migration | Assumed ✓ | Project-configured | — |
| Bun runtime | Backend server, migration scripts | ✓ | Configured in package.json | — |
| drizzle-kit | Schema push | ✓ | Confirmed in drizzle.config.ts | — |

Step 2.6: No new external dependencies — all required tools already in use by the project.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (client) |
| Config file | `client/vitest.config.ts` |
| Quick run command | `cd client && bun run test --run` |
| Full suite command | `cd client && bun run test --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FEED-TYPE-01 | FeedTypesModal renders with code/name fields | unit | `cd client && bun run test --run src/components/__tests__/FeedTypesModal.test.tsx` | ❌ Wave 0 |
| FEED-BRAND-01 | FeedBrandsModal renders with code/name/phone fields | unit | `cd client && bun run test --run src/components/__tests__/FeedBrandsModal.test.tsx` | ❌ Wave 0 |
| FEED-TYPE-01 | listFeedTypes API client returns array | unit | `cd client && bun run test --run src/api/feed-types.test.ts` | ❌ Wave 0 |
| FEED-BRAND-01 | listFeedBrands API client returns array | unit | `cd client && bun run test --run src/api/feed-brands.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd client && bun run test --run`
- **Per wave merge:** `cd client && bun run test --run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `client/src/components/__tests__/FeedTypesModal.test.tsx` — covers FEED-TYPE-01 modal render
- [ ] `client/src/components/__tests__/FeedBrandsModal.test.tsx` — covers FEED-BRAND-01 modal render
- [ ] `client/src/api/feed-types.test.ts` — covers API client functions (follow existing MSW handler pattern)
- [ ] `client/src/api/feed-brands.test.ts` — covers API client functions

*(Wave 0 tests follow the UnitModal.test.tsx + handlers.ts MSW pattern established in Phase 12)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Existing `requirePermission` + session plugin — same as all other modules |
| V3 Session Management | yes | Existing Redis-backed session — no new session logic |
| V4 Access Control | yes | RBAC permissions: `feed-types.create`, `feed-types.read`, `feed-types.update`, `feed-types.delete`, same for `feed-brands` |
| V5 Input Validation | yes | Elysia `t.Object()` body schemas + Zod in frontend modals |
| V6 Cryptography | no | No new secrets or sensitive data |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-tenant data access | Info Disclosure | `eq(table.tenantId, tenantId)` on ALL queries — established pattern, must be followed |
| Injection via code/name fields | Tampering | Parameterized queries via Drizzle ORM — no raw SQL interpolation |
| Unauthorized CRUD operations | Elevation of Privilege | `requirePermission('feed-types.create')` etc. on every route — same as units/plasmas |
| Mass assignment in update body | Tampering | Elysia `t.Object()` explicit field allowlist on PUT body schemas |

---

## Sources

### Primary (HIGH confidence — verified from project source files)
- `server/src/modules/unit/unit.controller.ts` — Elysia controller pattern
- `server/src/modules/unit/unit.service.ts` — service + transaction + audit log pattern
- `server/src/db/schema/units.ts` — Drizzle schema pattern for master data
- `client/src/pages/units/Units.tsx` — React CRUD page pattern
- `client/src/pages/units/UnitModal.tsx` — React modal with react-hook-form + zod
- `server/src/modules/feed/feed.controller.ts` — existing feed controller to update
- `server/src/modules/feed/feed.service.ts` — existing feed service to update
- `server/src/db/schema/feed_products.ts` — current schema with `phase` field
- `client/src/api/feed.ts` — FeedProduct interface to update
- `client/src/pages/feed/SuratJalanModal.tsx` — hardcoded items to replace
- `client/src/components/layout/Sidebar.tsx` — menuItems array to extend
- `client/src/App.tsx` — routes to extend
- `server/src/index.ts` — controller registration point
- `.planning/phases/17-feed-types-brands-management/17-CONTEXT.md` — locked decisions

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — tech stack verification
- `.planning/config.json` — Nyquist validation enabled (key absent = treat as enabled)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from existing project source files
- Architecture: HIGH — direct replication of existing Unit/Plasma patterns
- Pitfalls: HIGH — identified from actual current code state (hardcoded SuratJalan items, missing route registration pattern)
- Migration plan: MEDIUM — seeding approach is logical but actual production `phase` values unverified

**Research date:** 2026-04-21
**Valid until:** 2026-05-21 (stable codebase, no fast-moving dependencies)
