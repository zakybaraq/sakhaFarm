# Phase 17: Feed Types & Brands Management - Pattern Map

**Mapped:** 2026-04-21
**Files analyzed:** 20 (new/modified)
**Analogs found:** 20 / 20

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `server/src/db/schema/feed_types.ts` | model | CRUD | `server/src/db/schema/units.ts` | exact |
| `server/src/db/schema/feed_brands.ts` | model | CRUD | `server/src/db/schema/units.ts` | exact |
| `server/src/db/schema/feed_products.ts` | model | CRUD | `server/src/db/schema/feed_products.ts` (modify) | self |
| `server/src/db/schema/index.ts` | config | — | `server/src/db/schema/index.ts` (modify) | self |
| `server/src/modules/feed-types/feed-types.errors.ts` | utility | — | `server/src/modules/unit/unit.errors.ts` | exact |
| `server/src/modules/feed-types/feed-types.service.ts` | service | CRUD | `server/src/modules/unit/unit.service.ts` | exact |
| `server/src/modules/feed-types/feed-types.controller.ts` | controller | request-response | `server/src/modules/unit/unit.controller.ts` | exact |
| `server/src/modules/feed-types/feed-types.routes.ts` | route | — | `server/src/modules/unit/unit.routes.ts` | exact |
| `server/src/modules/feed-brands/feed-brands.errors.ts` | utility | — | `server/src/modules/unit/unit.errors.ts` | exact |
| `server/src/modules/feed-brands/feed-brands.service.ts` | service | CRUD | `server/src/modules/unit/unit.service.ts` | exact |
| `server/src/modules/feed-brands/feed-brands.controller.ts` | controller | request-response | `server/src/modules/unit/unit.controller.ts` | exact |
| `server/src/modules/feed-brands/feed-brands.routes.ts` | route | — | `server/src/modules/unit/unit.routes.ts` | exact |
| `server/src/modules/feed/feed.controller.ts` | controller | request-response | `server/src/modules/feed/feed.controller.ts` (modify) | self |
| `server/src/modules/feed/feed.service.ts` | service | CRUD | `server/src/modules/feed/feed.service.ts` (modify) | self |
| `server/src/index.ts` | config | — | `server/src/index.ts` (modify) | self |
| `client/src/api/feed-types.ts` | utility | request-response | `client/src/api/units.ts` | exact |
| `client/src/api/feed-brands.ts` | utility | request-response | `client/src/api/units.ts` | exact |
| `client/src/api/feed.ts` | utility | request-response | `client/src/api/feed.ts` (modify) | self |
| `client/src/pages/feed/FeedTypes.tsx` | component | CRUD | `client/src/pages/units/Units.tsx` | exact |
| `client/src/pages/feed/FeedTypesModal.tsx` | component | request-response | `client/src/pages/units/UnitModal.tsx` | exact |
| `client/src/pages/feed/FeedBrands.tsx` | component | CRUD | `client/src/pages/units/Units.tsx` | exact |
| `client/src/pages/feed/FeedBrandsModal.tsx` | component | request-response | `client/src/pages/units/UnitModal.tsx` | exact |
| `client/src/pages/feed/FeedProducts.tsx` | component | CRUD | `client/src/pages/units/Units.tsx` | role-match |
| `client/src/pages/feed/FeedProductsModal.tsx` | component | request-response | `client/src/pages/units/UnitModal.tsx` | role-match |
| `client/src/pages/feed/SuratJalanModal.tsx` | component | request-response | `client/src/pages/feed/SuratJalanModal.tsx` (modify) | self |
| `client/src/components/layout/Sidebar.tsx` | component | — | `client/src/components/layout/Sidebar.tsx` (modify) | self |
| `client/src/App.tsx` | config | — | `client/src/App.tsx` (modify) | self |
| `client/src/components/__tests__/FeedTypesModal.test.tsx` | test | — | `client/src/components/__tests__/UnitModal.test.tsx` | exact |
| `client/src/components/__tests__/FeedBrandsModal.test.tsx` | test | — | `client/src/components/__tests__/UnitModal.test.tsx` | exact |

---

## Pattern Assignments

### `server/src/db/schema/feed_types.ts` (model, CRUD)

**Analog:** `server/src/db/schema/units.ts`

**Full schema pattern** (lines 1-34):
```typescript
import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/mysql-core'
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

**Key difference from units.ts:** units.ts uses only `index()` (no `unique()`). Feed types needs `unique()` on `(tenantId, code)` per D-01. Add both `unique` and `index` imports.

---

### `server/src/db/schema/feed_brands.ts` (model, CRUD)

**Analog:** `server/src/db/schema/units.ts`

**Same as feed_types schema above, with two additions:**
- `phone: varchar('phone', { length: 20 })` — nullable, no `.notNull()`
- Unique constraint name: `'uq_feed_brands_code'`, index name: `'idx_feed_brands_tenant'`
- Type exports: `FeedBrand`, `NewFeedBrand`

---

### `server/src/db/schema/feed_products.ts` (model, CRUD — modify)

**Current file:** `server/src/db/schema/feed_products.ts` lines 1-41

**Changes required:**
1. Add imports for `feedTypes` and `feedBrands` tables
2. Remove `phase: varchar('phase', { length: 20 }).notNull()` (line 24)
3. Remove `idxFeedPhase: index('idx_feed_phase').on(table.phase)` (line 36)
4. Add after `name` field:
```typescript
typeId: int('type_id').references(() => feedTypes.id),   // nullable FK
brandId: int('brand_id').references(() => feedBrands.id), // nullable FK
```

**CRITICAL migration order:** Do NOT run `drizzle-kit push` to drop `phase` until after the seed script has back-filled `typeId` from existing `phase` values.

---

### `server/src/db/schema/index.ts` (config — modify)

**Analog:** `server/src/db/schema/index.ts` lines 1-47

**Append after the `feedProducts` export block:**
```typescript
export { feedTypes } from './feed_types'
export type { FeedType, NewFeedType } from './feed_types'

export { feedBrands } from './feed_brands'
export type { FeedBrand, NewFeedBrand } from './feed_brands'
```

---

### `server/src/modules/feed-types/feed-types.errors.ts` (utility)

**Analog:** `server/src/modules/unit/unit.errors.ts` (lines 1-20)

```typescript
export class FeedTypeNotFoundError extends Error {
  constructor(id: number) {
    super(`Feed type "${id}" not found`)
    this.name = 'FeedTypeNotFoundError'
  }
}

export class FeedTypeInUseError extends Error {
  constructor(typeId: number, productCount: number) {
    super(`Cannot delete feed type "${typeId}": ${productCount} active feed product(s) reference it`)
    this.name = 'FeedTypeInUseError'
  }
}

export class DuplicateFeedTypeCodeError extends Error {
  constructor(code: string) {
    super(`Feed type code "${code}" already exists`)
    this.name = 'DuplicateFeedTypeCodeError'
  }
}
```

---

### `server/src/modules/feed-types/feed-types.service.ts` (service, CRUD)

**Analog:** `server/src/modules/unit/unit.service.ts` (lines 1-226)

**Imports pattern** (mirror unit.service.ts lines 1-8):
```typescript
import { db } from '../../config/database'
import { feedTypes, feedProducts, auditLogs } from '../../db/schema'
import { eq, and, isNull, desc, ne, count } from 'drizzle-orm'
import {
  FeedTypeNotFoundError,
  FeedTypeInUseError,
  DuplicateFeedTypeCodeError,
} from './feed-types.errors'
```

**Create pattern** (copy unit.service.ts lines 19-64, swap `units` → `feedTypes`, remove `location`):
```typescript
export async function createFeedType(
  input: { name: string; code: string },
  tenantId: number,
  userId: string,
) {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(feedTypes)
      .where(and(eq(feedTypes.code, input.code), eq(feedTypes.tenantId, tenantId), isNull(feedTypes.deletedAt)))

    if (existing.length > 0) {
      throw new DuplicateFeedTypeCodeError(input.code)
    }

    const result = await tx.insert(feedTypes).values({ name: input.name, code: input.code, tenantId })
    const newId = result[0].insertId

    try {
      await tx.insert(auditLogs).values({
        userId, action: 'create', resource: 'feed_type',
        resourceId: String(newId), newValue: JSON.stringify(input),
      })
    } catch { /* fire-and-forget */ }

    const created = await tx.select().from(feedTypes).where(eq(feedTypes.id, newId)).limit(1)
    return created[0]
  })
}
```

**List pattern** (mirror unit.service.ts lines 72-78):
```typescript
export async function listFeedTypes(tenantId: number) {
  return db
    .select()
    .from(feedTypes)
    .where(and(eq(feedTypes.tenantId, tenantId), isNull(feedTypes.deletedAt)))
    .orderBy(desc(feedTypes.createdAt))
}
```

**Update pattern** (mirror unit.service.ts lines 113-177 — includes duplicate code check):
- Checks existence first: throw `FeedTypeNotFoundError`
- If `input.code` provided: check for duplicate with `ne(feedTypes.id, id)`
- Build `updateData` object selectively
- Includes `isActive` toggle: `updateData.isActive = input.isActive ? 1 : 0`
- Fire-and-forget audit log

**Soft delete pattern with FK guard** (mirror unit.service.ts lines 189-226, adapted for D-14):
```typescript
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

  try {
    await db.insert(auditLogs).values({ userId, action: 'delete', resource: 'feed_type', resourceId: String(id) })
  } catch { /* fire-and-forget */ }

  return { success: true }
}
```

---

### `server/src/modules/feed-types/feed-types.controller.ts` (controller, request-response)

**Analog:** `server/src/modules/unit/unit.controller.ts` (lines 1-129)

**Imports pattern** (lines 1-16):
```typescript
import { Elysia, t } from 'elysia'
import { requirePermission } from '../../plugins/rbac'
import { getTenantId } from '../../plugins/tenant'
import {
  createFeedType, listFeedTypes, getFeedType, updateFeedType, softDeleteFeedType,
} from './feed-types.service'
import {
  FeedTypeNotFoundError, FeedTypeInUseError, DuplicateFeedTypeCodeError,
} from './feed-types.errors'
```

**Controller + error handler pattern** (lines 17-38, adapt from unit.controller.ts):
```typescript
export const feedTypesController = new Elysia({ prefix: '/api/feed-types' })
  .onError(({ error, set }) => {
    if (error instanceof FeedTypeNotFoundError) {
      set.status = 404
      return { error: error.message, code: 'FEED_TYPE_NOT_FOUND' }
    }
    if (error instanceof FeedTypeInUseError) {
      set.status = 409
      return { error: error.message, code: 'FEED_TYPE_IN_USE' }
    }
    if (error instanceof DuplicateFeedTypeCodeError) {
      set.status = 409
      return { error: error.message, code: 'DUPLICATE_FEED_TYPE_CODE' }
    }
    if (error instanceof Error && error.message === 'MISSING_TENANT_ID') {
      set.status = 401
      return { error: 'Tenant ID is required', code: 'MISSING_TENANT_ID' }
    }
    if (error instanceof Error && error.message === 'MISSING_USER_ID') {
      set.status = 401
      return { error: 'Authentication required', code: 'MISSING_USER_ID' }
    }
  })
```

**POST route body schema** (mirror unit.controller.ts lines 40-60, no `location`):
```typescript
body: t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  code: t.String({ minLength: 1, maxLength: 20 }),
}),
```

**PUT route body schema** (mirror unit.controller.ts lines 86-110):
```typescript
body: t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  code: t.Optional(t.String({ minLength: 1, maxLength: 20 })),
  isActive: t.Optional(t.Number()),
}),
```

**Permission names:** `feed-types.create`, `feed-types.read`, `feed-types.update`, `feed-types.delete` (follow existing `unit.create` convention with hyphenated resource name).

**No separate toggle endpoint** — `isActive` is handled by the same `PUT /:id` route via the `isActive` field in body. Same as units pattern.

---

### `server/src/modules/feed-types/feed-types.routes.ts` (route)

**Analog:** `server/src/modules/unit/unit.routes.ts` (line 1):
```typescript
export { feedTypesController } from './feed-types.controller'
```

---

### `server/src/modules/feed-brands/feed-brands.errors.ts` (utility)

**Analog:** `server/src/modules/unit/unit.errors.ts`

Same structure as `feed-types.errors.ts` above. Error class names:
- `FeedBrandNotFoundError`
- `FeedBrandInUseError` (references `feed_products.brand_id`)
- `DuplicateFeedBrandCodeError`

---

### `server/src/modules/feed-brands/feed-brands.service.ts` (service, CRUD)

**Analog:** `server/src/modules/unit/unit.service.ts`

Identical pattern to `feed-types.service.ts` above with these differences:
- Table: `feedBrands` instead of `feedTypes`
- Input type: `{ name: string; code: string; phone?: string }` — add optional `phone` to create/update
- Delete guard checks `feedProducts.brandId` instead of `feedProducts.typeId`
- Error classes: `FeedBrandNotFoundError`, `FeedBrandInUseError`, `DuplicateFeedBrandCodeError`
- Audit resource string: `'feed_brand'`

**Update body includes phone:**
```typescript
const updateData: any = {}
if (input.name !== undefined) updateData.name = input.name
if (input.code !== undefined) updateData.code = input.code
if (input.phone !== undefined) updateData.phone = input.phone
if (input.isActive !== undefined) updateData.isActive = input.isActive ? 1 : 0
```

---

### `server/src/modules/feed-brands/feed-brands.controller.ts` (controller, request-response)

**Analog:** `server/src/modules/unit/unit.controller.ts`

Same as `feed-types.controller.ts` above. POST body schema adds optional `phone`:
```typescript
body: t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  code: t.String({ minLength: 1, maxLength: 20 }),
  phone: t.Optional(t.String({ maxLength: 20 })),
}),
```

PUT body schema:
```typescript
body: t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  code: t.Optional(t.String({ minLength: 1, maxLength: 20 })),
  phone: t.Optional(t.String({ maxLength: 20 })),
  isActive: t.Optional(t.Number()),
}),
```

Permission names: `feed-brands.create`, `feed-brands.read`, `feed-brands.update`, `feed-brands.delete`.

---

### `server/src/modules/feed-brands/feed-brands.routes.ts` (route)

**Analog:** `server/src/modules/unit/unit.routes.ts`:
```typescript
export { feedBrandsController } from './feed-brands.controller'
```

---

### `server/src/modules/feed/feed.controller.ts` (controller — modify)

**Current file:** `server/src/modules/feed/feed.controller.ts` lines 59-133

**Changes to POST `/products` body** (line 73-82): remove `phase`, add `typeId`/`brandId`:
```typescript
body: t.Object({
  code: t.String({ minLength: 1, maxLength: 20 }),
  name: t.String({ minLength: 1, maxLength: 100 }),
  typeId: t.Optional(t.Number({ minimum: 1 })),   // replaces phase
  brandId: t.Optional(t.Number({ minimum: 1 })),
  proteinPercent: t.Optional(t.Number({ minimum: 0 })),
  defaultUnit: t.Optional(t.String({ maxLength: 10 })),
  zakKgConversion: t.Optional(t.Number({ minimum: 0 })),
}),
```

**Changes to PUT `/products/:id` body** (lines 123-133): remove `phase`, add `typeId`/`brandId`:
```typescript
body: t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  typeId: t.Optional(t.Number({ minimum: 1 })),
  brandId: t.Optional(t.Number({ minimum: 1 })),
  proteinPercent: t.Optional(t.Number({ minimum: 0 })),
  defaultUnit: t.Optional(t.String({ maxLength: 10 })),
  zakKgConversion: t.Optional(t.Number({ minimum: 0 })),
}),
```

All other routes in `feed.controller.ts` remain unchanged.

---

### `server/src/modules/feed/feed.service.ts` (service — modify)

**Current file:** `server/src/modules/feed/feed.service.ts` lines 62-160

**Changes to `createFeedProduct`** (lines 79-87): swap `phase` → `typeId`/`brandId`:
```typescript
const result = await tx.insert(feedProductsTable).values({
  tenantId,
  code: input.code,
  name: input.name,
  typeId: input.typeId ?? null,     // replaces phase
  brandId: input.brandId ?? null,
  proteinPercent: input.proteinPercent?.toString() ?? null,
  defaultUnit: input.defaultUnit ?? 'zak',
  zakKgConversion: input.zakKgConversion?.toString() ?? '50',
})
```

**Changes to `listFeedProducts`** (lines 113-120): add LEFT JOINs to return `typeName`/`brandName`:
```typescript
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
      deletedAt: feedProductsTable.deletedAt,
      createdAt: feedProductsTable.createdAt,
      updatedAt: feedProductsTable.updatedAt,
    })
    .from(feedProductsTable)
    .leftJoin(feedTypes, eq(feedProductsTable.typeId, feedTypes.id))
    .leftJoin(feedBrands, eq(feedProductsTable.brandId, feedBrands.id))
    .where(and(eq(feedProductsTable.tenantId, tenantId), isNull(feedProductsTable.deletedAt)))
}
```

**Changes to `updateFeedProduct`** (lines 136-160): swap `phase` → `typeId`/`brandId` in `updateData` build.

---

### `server/src/index.ts` (config — modify)

**Current file:** `server/src/index.ts` lines 1-14 (imports), lines 59-68 (controller registrations)

**Add imports** (after `feedController` import):
```typescript
import { feedTypesController } from './modules/feed-types/feed-types.routes'
import { feedBrandsController } from './modules/feed-brands/feed-brands.routes'
```

**Add to chain** (after `.use(feedController)` at line 65):
```typescript
.use(feedTypesController)
.use(feedBrandsController)
```

---

### `client/src/api/feed-types.ts` (utility, request-response)

**Analog:** `client/src/api/units.ts` (lines 1-51)

**Full file pattern:**
```typescript
import { apiClient } from './client';

export interface FeedType {
  id: number;
  tenantId: number;
  name: string;
  code: string;
  isActive: number | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeedTypesResponse {
  feedTypes: FeedType[];
}

export function listFeedTypes(): Promise<FeedTypesResponse> {
  return apiClient<FeedTypesResponse>('/feed-types');
}

export function createFeedType(data: { name: string; code: string }): Promise<{ success: boolean; feedType: FeedType }> {
  return apiClient<{ success: boolean; feedType: FeedType }>('/feed-types', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateFeedType(
  id: number,
  data: { name?: string; code?: string; isActive?: number },
): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/feed-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteFeedType(id: number): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/feed-types/${id}`, {
    method: 'DELETE',
  });
}
```

**Note:** Response key is `feedTypes` (plural camelCase matching controller `return { feedTypes: result }`). Verify controller return shape matches this.

---

### `client/src/api/feed-brands.ts` (utility, request-response)

**Analog:** `client/src/api/units.ts`

Same pattern as `feed-types.ts` above. Interface adds `phone: string | null`. Functions: `listFeedBrands`, `createFeedBrand`, `updateFeedBrand`, `deleteFeedBrand`. Endpoints: `/feed-brands`.

---

### `client/src/api/feed.ts` (utility — modify)

**Current file:** `client/src/api/feed.ts` lines 38-51

**Replace `FeedProduct` interface** (lines 38-51): remove `phase`, add FK fields:
```typescript
export interface FeedProduct {
  id: number;
  tenantId: number;
  code: string;
  name: string;
  typeId: number | null;
  brandId: number | null;
  typeName: string | null;
  brandName: string | null;
  proteinPercent: string | null;
  defaultUnit: string | null;
  zakKgConversion: string | null;
  isActive: number | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

Add two new API client functions after `listFeedProducts`:
```typescript
export function createFeedProduct(data: {
  code: string; name: string; typeId?: number; brandId?: number;
  proteinPercent?: number; defaultUnit?: string; zakKgConversion?: number;
}): Promise<{ success: boolean; product: FeedProduct }> {
  return apiClient('/feed/products', { method: 'POST', body: JSON.stringify(data) });
}

export function updateFeedProduct(
  id: number,
  data: { name?: string; typeId?: number; brandId?: number; zakKgConversion?: number; isActive?: number },
): Promise<{ success: boolean }> {
  return apiClient(`/feed/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteFeedProduct(id: number): Promise<{ success: boolean }> {
  return apiClient(`/feed/products/${id}`, { method: 'DELETE' });
}
```

---

### `client/src/pages/feed/FeedTypes.tsx` (component, CRUD)

**Analog:** `client/src/pages/units/Units.tsx` (lines 1-193)

**Imports pattern** (lines 1-16):
```typescript
import { useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ResponsiveTable } from '../../components/ui/ResponsiveTable';
import AddIcon from '@mui/icons-material/Add';
import Switch from '@mui/material/Switch';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listFeedTypes, deleteFeedType, updateFeedType, type FeedType } from '../../api/feed-types';
import { useAuth } from '../../contexts/AuthContext';
import { FeedTypesModal } from './FeedTypesModal';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { ColumnDef } from '../../types/table';
```

**Query pattern** (mirror units.tsx lines 28-32):
```typescript
const { data } = useQuery({
  queryKey: ['feed-types'],
  queryFn: listFeedTypes,
  enabled: !!user,
});
```

**Delete mutation pattern** (mirror units.tsx lines 34-44):
```typescript
const deleteMutation = useMutation({
  mutationFn: deleteFeedType,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['feed-types'] });
    setSnackbar({ open: true, message: 'Tipe pakan berhasil dihapus', severity: 'success' });
  },
  onError: (error: Error) => {
    setSnackbar({ open: true, message: `Gagal menghapus: ${error.message}`, severity: 'error' });
  },
});
```

**Toggle mutation pattern** (mirror units.tsx lines 46-58):
```typescript
const toggleMutation = useMutation({
  mutationFn: async (id: number) => {
    const item = data?.feedTypes.find((t) => t.id === id);
    if (!item) return;
    return updateFeedType(id, { isActive: item.isActive ? 0 : 1 });
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed-types'] }),
});
```

**Columns definition** (mirror units.tsx lines 69-138, adapt for feed types):
- `code` — "Kode Tipe"
- `name` — "Nama Tipe"
- `isActive` — Switch toggle (same pattern as units)
- `actions` — Edit + Delete IconButtons (same pattern as units)

**Table render** (mirror units.tsx lines 156-165):
```typescript
<ResponsiveTable
  columns={columns}
  data={data?.feedTypes ?? []}
  enableSorting
  enableFiltering
  enablePagination
  initialPageSize={10}
/>
```

**Add button label:** "Tambah Tipe Pakan"

---

### `client/src/pages/feed/FeedTypesModal.tsx` (component, request-response)

**Analog:** `client/src/pages/units/UnitModal.tsx` (lines 1-169)

**Zod schema** (mirror lines 18-22):
```typescript
const feedTypeSchema = z.object({
  name: z.string().min(1, 'Nama tipe wajib diisi'),
  code: z.string().min(1, 'Kode tipe wajib diisi'),
});
type FeedTypeFormData = z.infer<typeof feedTypeSchema>;
```

**useEffect populate pattern** (lines 59-72 — exact copy, swap `units`/`unit`):
```typescript
useEffect(() => {
  if (selectedId && data?.feedTypes) {
    const item = data.feedTypes.find((t) => t.id === selectedId);
    if (item) {
      reset({ name: item.name, code: item.code });
    }
  } else {
    reset({ name: '', code: '' });
  }
}, [selectedId, data, reset]);
```

**Mutation pattern** (lines 74-83):
```typescript
const createMutation = useMutation({
  mutationFn: isEditMode
    ? (formData: FeedTypeFormData) => updateFeedType(selectedId!, formData)
    : createFeedType,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['feed-types'] });
    reset();
    onClose();
  },
});
```

**Form fields:** `code` ("Kode Tipe") and `name` ("Nama Tipe") — no `location` field.

**Dialog title:** `isEditMode ? 'Edit Tipe Pakan' : 'Tambah Tipe Pakan'`

---

### `client/src/pages/feed/FeedBrands.tsx` (component, CRUD)

**Analog:** `client/src/pages/units/Units.tsx`

Identical pattern to `FeedTypes.tsx`. Key differences:
- Import from `../../api/feed-brands`
- `queryKey: ['feed-brands']`
- Modal: `FeedBrandsModal`
- Columns: `code` ("Kode Merek"), `name` ("Nama Merek"), `phone` ("Telepon"), `isActive` (Switch), `actions`
- Add button label: "Tambah Merek Pakan"
- Snackbar messages use "merek pakan"

---

### `client/src/pages/feed/FeedBrandsModal.tsx` (component, request-response)

**Analog:** `client/src/pages/units/UnitModal.tsx`

Same pattern as `FeedTypesModal.tsx`. Key differences:
- Zod schema adds optional `phone` field: `phone: z.string().optional()`
- Form fields: `code`, `name`, `phone` ("Telepon / Kontak")
- Import from `../../api/feed-brands`
- Dialog title: `isEditMode ? 'Edit Merek Pakan' : 'Tambah Merek Pakan'`

---

### `client/src/pages/feed/FeedProducts.tsx` (component, CRUD)

**Analog:** `client/src/pages/units/Units.tsx` (role-match — same structure, different data)

Same CRUD page pattern. Key differences:
- Import from `../../api/feed` (`listFeedProducts`, `deleteFeedProduct`, `updateFeedProduct`, `FeedProduct`)
- `queryKey: ['feed-products']`
- Modal: `FeedProductsModal`
- Columns: `code` ("Kode Produk"), `name` ("Nama Produk"), `typeName` ("Tipe"), `brandName` ("Merek"), `zakKgConversion` ("Konversi Zak/Kg"), `isActive` (Switch), `actions`
- Add button label: "Tambah Produk Pakan"

---

### `client/src/pages/feed/FeedProductsModal.tsx` (component, request-response)

**Analog:** `client/src/pages/units/UnitModal.tsx` (role-match — adds Autocomplete)

**Extra imports for Autocomplete:**
```typescript
import Autocomplete from '@mui/material/Autocomplete';
import { useQuery as useTypeQuery } from '@tanstack/react-query';
import { listFeedTypes, type FeedType } from '../../api/feed-types';
import { listFeedBrands, type FeedBrand } from '../../api/feed-brands';
```

**Inside modal, fetch types and brands:**
```typescript
const { data: typesData } = useQuery({ queryKey: ['feed-types'], queryFn: listFeedTypes });
const { data: brandsData } = useQuery({ queryKey: ['feed-brands'], queryFn: listFeedBrands });
```

**Autocomplete field pattern** (for typeId):
```typescript
<Controller
  name="typeId"
  control={control}
  render={({ field }) => (
    <Autocomplete
      options={typesData?.feedTypes ?? []}
      getOptionLabel={(option) => option.name}
      value={typesData?.feedTypes.find((t) => t.id === field.value) ?? null}
      onChange={(_, newValue) => field.onChange(newValue?.id ?? null)}
      renderInput={(params) => (
        <TextField {...params} label="Tipe Pakan" error={!!errors.typeId} helperText={errors.typeId?.message} />
      )}
    />
  )}
/>
```

Same Autocomplete pattern for `brandId` using `brandsData?.feedBrands`.

**Zod schema:**
```typescript
const feedProductSchema = z.object({
  code: z.string().min(1, 'Kode produk wajib diisi'),
  name: z.string().min(1, 'Nama produk wajib diisi'),
  typeId: z.number().nullable().optional(),
  brandId: z.number().nullable().optional(),
  zakKgConversion: z.number().optional(),
});
```

---

### `client/src/pages/feed/SuratJalanModal.tsx` (component — modify)

**Current file:** `client/src/pages/feed/SuratJalanModal.tsx` (lines 1-240)

**No change required** — this file already uses `listFeedProducts()` dynamically (lines 19, 63-70). After the `FeedProduct` interface is updated in `feed.ts` (removing `phase`), the existing dropdown renders `product.name` which is unaffected.

**Verify after changes:** Ensure `feedProducts.map(product => <MenuItem value={product.id}>{product.name}</MenuItem>)` at lines 181-186 still works — `product.name` is unchanged.

**TypeScript check:** Remove any code that reads `product.phase` if it exists (none found in current file — safe).

---

### `client/src/components/layout/Sidebar.tsx` (component — modify)

**Current file:** `client/src/components/layout/Sidebar.tsx` lines 43-70

**Append to `menuItems` array** after the existing `Feed` entry (line 49):
```typescript
{ text: 'Tipe Pakan', icon: <Inventory2Icon />, path: '/feed/types', permission: 'feed-types.read' },
{ text: 'Merek Pakan', icon: <Inventory2Icon />, path: '/feed/brands', permission: 'feed-brands.read' },
{ text: 'Produk Pakan', icon: <Inventory2Icon />, path: '/feed/products', permission: 'feed.read' },
```

**Note:** Phase 20 handles full sidebar reorganization. For now, add three flat entries after "Feed" — they are visibility-gated by existing `userPermissions.includes(item.permission)` logic (line 82-84), so users without the permission won't see them.

---

### `client/src/App.tsx` (config — modify)

**Current file:** `client/src/App.tsx` lines 1-45

**Add imports** (after line 10):
```typescript
import { FeedTypes } from './pages/feed/FeedTypes';
import { FeedBrands } from './pages/feed/FeedBrands';
import { FeedProducts } from './pages/feed/FeedProducts';
```

**Add routes** (after `<Route path="/feed" element={<FeedStock />} />` at line 34):
```typescript
<Route path="/feed/types" element={<FeedTypes />} />
<Route path="/feed/brands" element={<FeedBrands />} />
<Route path="/feed/products" element={<FeedProducts />} />
```

---

### `client/src/components/__tests__/FeedTypesModal.test.tsx` (test)

**Analog:** `client/src/components/__tests__/UnitModal.test.tsx` (lines 1-31)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { FeedTypesModal } from '../../pages/feed/FeedTypesModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('FeedTypesModal', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders modal component', () => {
    render(<FeedTypesModal open={true} onClose={() => {}} />, { wrapper });
    expect(document.body.innerHTML).toContain('MuiDialog');
  });

  it('renders form fields', () => {
    render(<FeedTypesModal open={true} onClose={() => {}} />, { wrapper });
    expect(document.body.innerHTML).toContain('MuiTextField');
  });
});
```

---

### `client/src/components/__tests__/FeedBrandsModal.test.tsx` (test)

**Analog:** `client/src/components/__tests__/UnitModal.test.tsx`

Same pattern as `FeedTypesModal.test.tsx` — swap `FeedTypesModal` → `FeedBrandsModal`, import path, describe label.

---

## Shared Patterns

### Authentication / Tenant Guard
**Source:** `server/src/modules/unit/unit.controller.ts` lines 43-48
**Apply to:** All new controller routes (POST, PUT, DELETE)
```typescript
const currentTenantId = getTenantId(ctx)
if (!ctx.user) {
  throw new Error('MISSING_USER_ID')
}
const userId = ctx.user.id
```

### RBAC Permission Guard
**Source:** `server/src/modules/unit/unit.controller.ts` lines 53, 69, 99, 123
**Apply to:** Every route handler via `beforeHandle`
```typescript
{ beforeHandle: requirePermission('feed-types.create') }
```

### Soft Delete Pattern
**Source:** `server/src/modules/unit/unit.service.ts` lines 209-212
**Apply to:** All service `softDelete*` functions
```typescript
await db.update(table).set({ deletedAt: new Date() })
  .where(and(eq(table.id, id), eq(table.tenantId, tenantId)))
```

### Audit Log (Fire-and-Forget)
**Source:** `server/src/modules/unit/unit.service.ts` lines 49-58
**Apply to:** All service create/update/delete functions
```typescript
try {
  await tx.insert(auditLogs).values({
    userId, action: 'create', resource: 'feed_type',
    resourceId: String(newId), newValue: JSON.stringify(input),
  })
} catch { /* fire-and-forget */ }
```

### isNull(deletedAt) Filter
**Source:** `server/src/modules/unit/unit.service.ts` lines 76-77
**Apply to:** ALL list/get queries — without this, soft-deleted records appear in results
```typescript
.where(and(eq(table.tenantId, tenantId), isNull(table.deletedAt)))
```

### TanStack Query Invalidation
**Source:** `client/src/pages/units/Units.tsx` lines 37, 53
**Apply to:** All mutation `onSuccess` handlers
```typescript
queryClient.invalidateQueries({ queryKey: ['feed-types'] })
```

### MUI Snackbar Feedback
**Source:** `client/src/pages/units/Units.tsx` lines 21-26, 177-190
**Apply to:** All CRUD list pages
```typescript
const [snackbar, setSnackbar] = useState<{
  open: boolean; message: string; severity: 'success' | 'error';
}>({ open: false, message: '', severity: 'success' });
```

### Form Submit Error Handling
**Source:** `client/src/pages/units/UnitModal.tsx` lines 85-95
**Apply to:** All modal `onSubmit` handlers
```typescript
const onSubmit = async (data: FormData) => {
  setIsSubmitting(true);
  setError(null);
  try {
    await createMutation.mutateAsync(data);
  } catch (_err) {
    setError('Gagal menyimpan');
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## No Analog Found

All files in this phase have direct analogs in the codebase. No new patterns need to be invented.

| File | Role | Data Flow | Note |
|---|---|---|---|
| seed/migration script | utility | batch | One-time script — no analog exists; use RESEARCH.md SQL steps. Run before `drizzle-kit push`. |

---

## Metadata

**Analog search scope:** `server/src/modules/unit/`, `server/src/db/schema/`, `client/src/pages/units/`, `client/src/api/`, `client/src/components/__tests__/`
**Files scanned:** 14 source files read directly
**Pattern extraction date:** 2026-04-21
