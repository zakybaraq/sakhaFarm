# Phase 19: Vitamins/Medicines Management - Research

**Researched:** 2026-04-21
**Domain:** Pharmaceutical inventory management, batch tracking, FIFO consumption
**Confidence:** HIGH

## Summary

This phase adds inventory management for vitamins and medicines with three tables: `vitamins_medicines` (master catalog), `pharmaceutical_stock` (per-plasma inventory balances), and `pharmaceutical_batches` (batch-level tracking with FIFO fulfillment). The backend follows the established pattern of `feed-brands` for CRUD and `feed.service.ts` for transaction-based stock operations. The frontend mirrors `FeedBrands.tsx` for the CRUD page and extends `DailyRecording.tsx` with a pharmaceutical usage section.

**Primary recommendation:** Reuse patterns from `feed-brands` (CRUD with audit), `feed.service.ts` stock section (transactional consumption), and `FeedBrandModal.tsx` (form with autocomplete). Implement FIFO batch selection in the service layer with a simple ordered SELECT + loop.

## Standard Stack

### Core (Backend)

| Library     | Version | Purpose                          | Why Standard                                                   |
| ----------- | ------- | -------------------------------- | -------------------------------------------------------------- |
| Elysia      | ^1.4.0  | HTTP server & routing            | Already used; consistent controller pattern                    |
| Drizzle ORM | ^0.44.0 | MySQL query builder & migrations | Used across all modules; decimal type as strings for precision |
| MySQL2      | ^3.14.0 | Database driver                  | Existing stack                                                 |
| Zod         | ^3.24.0 | Request validation               | Used in controller bodies                                      |
| Bun         | latest  | Runtime                          | Project uses Bun                                               |

### Core (Frontend)

| Library             | Version | Purpose                 | Why Standard                    |
| ------------------- | ------- | ----------------------- | ------------------------------- |
| React               | ^19.1.0 | UI framework            | v18+ with hooks                 |
| MUI                 | ^7.1.0  | Component library       | Material Design used throughout |
| TanStack Query      | ^5.76.0 | Data fetching & caching | Standard for API calls          |
| React Hook Form     | ^7.72.1 | Form state              | Used in all modals              |
| @hookform/resolvers | ^5.2.2  | Zod integration         | Form validation                 |

### Supporting (Already present)

| Library               | Purpose         | Relevance                |
| --------------------- | --------------- | ------------------------ |
| @tanstack/react-table | Table component | Used by ResponsiveTable  |
| @mui/icons-material   | Icons           | Edit/Delete/Switch icons |
| Pino                  | Logging         | Consistent with backend  |

**Installation:** All dependencies already in `server/package.json` and `client/package.json`. No new packages required.

**Version verification:**

```bash
# Server
npm view drizzle-orm version  # 0.44.0 (project uses ^0.44.0)
npm view elysia version        # 1.4.28 (project uses ^1.4.0)
npm view vitest version         # 3.1.0+

# Client
npm view @mui/material version  # 9.0.0 (project uses ^7.1.0 — note: verify actual installed)
npm view @tanstack/react-query version  # 5.99.2+
```

### Alternatives Considered

| Instead of                                 | Could Use                           | Tradeoff                                                  |
| ------------------------------------------ | ----------------------------------- | --------------------------------------------------------- |
| Separate `vitamins` and `medicines` tables | Single table with category enum     | Simpler queries, same validation patterns                 |
| FEFO (First-Expired-First-Out) only        | FIFO with expiry ordering           | FEFO is a subset; ordering by expiryDate ASC handles both |
| In-app batch movements table               | Separate `pharmaceutical_movements` | Deferred to later phase; simpler for now                  |

## Architecture Patterns

### System Architecture Diagram

```mermaid
graph LR
    A[Client React] --> B[Elysia API]<br/>Controller → Service
    B --> C[Tenant Plugin<br/>getTenantId]
    B --> D[RBAC Plugin<br/>requirePermission]
    B --> E[Drizzle ORM]
    E --> F[(MySQL<br/>tenant-scoped)]

    subgraph "Pharmaceutical Module"
        B --> G[POST /api/vitamins-medicines]
        B --> H[POST /api/pharmaceutical-usage]
        B --> I[GET /api/pharmaceutical-stock]
        B --> J[POST /api/pharmaceutical-batches]
    end

    G --> K[Service Layer<br/>transaction + audit]
    H --> L[FIFO Fulfillment<br/>batch decrement]

    K --> M[vitamins_medicines table]
    L --> N[pharmaceutical_stock<br/>atomic update]
    L --> O[pharmaceutical_batches<br/>remainingQty decrement]

    A --> P[DailyRecording Page<br/>pharmaceutical section]
    P --> G
    P --> H
```

### Backend Module Structure

```
server/src/modules/pharmaceuticals/
├── pharmaceuticals.controller.ts   # Elysia routes + RBAC + validation
├── pharmaceuticals.service.ts      # Business logic, transactions
├── schema.ts                        # Drizzle table exports
├── errors.ts                        # Custom error classes
└── index.ts                         # Barrel export
```

### Frontend Structure

```
client/src/
├── api/
│   └── pharmaceuticals.ts           # API client (typed interfaces)
├── pages/pharmaceuticals/
│   ├── VitaminsMedicines.tsx        # CRUD page (like FeedBrands.tsx)
│   └── VitaminsMedicineModal.tsx    # Create/Edit modal
└── pages/recordings/
    └── DailyRecording.tsx           # Extend with PharmaUsageSection component
```

### Pattern 1: Master Data CRUD with Transactions

**What:** Controller receives validated body → service function wraps all DB writes in `db.transaction()` → audit log inserted within the same transaction.

**When to use:** All create/update/delete operations on tenant-scoped tables.

**Example:** From `feed-brands.service.ts` lines 10–54:

```typescript
export async function createFeedBrand(input, tenantId, userId) {
  return db.transaction(async (tx) => {
    // 1. Duplicate check
    const existing = await tx.select().from(feedBrands).where(...)
    if (existing.length > 0) throw new DuplicateFeedBrandCodeError(input.code)

    // 2. Insert
    const result = await tx.insert(feedBrands).values({ ...input, tenantId })

    // 3. Audit (fire-and-forget)
    try {
      await tx.insert(auditLogs).values({ userId, action: 'create', ... })
    } catch {}

    // 4. Return created record
    return await tx.select().from(feedBrands).where(...)
  })
}
```

### Pattern 2: Atomic Consumption with Stock Validation

**What:** Fetch current stock with `FOR UPDATE` lock, validate, then update both stock summary and batch details within one transaction.

**When to use:** Recording consumption/usage that affects both aggregated stock and granular batch records.

**Example:** From `feed.service.ts` recordFeedConsumption (lines 474–582):

```typescript
export async function recordFeedConsumption(input, tenantId, userId) {
  await verifyPlasmaInTenant(input.plasmaId, tenantId)

  return db.transaction(async (tx) => {
    // Validate product exists
    const product = await tx.select().from(feedProducts).where(...)
    if (!product) throw new FeedProductNotFoundError(...)

    // Lock stock row
    const stock = await tx.select().from(feedStock).where(...).for('update')
    if (!stock) throw new FeedStockNotFoundError(...)

    // Calculate new balances
    const newOut = parseFloat(stock.totalOutKg) + input.consumptionKg
    const closing = opening + in - newOut
    if (closing < 0) throw new NegativeStockError(...)

    // Insert movement record
    await tx.insert(feedMovements).values({ ... })

    // Update stock atomically
    await tx.update(feedStock).set({
      totalOutKg: sql`${feedStockTable.totalOutKg} + ${input.consumptionKg}`,
      closingStockKg: sql`${feedStockTable.closingStockKg} - ${input.consumptionKg}`,
    })

    // Audit
    try { await tx.insert(auditLogs).values({ ... }) } catch {}

    return { success: true, ... }
  })
}
```

### Pattern 3: Category-Filtered Supplier Autocomplete

**What:** Supplier list endpoint accepts optional `category` query param; frontend fetches suppliers filtered to `vitamin|medicine` for item form.

**Example:** From `suppliers.controller.ts` lines 13–36:

```typescript
.get('/suppliers', async (ctx) => {
  const { currentTenantId } = ctx
  const filters = {}
  if (ctx.query.category) filters.category = ctx.query.category
  const suppliers = await supplierService.listSuppliers(currentTenantId, filters)
  return { suppliers }
}, {
  query: t.Object({
    category: t.Optional(t.String()),
  }),
})
// Frontend: listSuppliers({ tenantId, category: 'vitamin' })
```

### Anti-Patterns to Avoid

- **Hand-rolling decimal arithmetic in JavaScript:** Use DB-level updates with `sql` template; parseFloat only for validation/comparisons.
- **SELECT then UPDATE without transaction:** Always wrap stock changes in `db.transaction()` to prevent race conditions.
- **Soft-deleting without reference checks:** Like `feed-brands`, check `pharmaceutical_stock` and `pharmaceutical_batches` before allowing delete.
- **Using JOINed tables for stock lookup without tenant isolation:** Always include `tenantId` in WHERE clauses.

## Schema Design

### vitamins_medicines

```typescript
import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  index,
  unique,
} from "drizzle-orm/mysql-core";
import { tenants } from "./tenants";
import { suppliers } from "./suppliers";

export const vitaminsMedicines = mysqlTable(
  "vitamins_medicines",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 20 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    category: varchar("category", { length: 20 }).notNull(), // 'vitamin' | 'medicine'
    unitOfMeasure: varchar("unit_of_measure", { length: 50 }).notNull(),
    manufacturer: varchar("manufacturer", { length: 100 }),
    strength: varchar("strength", { length: 50 }), // e.g., "500mg", "5%"
    phone: varchar("phone", { length: 20 }), // supplier contact (optional override)
    supplierId: int("supplier_id").references(() => suppliers.id, {
      onDelete: "set null", // keep item if supplier deleted
    }),
    isActive: int("is_active").default(1),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    uqPharmaCode: unique("uq_vitamins_medicines_code").on(
      table.tenantId,
      table.code,
    ),
    idxPharmaTenant: index("idx_vitamins_medicines_tenant").on(table.tenantId),
    idxPharmaCategory: index("idx_vitamins_medicines_category").on(
      table.category,
    ),
    idxPharmaSupplier: index("idx_vitamins_medicines_supplier").on(
      table.supplierId,
    ),
  }),
);

export type VitaminMedicine = typeof vitaminsMedicines.$inferSelect;
export type NewVitaminMedicine = typeof vitaminsMedicines.$inferInsert;
```

### pharmaceutical_stock

```typescript
import { plasmas } from "./plasmas";
import { vitaminsMedicines } from "./vitamins_medicines";

export const pharmaceuticalStock = mysqlTable(
  "pharmaceutical_stock",
  {
    id: int("id").autoincrement().primaryKey(),
    plasmaId: int("plasma_id")
      .notNull()
      .references(() => plasmas.id, { onDelete: "cascade" }),
    itemId: int("item_id")
      .notNull()
      .references(() => vitaminsMedicines.id, { onDelete: "cascade" }),
    openingStock: decimal("opening_stock", { precision: 10, scale: 3 }).default(
      "0",
    ),
    totalIn: decimal("total_in", { precision: 10, scale: 3 }).default("0"), // received from batches
    totalOut: decimal("total_out", { precision: 10, scale: 3 }).default("0"), // consumed
    closingStock: decimal("closing_stock", { precision: 10, scale: 3 }).default(
      "0",
    ),
    lastUpdatedAt: timestamp("last_updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    uqPlasmaItem: unique("uq_pharma_stock_plasma_item").on(
      table.plasmaId,
      table.itemId,
    ),
    idxStockPlasma: index("idx_pharma_stock_plasma").on(table.plasmaId),
    idxStockItem: index("idx_pharma_stock_item").on(table.itemId),
  }),
);

export type PharmaceuticalStock = typeof pharmaceuticalStock.$inferSelect;
export type NewPharmaceuticalStock = typeof pharmaceuticalStock.$inferInsert;
```

**Note:** `openingStock` is set when first batch arrives; never changes afterwards. `totalIn` accumulates all received quantities; `totalOut` accumulates all issued quantities; `closingStock = openingStock + totalIn - totalOut`.

### pharmaceutical_batches

```typescript
export const pharmaceuticalBatches = mysqlTable(
  "pharmaceutical_batches",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    itemId: int("item_id")
      .notNull()
      .references(() => vitaminsMedicines.id, { onDelete: "cascade" }),
    batchNumber: varchar("batch_number", { length: 50 }).notNull(),
    expiryDate: date("expiry_date").notNull(),
    receivedQty: decimal("received_qty", { precision: 10, scale: 3 }).notNull(),
    remainingQty: decimal("remaining_qty", {
      precision: 10,
      scale: 3,
    }).notNull(), // decreases on issue
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    uqBatchItem: unique("uq_pharma_batch_item_batch").on(
      table.itemId,
      table.batchNumber,
    ),
    idxBatchTenant: index("idx_pharma_batch_tenant").on(table.tenantId),
    idxBatchItem: index("idx_pharma_batch_item").on(table.itemId),
    idxBatchExpiry: index("idx_pharma_batch_expiry").on(table.expiryDate),
  }),
);

export type PharmaceuticalBatch = typeof pharmaceuticalBatches.$inferSelect;
export type NewPharmaceuticalBatch = typeof pharmaceuticalBatches.$inferInsert;
```

### TypeScript Type Usage Patterns

```typescript
// Select (read) type
type VitaminMedicine = typeof vitaminsMedicines.$inferSelect;

// Insert (create) type — excludes auto fields (id, timestamps)
type NewVitaminMedicine = typeof vitaminsMedicines.$inferInsert;

// Partial update: Omit auto fields + make all optional
type UpdateVitaminMedicine = Partial<
  Omit<NewVitaminMedicine, "tenantId" | "code" | "category">
>;
```

### Indexes Rationale

| Index                             | Columns               | Why                                            |
| --------------------------------- | --------------------- | ---------------------------------------------- |
| `uq_vitamins_medicines_code`      | (tenantId, code)      | Tenant-unique item code; lookups by code       |
| `idx_vitamins_medicines_category` | (category)            | Filter vitamin vs medicine lists               |
| `uq_pharma_stock_plasma_item`     | (plasmaId, itemId)    | Unique per plasma; fetch stock for item/plasma |
| `idx_pharma_stock_plasma`         | (plasmaId)            | List all stock for a plasma                    |
| `uq_pharma_batch_item_batch`      | (itemId, batchNumber) | Prevent duplicate batch numbers per item       |
| `idx_pharma_batch_expiry`         | (expiryDate)          | Fast FIFO ordering + expiry alerts             |

### Foreign Key Rules

| Column                            | References            | ON DELETE | Rationale                         |
| --------------------------------- | --------------------- | --------- | --------------------------------- |
| `vitamins_medicines.tenantId`     | tenants.id            | CASCADE   | Tenant deletion removes all items |
| `vitamins_medicines.supplierId`   | suppliers.id          | SET NULL  | Keep item if supplier removed     |
| `pharmaceutical_stock.plasmaId`   | plasmas.id            | CASCADE   | Plasma removed → stock removed    |
| `pharmaceutical_stock.itemId`     | vitamins_medicines.id | CASCADE   | Item removed → stock removed      |
| `pharmaceutical_batches.tenantId` | tenants.id            | CASCADE   | Tenant cleanup                    |
| `pharmaceutical_batches.itemId`   | vitamins_medicines.id | CASCADE   | Item removed → batches removed    |

## API Contract

### Base URL: `/api` with tenant query param or `x-tenant-id` header

### Pharmaceuticals CRUD (vitamins_medicines)

#### GET /vitamins-medicines

List all items for tenant, optionally filtered by category.

**Query params:**

- `category` (optional): `'vitamin' | 'medicine'`

**Response (200):**

```json
{
  "items": [
    {
      "id": 1,
      "tenantId": 1,
      "code": "VIT001",
      "name": "Vitamin A",
      "category": "vitamin",
      "unitOfMeasure": "ml",
      "manufacturer": "PharmaCo",
      "strength": "5000 IU/ml",
      "phone": "+123456789",
      "supplierId": 3,
      "isActive": 1,
      "deletedAt": null,
      "createdAt": "2026-04-20T10:00:00.000Z",
      "updatedAt": "2026-04-20T10:00:00.000Z"
    }
  ]
}
```

**RBAC:** `pharmaceuticals.read`

---

#### POST /vitamins-medicines

Create new item.

**Body:**

```json
{
  "code": "MED001",
  "name": "Amoxicillin",
  "category": "medicine",
  "unitOfMeasure": "tablet",
  "manufacturer": "GenericLab",
  "strength": "500mg",
  "phone": "+1234567890",
  "supplierId": 5
}
```

**Validation:**

- `code`: required, 1–20 chars, unique per tenant
- `name`: required, 1–100 chars
- `category`: required, enum: `'vitamin' | 'medicine'`
- `unitOfMeasure`: required, 1–50 chars
- `manufacturer`: optional, max 100 chars
- `strength`: optional, max 50 chars
- `phone`: optional, max 20 chars (numeric)
- `supplierId`: optional integer — if provided, must reference a supplier with `category IN ('vitamin', 'medicine')`

**Service-level checks:**

1. Duplicate code check (tenant-scoped)
2. If `supplierId` provided: fetch supplier, verify `supplier.category === 'vitamin' || 'medicine'`; else throw `SupplierCategoryMismatchError`
3. Insert with `tenantId`, `isActive: 1`

**Response (201):**

```json
{
  "success": true,
  "item": {
    /* full item record */
  }
}
```

**RBAC:** `pharmaceuticals.create`

---

#### PUT /vitamins-medicines/:id

Update item. Partial update allowed.

**Body:** Same fields as POST, all optional.

**Validation:** Same as POST; if `supplierId` changed, re-validate category.

**Response (200):**

```json
{ "success": true }
```

**RBAC:** `pharmaceuticals.update`

---

#### PUT /vitamins-medicines/:id/toggle

Toggle `isActive` status.

**Response (200):**

```json
{
  "success": true,
  "isActive": 0
}
```

**RBAC:** `pharmaceuticals.update`

---

#### DELETE /vitamins-medicines/:id

Soft delete (set `deletedAt = NOW()`).

**Pre-delete check:**

- Query `pharmaceutical_stock` where `itemId = :id` AND `deletedAt IS NULL`
- Query `pharmaceutical_batches` where `itemId = :id`
- If either has records → throw `PharmaceuticalInUseError` with count; return 409

**Response (200):**

```json
{ "success": true }
```

**RBAC:** `pharmaceuticals.delete`

---

### Pharmaceutical Stock (read-only aggregate)

#### GET /pharmaceutical-stock

List stock balances per plasma, optionally filtered by item or category.

**Query params:**

- `plasmaId` (optional): filter by plasma
- `itemId` (optional): filter by item
- `category` (optional): `'vitamin' | 'medicine'` — joins to filter items

**Response (200):**

```json
{
  "stocks": [
    {
      "id": 1,
      "plasmaId": 2,
      "itemId": 5,
      "itemCode": "VIT001",
      "itemName": "Vitamin A",
      "category": "vitamin",
      "unitOfMeasure": "ml",
      "openingStock": "0.000",
      "totalIn": "1000.000",
      "totalOut": "250.000",
      "closingStock": "750.000",
      "lastUpdatedAt": "2026-04-21T08:00:00.000Z"
    }
  ]
}
```

**Joins:** `pharmaceutical_stock` JOIN `vitamins_medicines` ON `itemId`.

**RBAC:** `pharmaceutical_stock.read`

---

### Pharmaceutical Batches (CRUD)

#### GET /pharmaceutical-batches

List batches for a given item. Ordered by `expiryDate ASC` (FIFO).

**Query params:**

- `itemId` (required): filter by item

**Response (200):**

```json
{
  "batches": [
    {
      "id": 1,
      "tenantId": 1,
      "itemId": 5,
      "itemName": "Vitamin A",
      "batchNumber": "BATCH001",
      "expiryDate": "2026-12-31",
      "receivedQty": "1000.000",
      "remainingQty": "750.000",
      "createdAt": "2026-04-01T10:00:00.000Z",
      "updatedAt": "2026-04-15T14:00:00.000Z"
    }
  ]
}
```

**RBAC:** `pharmaceutical_batches.manage`

---

#### POST /pharmaceutical-batches

Create batch (receiving new stock). Increases `pharmaceutical_stock.totalIn` and `closingStock`.

**Body:**

```json
{
  "itemId": 5,
  "batchNumber": "BATCH002",
  "expiryDate": "2027-06-30",
  "receivedQty": 500.0
}
```

**Transaction steps (service):**

1. Validate item exists and `isActive = 1`
2. Check for duplicate `(itemId, batchNumber)` for tenant
3. Begin transaction
4. Insert batch (tenantId from ctx, `remainingQty = receivedQty`)
5. Upsert `pharmaceutical_stock`:
   - If row exists: `totalIn = totalIn + :receivedQty`, `closingStock = closingStock + :receivedQty`
   - Else: INSERT with `openingStock = 0`, `totalIn = :receivedQty`, `totalOut = 0`, `closingStock = :receivedQty`
6. Audit batch creation
7. Commit
8. Return created batch with joined item name

**Response (201):**

```json
{
  "success": true,
  "batch": {
    /* batch record + itemName */
  }
}
```

**RBAC:** `pharmaceutical_batches.manage`

---

#### PUT /pharmaceutical-batches/:id

Update batch details. **Only allowed while `remainingQty = receivedQty`** (unused batch). Once consumption started, batch is immutable except for `remainingQty` decrements.

**Allowed updates:** `batchNumber`, `expiryDate`, `receivedQty` (only if unused). If `receivedQty` is reduced, validate `remainingQty <= newReceivedQty`.

**Body:** Partial (any of above fields).

**Response (200):**

```json
{ "success": true }
```

**RBAC:** `pharmaceutical_batches.manage`

---

#### DELETE /pharmaceutical-batches/:id

Hard delete batch. Only allowed if `remainingQty = receivedQty` (fully unused) OR batch was just created with typo. Prefer soft delete pattern? CONTEXT says DELETE (soft) for items only; batches are child records with no explicit soft-delete spec. Given feed-brands pattern uses soft delete for master data, but batches are transactional — **use hard delete** within transaction checking `remainingQty === receivedQty` (i.e., no consumption recorded). If consumption exists, reject with `BatchInUseError`.

**Response (200):**

```json
{ "success": true }
```

**RBAC:** `pharmaceutical_batches.manage`

---

### Pharmaceutical Usage (Consumption Recording)

#### POST /pharmaceutical-usage

Record consumption of vitamins/medicines for a cycle/plasma. Deducts from `pharmaceutical_stock` and decrements `pharmaceutical_batches.remainingQty` using FIFO ordering (oldest expiry first). Single transaction, atomic.

**Body:**

```json
{
  "cycleId": 12,
  "plasmaId": 3,
  "itemId": 5,
  "batchQuantities": [
    { "batchId": 1, "quantity": 200.0 },
    { "batchId": 2, "quantity": 50.0 }
  ],
  "date": "2026-04-21",
  "note": "Routine vitamin injection"
}
```

**Field definitions:**

- `cycleId`: number — validates cycle exists and belongs to tenant
- `plasmaId`: number — validates plasma belongs to tenant
- `itemId`: number — validates active pharmaceutical item
- `batchQuantities`: array of `{ batchId: number, quantity: number (DECIMAL(10,3)) }` — each batch must belong to the item, be non-expired (`expiryDate >= today`), and have `remainingQty >= requested quantity`
- `date`: date string (YYYY-MM-DD) — default to today; cannot be future date
- `note`: optional free text

**Service algorithm:**

```typescript
export async function recordPharmaceuticalUsage(input, tenantId, userId) {
  await verifyPlasmaInTenant(input.plasmaId, tenantId)

  return db.transaction(async (tx) => {
    // 1. Validate item exists and is active
    const item = await tx.select().from(vitaminsMedicines).where(...)
    if (!item || item.deletedAt) throw new PharmaceuticalNotFoundError(input.itemId)

    // 2. Load and validate all batches in a single query
    const batches = await tx.select().from(pharmaceuticalBatches)
      .where(and(
        eq(pharmaceuticalBatches.itemId, input.itemId),
        isNull(pharmaceuticalBatches.deletedAt), // if soft delete implemented
        gte(pharmaceuticalBatches.expiryDate, new Date().toISOString().split('T')[0]),
        inArray(pharmaceuticalBatches.id, input.batchQuantities.map(b => b.batchId))
      ))
      .orderBy(asc(pharmaceuticalBatches.expiryDate)) // FIFO

    // 3. Verify sufficient remainingQty across all batches
    const批次Map = new Map(batches.map(b => [b.id, b]))
    let totalRequested = 0
    for (const bq of input.batchQuantities) {
      const batch = 批次Map.get(bq.batchId)
      if (!batch) throw new BatchNotFoundError(bq.batchId)
      if (batch.remainingQty < bq.quantity) {
        throw new InsufficientBatchStockError(batch.batchNumber, batch.remainingQty, bq.quantity)
      }
      totalRequested += bq.quantity
    }

    // 4. Load or create stock row (SELECT FOR UPDATE to lock)
    const stock = await tx.select().from(pharmaceuticalStock)
      .where(and(eq(pharmaceuticalStock.plasmaId, input.plasmaId), eq(pharmaceuticalStock.itemId, input.itemId)))
      .for('update')
      .limit(1)

    if (stock.length === 0) {
      // First usage — create stock row with openingStock = 0
      await tx.insert(pharmaceuticalStock).values({
        plasmaId: input.plasmaId,
        itemId: input.itemId,
        openingStock: '0',
        totalIn: '0',
        totalOut: input.totalRequested.toString(),
        closingStock: `-${input.totalRequested}`, // will be 0 if no receipts yet
      })
      // But closingStock negative indicates problem — actually should fail if no stock received yet:
      // Better: if stock row doesn't exist and totalIn=0, throw InsufficientStockError
      // Let's enforce: stock must exist (at least one batch must have been received)
      throw new PharmaceuticalStockNotFoundError(input.plasmaId, input.itemId)
    }

    // 5. Validate sufficient closing stock (opening + totalIn - totalOut - requested >= 0)
    const current = stock[0]
    const opening = parseFloat(current.openingStock) || 0
    const totalIn = parseFloat(current.totalIn) || 0
    const totalOut = parseFloat(current.totalOut) || 0
    const newTotalOut = totalOut + totalRequested
    const closing = opening + totalIn - newTotalOut
    if (closing < 0) {
      throw new NegativeStockError(
        (opening + totalIn - totalOut).toFixed(3),
        totalRequested.toFixed(3)
      )
    }

    // 6. Begin updates: iterate batches from oldest expiry (already sorted)
    for (const bq of input.batchQuantities) {
      const batch = 批次Map.get(bq.batchId)
      const newRemaining = parseFloat(batch.remainingQty) - bq.quantity
      await tx.update(pharmaceuticalBatches)
        .set({ remainingQty: newRemaining.toString(), updatedAt: new Date() })
        .where(eq(pharmaceuticalBatches.id, bq.batchId))
    }

    // 7. Update stock summary atomically
    await tx.update(pharmaceuticalStock)
      .set({
        totalOut: sql`${pharmaceuticalStock.totalOut} + ${totalRequested}`,
        closingStock: sql`${pharmaceuticalStock.closingStock} - ${totalRequested}`,
        lastUpdatedAt: new Date(),
      })
      .where(eq(pharmaceuticalStock.id, current.id))

    // 8. Insert usage audit record (could also create separate pharmaceutical_usage table — deferred)
    try {
      await tx.insert(auditLogs).values({
        userId,
        action: 'consume',
        resource: 'pharmaceutical_stock',
        resourceId: String(current.id),
        newValue: JSON.stringify({
          plasmaId: input.plasmaId,
          itemId: input.itemId,
          itemName: item.name,
          batchIds: input.batchQuantities.map(b => b.batchId),
          quantity: totalRequested.toFixed(3),
          closingStock: closing.toFixed(3),
        }),
      })
    } catch {}

    return {
      success: true,
      consumption: {
        plasmaId: input.plasmaId,
        itemId: input.itemId,
        totalQty: totalRequested.toFixed(3),
        closingStock: closing.toFixed(3),
      },
    }
  })
}
```

**Error codes:**
| Code | Condition | HTTP |
|------|-----------|------|
| `PHARMA_NOT_FOUND` | Item, batch, or stock not found | 404 |
| `BATCH_NOT_FOUND` | Batch ID doesn't belong to item | 404 |
| `BATCH_EXPIRED` | `expiryDate < today` for any batch | 400 |
| `INSUFFICIENT_BATCH_STOCK` | `remainingQty < requested` | 400 |
| `INSUFFICIENT_STOCK` | Aggregate closing would be negative | 400 |
| `SUPPLIER_CATEGORY_MISMATCH` | Supplier category not vitamin/medicine | 409 |
| `BATCH_IN_USE` | Delete batch after consumption started | 409 |

**RBAC:** `pharmaceuticals.create` (usage is treated as a consumption action; could define separate `pharmaceutical.consume` but reuse `create` for now per CONTEXT)

---

### Pagination Strategy

List endpoints (`GET /vitamins-medicines`, `GET /pharmaceutical-batches`, `GET /pharmaceutical-stock`) should implement standard offset-based pagination when dataset grows. For Phase 19, initial implementation can return all tenant records (like `FeedBrands.tsx` does with no pagination). If needed later:

**Query params:** `?page=1&limit=25`

**Response:** add `total`, `page`, `totalPages` fields.

Current `FeedBrands.tsx` loads all brands without pagination — acceptable for <1000 records.

## Business Logic Nuances

### FIFO Fulfillment Algorithm

**Goal:** When issuing quantity Q from item X, consume batches in order of `expiryDate ASC` (oldest first). Partially consume a batch if Q < `remainingQty`.

**Algorithm:**

```typescript
const batches = await tx
  .select()
  .from(pharmaceuticalBatches)
  .where(
    and(
      eq(batchTable.itemId, itemId),
      gte(batchTable.expiryDate, today),
      gt(batchTable.remainingQty, 0),
    ),
  )
  .orderBy(asc(batchTable.expiryDate)); // FIFO/FEFO

let remainingToFulfill = Q;
const batchUpdates: { batchId: number; consumeQty: number }[] = [];

for (const batch of batches) {
  if (remainingToFulfill <= 0) break;

  const available = parseFloat(batch.remainingQty);
  const consume = Math.min(available, remainingToFulfill);

  batchUpdates.push({ batchId: batch.id, consumeQty: consume });
  remainingToFulfill -= consume;
}

if (remainingToFulfill > 0) {
  throw new InsufficientBatchStockError(/* total needed vs total available */);
}

// Apply updates in same transaction (no looped UPDATE; single batch UPDATE per batch or bulk)
for (const update of batchUpdates) {
  await tx
    .update(pharmaceuticalBatches)
    .set({ remainingQty: sql`remaining_qty - ${update.consumeQty}` })
    .where(eq(pharmaceuticalBatches.id, update.batchId));
}
```

**Edge cases:**

- **Partial consumption:** `remainingQty` becomes `remainingQty - consumed`, batch stays active.
- **Batch exhausted:** `remainingQty = 0` — keep batch row (audit trail), filter out in batch dropdown UI by `remainingQty > 0` AND `expiryDate >= today`.
- **Expired batches:** Excluded from selection; if all batches expired, throw `NoValidBatchesError`.
- **Concurrent consumption:** `SELECT ... FOR UPDATE` on the batch rows? Actually transaction isolation handles it; but better to also `SELECT ... FOR UPDATE` on batch rows before updating to prevent race conditions. Use `tx.select().from(...).where(...).for('update')`.

**Recommended transaction isolation:** READ COMMITTED (MySQL default) — the `FOR UPDATE` lock prevents concurrent consumption from same batch.

### Expiry Validation

**Rule:** Reject consumption from batches where `expiryDate < CURDATE()`.

**Frontend UX:** Batch autocomplete should visually distinguish expired batches (disable them or show warning badge). Optionally show "No available batches" if all expired.

**Service enforcement:** Mandatory — never trust UI. Filter batches with `gte(batchTable.expiryDate, new Date().toISOString().split('T')[0])`.

**Timezone note:** MySQL DATE has no timezone; store as `'YYYY-MM-DD'`. Compare to current date in server timezone (Asia/Jakarta = UTC+7). Use:

```typescript
const today = new Date().toLocaleDateString("en-CA"); // ISO YYYY-MM-DD
// or
const today = new Date().toISOString().split("T")[0];
```

### Soft Delete Cascading

**Rule:** `vitamins_medicines` soft delete (set `deletedAt`) allowed only if **zero** referencing rows exist in both `pharmaceutical_stock` and `pharmaceutical_batches`.

**Implementation:** Service-level pre-delete checks:

```typescript
const stockRefs = await db
  .select()
  .from(pharmaceuticalStock)
  .where(eq(pharmaceuticalStock.itemId, id))
  .limit(1);
if (stockRefs.length > 0) throw new PharmaceuticalInUseError(id, "stock");

const batchRefs = await db
  .select()
  .from(pharmaceuticalBatches)
  .where(eq(pharmaceuticalBatches.itemId, id))
  .limit(1);
if (batchRefs.length > 0) throw new PharmaceuticalInUseError(id, "batches");
```

Once confirmed clear: `UPDATE vitamins_medicines SET deletedAt = NOW(), is_active = 0 WHERE id = :id`.

**Query filtering:** All list/select queries MUST include `isNull(vitaminsMedicines.deletedAt)`.

### Supplier FK Validation

**Service-level validation pattern (mirrors `suppliers.service.ts` for category check):**

```typescript
// Inside createPharmaceutical or updatePharmaceutical
if (input.supplierId) {
  const supplier = await tx
    .select()
    .from(suppliers)
    .where(
      and(eq(suppliers.id, input.supplierId), eq(suppliers.tenantId, tenantId)),
    )
    .limit(1);

  if (!supplier) {
    throw new SupplierNotFoundError(input.supplierId);
  }
  if (!["vitamin", "medicine"].includes(supplier.category)) {
    throw new SupplierCategoryMismatchError(supplier.category);
  }
}
```

**Why service-level, not just DB FK?** DB FK ensures supplier exists; does not enforce category constraint. Service validates business rule.

### Batch Number Uniqueness Scope

**Rule:** Batch number unique per `(tenantId, itemId, batchNumber)`. The Drizzle unique index `uq_pharma_batch_item_batch` on `(itemId, batchNumber)` enforces per-item uniqueness. Tenant-scoped by virtue of all queries filtering `tenantId`; item is already tenant-scoped.

### Cycle Validation for Usage

The usage endpoint receives `cycleId`. Validate:

- Cycle exists and belongs to tenant
- Cycle status = 'active' (only active cycles accept recordings)
- (Optional) Check that the recording date ≤ today

**Verification function:** Similar to `verifyPlasmaInTenant` in `feed.service.ts`, create `verifyCycleInTenant(cycleId, tenantId)`.

## Frontend Components

### MUI Component Choices

#### 1. Pharmaceuticals CRUD Page (`VitaminsMedicines.tsx`)

**Pattern:** Mirror `FeedBrands.tsx` exactly.

**Key components:**

- `ResponsiveTable` with custom `ColumnDef[]`
- `Switch` (MUI) for `isActive` toggle column
- `IconButton` with `EditIcon`/`DeleteIcon` for actions
- `Snackbar` + `Alert` for notifications
- `VitaminsMedicineModal` for create/edit

**Columns (suggested order):**

```typescript
const columns: ColumnDef<VitaminMedicine>[] = [
  { accessorKey: 'code', header: 'Kode', size: 120 },
  { accessorKey: 'name', header: 'Nama Obat/Vitamin', size: 200 },
  {
    accessorKey: 'category',
    header: 'Kategori',
    size: 100,
    cell: ({ row }) => (
      <Chip
        label={row.original.category === 'vitamin' ? 'Vitamin' : 'Obat'}
        color={row.original.category === 'vitamin' ? 'info' : 'warning'}
        size="small"
      )
    )
  },
  { accessorKey: 'unitOfMeasure', header: 'Unit', size: 100 },
  {
    accessorKey: 'supplierName',
    header: 'Supplier',
    size: 150,
    cell: ({ row }) => row.original.supplierName ?? '-'
  },
  {
    accessorKey: 'isActive',
    header: 'Aktif',
    size: 80,
    cell: ({ row }) => (
      <Switch
        size="small"
        checked={row.original.isActive === 1}
        onChange={(e) => { e.stopPropagation(); handleToggle(row.original.id) }}
      />
    )
  },
  { accessorKey: 'actions', header: 'Aksi', size: 120, cell: actionsCell }
]
```

**Table configuration:**

```typescript
<ResponsiveTable
  columns={columns}
  data={data?.items ?? []}
  enableSorting
  enableFiltering
  enablePagination
  initialPageSize={10}
/>
```

---

#### 2. Create/Edit Modal (`VitaminsMedicineModal.tsx`)

**Pattern:** Extend `FeedBrandModal.tsx` with:

- Category dropdown (Autocomplete or Select with `'vitamin' | 'medicine'`)
- `unitOfMeasure` field — text field or dropdown (e.g., "tablet", "ml", "gram", " vial")
- `manufacturer` and `strength` fields
- `phone` field — numeric keypad validation (like FeedBrand phone)
- `supplierId` — Autocomplete filtering suppliers by category

**Supplier autocomplete pattern:**

```typescript
const { data: suppliersData } = useQuery({
  queryKey: ['suppliers', 'vitamin-medicine'],
  queryFn: () => listSuppliers({ tenantId: user?.tenantId ?? 1, category: 'vitamin,medicine' }),
  enabled: open,
})

// Inside Controller render:
<Autocomplete
  options={suppliersData?.suppliers ?? []}
  getOptionLabel={(s) => s.name}
  value={suppliers.find(s => s.id === field.value) || null}
  onChange={(_, newValue) => field.onChange(newValue?.id ?? null)}
  renderInput={(params) => <TextField {...params} label="Supplier" />}
  isOptionEqualToValue={(option, value) => option.id === value.id}
/>
```

**Category dropdown (Select):**

```typescript
<Controller
  name="category"
  control={control}
  render={({ field }) => (
    <FormControl fullWidth error={!!errors.category}>
      <InputLabel>Kategori</InputLabel>
      <Select {...field} label="Kategori">
        <MenuItem value="vitamin">Vitamin</MenuItem>
        <MenuItem value="medicine">Obat</MenuItem>
      </Select>
    </FormControl>
  )}
/>
```

**Form schema (zod):**

```typescript
const pharmaSchema = z.object({
  code: z.string().min(1, "Kode wajib diisi").max(20),
  name: z.string().min(1, "Nama wajib diisi").max(100),
  category: z.enum(["vitamin", "medicine"]),
  unitOfMeasure: z.string().min(1, "Satuan wajib diisi").max(50),
  manufacturer: z.string().max(100).optional(),
  strength: z.string().max(50).optional(),
  phone: z.string().regex(/^\d+$/, "Hanya angka").max(20).optional(),
  supplierId: z.number().int().positive().nullable().optional(),
});
```

---

#### 3. Pharmaceutical Batches (future table page)

**Not in scope for Phase 19 CRUD** — batch management may be inline on item page or separate. Minimal: as part of item detail view, or simple table page similar to `FeedProducts.tsx`. CONTEXT says "batch selection dropdown in usage section" — implies batch CRUD exists separately. We'll create a minimal `PharmaceuticalBatches.tsx` page listing batches per item with Add/Edit/Delete.

---

#### 4. Daily Recording: Pharmaceutical Usage Section

**Pattern:** Add new section BELOW existing recording fields (not tab). This keeps current flow: enter mortality/BW → then scroll to "Penggunaan Obat/Vitamin" section.

**Structure:**

```tsx
export function PharmaceuticalUsageSection({ recordingDate, cycleId, onSaved }: Props) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Data sources
  const { data: plasmasData } = useQuery({ queryKey: ['plasmas'], ... })
  const { data: pharmaItemsData } = useQuery({
    queryKey: ['pharmaceuticals', user?.tenantId],
    queryFn: () => listPharmaceuticals({ tenantId: user?.tenantId ?? 1, isActive: true })
  })

  // Selected item → fetch batches
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const { data: batchesData } = useQuery({
    queryKey: ['pharma-batches', selectedItemId],
    queryFn: () => selectedItemId ? listPharmaceuticalBatches({ itemId: selectedItemId }) : Promise.resolve({ batches: [] }),
    enabled: !!selectedItemId,
  })

  const form = useForm<UsageForm>({
    resolver: zodResolver(usageSchema),
    defaultValues: { plasmaId: '', itemId: null, batchQuantities: [{ batchId: '', quantity: 0 }], date: new Date().toISOString().split('T')[0], note: '' }
  })

  const watchItemId = form.watch('itemId')
  const watchPlasmaId = form.watch('plasmaId')

  // When item changes: reset batch selections
  useEffect(() => { if (watchItemId !== selectedItemId) setSelectedItemId(watchItemId) }, [watchItemId])

  const usageMutation = useMutation({
    mutationFn: recordPharmaceuticalUsage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmaceutical-stock'] })
      onSaved?.()
    }
  })

  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Penggunaan Obat/Vitamin
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Row 1: Date, Plasma, Item */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Tanggal" type="date" InputLabelProps={{ shrink: true }} />
            )}
          />

          <Controller
            name="plasmaId"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={plasmasData?.plasmas ?? []}
                getOptionLabel={(p) => p.name}
                value={plasmasData?.plasmas.find(p => p.id === field.value) || null}
                onChange={(_, v) => field.onChange(v?.id ?? null)}
                renderInput={(params) => <TextField {...params} label="Plasma" />}
              />
            )}
          />

          <Controller
            name="itemId"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={pharmaItemsData?.items?.filter(i => i.category === 'vitamin' || i.category === 'medicine') ?? []}
                getOptionLabel={(i) => `${i.code} - ${i.name}`}
                value={pharmaItemsData?.items.find(i => i.id === field.value) || null}
                onChange={(_, v) => {
                  field.onChange(v?.id ?? null)
                  form.setValue('batchQuantities', [{ batchId: '', quantity: 0 }])
                }}
                renderInput={(params) => <TextField {...params} label="Obat/Vitamin" />}
              />
            )}
          />
        </Box>

        {/* Row 2: Batch selection + quantity */}
        {watchItemId && (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ minWidth: 80 }}>
              Batch:
            </Typography>
            {form.getValues('batchQuantities').map((bq, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Controller
                  name={`batchQuantities.${idx}.batchId`}
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={batchesData?.batches?.filter(b => b.remainingQty > 0 && b.expiryDate >= new Date().toISOString().split('T')[0]) ?? []}
                      getOptionLabel={(b) => `${b.batchNumber} (exp: ${b.expiryDate}, sisa: ${b.remainingQty}${item?.unitOfMeasure})`}
                      value={batchesData?.batches.find(b => b.id === field.value) || null}
                      onChange={(_, v) => field.onChange(v?.id ?? null)}
                      renderInput={(params) => <TextField {...params} label="Batch" sx={{ minWidth: 250 }} />}
                    />
                  )}
                />
                <Controller
                  name={`batchQuantities.${idx}.quantity`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Qty"
                      type="number"
                      inputProps={{ step: 0.001, min: 0.001 }}
                      sx={{ width: 120 }}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
                <Typography variant="body2" sx={{ minWidth: 40 }}>
                  {item?.unitOfMeasure}
                </Typography>
                {form.getValues('batchQuantities').length > 1 && (
                  <IconButton size="small" onClick={() => removeBatchRow(idx)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
                <Button size="small" startIcon={<AddIcon />} onClick={() => appendBatch({ batchId: null, quantity: 0 })}>
                  + Batch
                </Button>
              </Box>
            ))}
          </Box>
        )}

        {/* Note field */}
        <Controller
          name="note"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Catatan" multiline rows={2} fullWidth />
          )}
        />

        {/* Submit */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            onClick={form.handleSubmit((data) => {
              usageMutation.mutate({
                cycleId: cycleId!,
                plasmaId: data.plasmaId,
                itemId: data.itemId,
                batchQuantities: data.batchQuantities.filter(b => b.batchId && b.quantity > 0),
                date: data.date,
                note: data.note,
              })
            })}
            disabled={usageMutation.isPending}
          >
            {usageMutation.isPending ? 'Menyimpan...' : 'Simpan Penggunaan'}
          </Button>
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleClose}>
        <Alert severity={snackbar.severity} onClose={handleClose}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  )
}
```

**Key details:**

- Batch dropdown filters: `remainingQty > 0` AND `expiryDate >= today`
- Dynamic batch rows: user can add multiple batch+quantity pairs for split fulfillment
- When item changes: reset batch rows
- Validation: at least one batch with quantity > 0 required
- On success: invalidate `pharmaceutical-stock` query → stock tables refresh

---

#### 5. TanStack Query Patterns

**API client functions (`client/src/api/pharmaceuticals.ts`):**

```typescript
export interface Pharmaceutical {
  id: number;
  tenantId: number;
  code: string;
  name: string;
  category: "vitamin" | "medicine";
  unitOfMeasure: string;
  manufacturer: string | null;
  strength: string | null;
  phone: string | null;
  supplierId: number | null;
  supplierName?: string | null; // joined
  isActive: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function listPharmaceuticals(params: {
  tenantId: number;
  category?: string;
  isActive?: boolean;
}): Promise<{ items: Pharmaceutical[] }>;
export function getPharmaceutical(
  id: number,
  tenantId: number,
): Promise<Pharmaceutical>;
export function createPharmaceutical(
  tenantId: number,
  data: Omit<
    NewPharmaceutical,
    "tenantId" | "isActive" | "deletedAt" | "timestamps"
  >,
): Promise<Pharmaceutical>;
export function updatePharmaceutical(
  id: number,
  tenantId: number,
  data: Partial<Pharmaceutical>,
): Promise<{ success: boolean }>;
export function togglePharmaceutical(
  id: number,
  tenantId: number,
): Promise<{ success: boolean; isActive: number }>;
export function deletePharmaceutical(
  id: number,
  tenantId: number,
): Promise<{ success: boolean }>;

// Stock & Batches
export function listPharmaceuticalStock(params: {
  tenantId: number;
  plasmaId?: number;
  itemId?: number;
  category?: string;
}): Promise<{ stocks: PharmaceuticalStockItem[] }>;
export function listPharmaceuticalBatches(params: {
  itemId: number;
}): Promise<{ batches: PharmaceuticalBatch[] }>;
export function createPharmaceuticalBatch(data: {
  itemId: number;
  batchNumber: string;
  expiryDate: string;
  receivedQty: number;
}): Promise<{ success: true; batch: PharmaceuticalBatch }>;
export function recordPharmaceuticalUsage(
  data: UsagePayload,
): Promise<{
  success: true;
  consumption: {
    plasmaId: number;
    itemId: number;
    totalQty: string;
    closingStock: string;
  };
}>;
```

**React Query usage (VitaminsMedicines.tsx):**

```typescript
const { data, isLoading } = useQuery({
  queryKey: ["pharmaceuticals", user?.tenantId],
  queryFn: () => listPharmaceuticals({ tenantId: user!.tenantId }),
  enabled: !!user?.tenantId,
});

const createMutation = useMutation({
  mutationFn: (data) => createPharmaceutical(user!.tenantId, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["pharmaceuticals"] });
    setModalOpen(false);
  },
});

const toggleMutation = useMutation({
  mutationFn: (id) => togglePharmaceutical(user!.tenantId, id),
  onSuccess: () =>
    queryClient.invalidateQueries({ queryKey: ["pharmaceuticals"] }),
});
```

---

#### 6. Supplier Category Filtering for Autocomplete

**Endpoint:** `GET /suppliers?category=vitamin` — passes category as string; backend filters with `eq(suppliers.category, category)`.

**Frontend behavior:**

- Item modal: `listSuppliers({ tenantId: user.tenantId, category: 'vitamin,medicine' })` — but this is not standard comma-separated. Better to call twice (once vitamin, once medicine) and combine, or modify backend to accept multiple categories (not in current scope). Instead, backend `suppliers.controller.ts` currently accepts single `category` string.

**Simplest:** Fetch ALL suppliers and filter client-side to category in ['vitamin', 'medicine']. Given typical supplier lists are tiny (<100), acceptable.

**Alternative:** Add endpoint `GET /suppliers/vitamin-medicine` — extra work, not needed.

### Form Composition in DailyRecording

**Approach:** Create new component `PharmaceuticalUsageSection` as sibling to `RecordingForm`. Import and render below the existing `<RecordingForm />` within `DailyRecording.tsx`.

**Updated DailyRecording.tsx structure:**

```tsx
export function DailyRecording() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ... existing recording form state

  return (
    <Box p={3}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Recording Harian
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <RecordingForm {...props} />
      </Paper>

      {/* NEW: Pharmaceuticals section */}
      <PharmaceuticalUsageSection
        recordingDate={watch("date")}
        cycleId={watch("cycleId")}
        onSaved={() => {
          // Optional: refresh calculations or show success toast
          queryClient.invalidateQueries({ queryKey: ["pharmaceutical-stock"] });
        }}
      />

      {/* ... existing Kalkulasi Langsung section */}
    </Box>
  );
}
```

**Why not Tabs?** Single-page workflow: user enters growth metrics AND pharmaceutical usage on same day. Tabs would hide data. A vertical stack is clearer; both sections independently save.

**Date synchronization:** Pharmaceutical section's date defaults to recording date from main form; user can override if needed.

## Common Pitfalls

### Pitfall 1: Decimal Precision Loss in JavaScript

**What goes wrong:** Using `parseFloat` + arithmetic on DECIMAL values can introduce rounding errors. Example: `0.1 + 0.2 !== 0.3`. Storing such results back to DB causes mismatch.

**Why it happens:** JavaScript uses binary floating point (IEEE 754). DECIMAL(10,3) requires exact 3 decimal places.

**How to avoid:**

- Use Drizzle's `sql` template for in-DB arithmetic: `sql`${table.col} + ${value}``.
- When parsing for validation/comparison only, use `parseFloat` and round to 3 decimals with `toFixed(3)` before comparison or storage.
- Convert JS numbers to strings before inserting: `quantity.toString()`.
- Drizzle infers DECIMAL as `string` in TypeScript — treat those fields as strings everywhere except UI input (where numbers are parsed).

**Warning signs:** Failing test where `0.001 + 0.002` equals `0.0030000000000000004`. Fix: convert to integer thousandths (multiply by 1000, use integer math, divide back).

### Pitfall 2: Race Condition in Stock Deduction

**What goes wrong:** Two simultaneous consumption requests both read `closingStock = 100`, both deduct 50, both succeed → final `closingStock = 0` instead of `-50` invalid; overconsumption.

**Why it happens:** SELECT → compute → UPDATE pattern without locking. Transaction isolation READ COMMITTED allows non-repeatable reads.

**How to avoid:** `SELECT ... FOR UPDATE` locks the stock row until transaction commit. Pattern from `recordFeedConsumption` (line 511):

```typescript
const stockRows = await tx.select().from(feedStockTable)
  .where(...)
  .for('update') // ← locks row
  .limit(1)
```

Same pattern for batch rows when iterating? Ideally lock all affected batch rows first in a deterministic order (by `id ASC` or `expiryDate ASC`) to avoid deadlocks. Easiest: lock batches by ordering: `SELECT ... FROM batches WHERE id IN (...) ORDER BY expiryDate ASC FOR UPDATE`.

**Warning signs:** Stress test exposing negative stock when concurrent requests hit same plasma+item. Add `FOR UPDATE` to batch SELECT.

### Pitfall 3: Expiry Date Timezone Confusion

**What goes wrong:** Server in UTC, business logic expects Asia/Jakarta (UTC+7). Comparing `expiryDate < today` off by one day if server date is still UTC midnight.

**Why:** MySQL DATE has no timezone; application interprets it as local. If server runs UTC, `new Date().toISOString().split('T')[0]` returns UTC date, which may be 7 hours behind Jakarta date after 17:00 UTC.

**How to avoid:**

- Use server's local time consistently. If server runs in Jakarta timezone (Asia/Jakarta), fine.
- Safer: convert to target timezone before comparison:

```typescript
const jakartaNow = new Date().toLocaleString("en-US", {
  timeZone: "Asia/Jakarta",
});
const today = jakartaNow.split(" ")[0]; // YYYY-MM-DD
```

- Or store all dates in UTC and convert at boundary. For expiry, usually just calendar date, no time — so using server local date is acceptable if server timezone is set.

**Check:** Confirm server timezone. If not Jakarta, apply `timeZone` option.

### Pitfall 4: Supplier Category Mismatch After Link

**What goes wrong:** User creates pharmaceutical with supplier that is category='feed'. The FK allows it, but business rule says only vitamin/medicine suppliers.

**Why:** DB FK only checks existence, not category.

**How to avoid:** Service-level check as described in Business Logic section. Throw `SupplierCategoryMismatchError` with HTTP 409.

**Warning signs:** Reports show feed suppliers appearing in pharma dropdown. Fix: filter supplier query to `category IN ('vitamin', 'medicine')` AND service validation.

### Pitfall 5: Batch Deletion Allowed After Partial Consumption

**What goes wrong:** User consumes 50% of batch B1, then deletes batch B1 → removes traceability; remaining batch quantity becomes orphaned.

**Why:** No guard on batch delete.

**How to avoid:** Disallow delete if `remainingQty < receivedQty` (i.e., any consumption occurred). Or soft-delete only with `deletedAt` and keep rows. Per CONTEXT: batches are editable only while unused. Implement check:

```typescript
if (batch.remainingQty < batch.receivedQty) {
  throw new BatchInUseError(batch.id);
}
```

For hard delete, same condition; for soft delete, could allow but should still guard.

### Pitfall 6: Negative Stock from Concurrent Multibatch Consumption

**What goes wrong:** Two users simultaneously consume from same item, different batches, each checks batches individually but total exceeds stock. Individual batch checks pass, aggregate exceeds available.

**Why:** Validation checks per-batch sufficiency and overall stock separately; without locking stock row, aggregate may change between check and update.

**How to avoid:** Lock stock row with `FOR UPDATE` BEFORE aggregating total requested. The `recordFeedConsumption` pattern does this: fetch stock with `for('update')` THEN calculate new closing, check negative, then update. Apply same: fetch stock first with lock, then fetch/lock batches, then validate sum of batch quantities ≤ `(opening + totalIn - totalOut)`, then proceed.

### Pitfall 7: Missing UnitOfMeasure Validation

**What goes wrong:** User enters unit "kg" for a medicine that is dosed in "ml" — later confusion.

**Why:** Free-text unit field allows arbitrary values.

**How to avoid:** Restrict to predefined list in production: enum or `Check` constraint in DB. For Phase 19, keep as varchar(50) but provide dropdown in UI with common options: `['tablet', 'capsule', 'ml', 'cc', 'g', 'IU', 'sachet', 'vial']`. Service can validate against allowed list constant.

### Pitfall 8: Soft Delete of Items Misaligns with Batch Listing

**What goes wrong:** Item soft-deleted but batches still present, still appear in batch dropdowns (contradiction — user shouldn't issue from inactive item).

**How to avoid:** All item queries filter `deletedAt IS NULL`; batch listings join items and filter `items.isActive = 1` and `items.deletedAt IS NULL`. In batch creation endpoint, also validate item `isActive = 1` and `deletedAt IS NULL`.

---

## Validation Rules

### Service-Level Validation Summary

**Create Pharmaceutical Item:**

1. Tenant isolation via `tenantId`
2. Code uniqueness: `SELECT ... WHERE tenantId AND code AND deletedAt IS NULL` → duplicate → `DuplicatePharmaceuticalCodeError`
3. If `supplierId` provided: supplier exists + belongs to tenant + category ∈ {vitamin, medicine} else `SupplierCategoryMismatchError`
4. Insert with `isActive: 1`

**Update Pharmaceutical Item:**

1. Item exists + tenant + not deleted
2. If `code` changed → duplicate check (excluding self)
3. If `supplierId` changed → validate category
4. Audit oldValue → update

**Toggle/Delete:**

1. Toggle flips `isActive`
2. Delete (soft) pre-check: query `pharmaceutical_stock` and `pharmaceutical_batches` for any referencing rows. If any found → `PharmaceuticalInUseError`
3. Else: set `deletedAt = NOW()`, `isActive = 0`

**Create Batch:**

1. Item exists + active + not deleted
2. Batch number unique per item (tenant via item)
3. `expiryDate` is valid date ≥ today (optional: warn if < 1 year)
4. `receivedQty > 0`
5. Transaction: insert batch + upsert stock

**Record Usage (Consumption):**

1. `cycleId` exists + active + belongs to tenant
2. `plasmaId` exists + belongs to tenant
3. `itemId` exists + active + not deleted
4. `batchQuantities` non-empty, each:
   - batchId exists + belongs to item
   - `expiryDate >= today`
   - `remainingQty >= requested quantity`
5. Aggregate quantity ≤ `(openingStock + totalIn - totalOut)` from locked stock row
6. Transaction: decrement batches, update stock, audit

**Errors (custom classes recommended):**

```typescript
export class DuplicatePharmaceuticalCodeError extends Error
export class SupplierCategoryMismatchError extends Error
export class PharmaceuticalNotFoundError extends Error
export class PharmaceuticalInUseError extends Error
export class BatchNotFoundError extends Error
export class BatchExpiredError extends Error
export class BatchInUseError extends Error // for delete protection
export class InsufficientBatchStockError extends Error
export class InsufficientPharmaceuticalStockError extends Error
export class NegativeStockError extends Error // reuse from feed.errors?
```

**HTTP status codes:**

- 400 — validation failures, insufficient stock, expired batch
- 404 — not found
- 409 — duplicate code, category mismatch, batch in use
- 403 — RBAC deny

---

## Code Examples

### Example 1: Drizzle Schema for vitamins_medicines

_(Adapted from `feed_brands.ts` + CONTEXT D-02)_

```typescript
import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  index,
  unique,
} from "drizzle-orm/mysql-core";
import { tenants } from "./tenants";
import { suppliers } from "./suppliers";

export const vitaminsMedicines = mysqlTable(
  "vitamins_medicines",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 20 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    category: varchar("category", { length: 20 }).notNull(),
    unitOfMeasure: varchar("unit_of_measure", { length: 50 }).notNull(),
    manufacturer: varchar("manufacturer", { length: 100 }),
    strength: varchar("strength", { length: 50 }),
    phone: varchar("phone", { length: 20 }),
    supplierId: int("supplier_id").references(() => suppliers.id, {
      onDelete: "set null",
    }),
    isActive: int("is_active").default(1),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    uqPharmaCode: unique("uq_vitamins_medicines_code").on(
      table.tenantId,
      table.code,
    ),
    idxPharmaTenant: index("idx_vitamins_medicines_tenant").on(table.tenantId),
    idxPharmaCategory: index("idx_vitamins_medicines_category").on(
      table.category,
    ),
  }),
);
```

### Example 2: Service Function — recordPharmaceuticalUsage (skeleton)

_(Adapted from `feed.service.ts` recordFeedConsumption; adds multi-batch FIFO)_

```typescript
import { db } from "../../config/database";
import {
  vitaminsMedicines,
  pharmaceuticalStock,
  pharmaceuticalBatches,
  auditLogs,
  plasmas,
  units,
} from "../../db/schema";
import { eq, and, isNull, sql, desc, gte, inArray } from "drizzle-orm";
import {
  PharmaceuticalNotFoundError,
  BatchNotFoundError,
  BatchExpiredError,
  InsufficientBatchStockError,
  InsufficientPharmaceuticalStockError,
} from "./errors";

export async function recordPharmaceuticalUsage(
  input: {
    cycleId: number;
    plasmaId: number;
    itemId: number;
    batchQuantities: { batchId: number; quantity: number }[];
    date: string; // YYYY-MM-DD
    note?: string;
  },
  tenantId: number,
  userId: string,
) {
  // 1. Validate plasma belongs to tenant
  await verifyPlasmaInTenant(input.plasmaId, tenantId);

  // 2. Validate cycle is active
  const cycle = await getCycle(input.cycleId, tenantId);
  if (!cycle || cycle.status !== "active") throw new CycleNotActiveError();

  // 3. Begin transaction
  return db.transaction(async (tx) => {
    // 4. Fetch item (must exist + active + not deleted)
    const itemRows = await tx
      .select()
      .from(vitaminsMedicines)
      .where(
        and(
          eq(vitaminsMedicines.id, input.itemId),
          eq(vitaminsMedicines.tenantId, tenantId),
          eq(vitaminsMedicines.isActive, 1),
          isNull(vitaminsMedicines.deletedAt),
        ),
      )
      .limit(1);

    if (itemRows.length === 0)
      throw new PharmaceuticalNotFoundError(input.itemId);

    // 5. Fetch all batches in one query, locked
    const batchIds = input.batchQuantities.map((b) => b.batchId);
    const today = new Date().toISOString().split("T")[0];

    const batches = await tx
      .select()
      .from(pharmaceuticalBatches)
      .where(
        and(
          eq(pharmaceuticalBatches.itemId, input.itemId),
          inArray(pharmaceuticalBatches.id, batchIds),
          gte(pharmaceuticalBatches.expiryDate, today),
          gt(pharmaceuticalBatches.remainingQty, 0),
        ),
      )
      .orderBy(asc(pharmaceuticalBatches.expiryDate)) // FIFO
      .for("update"); // lock rows

    // 6. Map batches by ID for quick lookup
    const batchMap = new Map(batches.map((b) => [b.id, b]));

    // 7. Validate each requested batch exists & sufficient
    let totalRequested = 0;
    for (const bq of input.batchQuantities) {
      const batch = batchMap.get(bq.batchId);
      if (!batch) throw new BatchNotFoundError(bq.batchId);
      if (parseFloat(batch.remainingQty) < bq.quantity) {
        throw new InsufficientBatchStockError(
          batch.batchNumber,
          parseFloat(batch.remainingQty).toFixed(3),
          bq.quantity.toFixed(3),
        );
      }
      totalRequested += bq.quantity;
    }

    // 8. Lock stock row (FOR UPDATE)
    const stockRows = await tx
      .select()
      .from(pharmaceuticalStock)
      .where(
        and(
          eq(pharmaceuticalStock.plasmaId, input.plasmaId),
          eq(pharmaceuticalStock.itemId, input.itemId),
        ),
      )
      .for("update")
      .limit(1);

    if (stockRows.length === 0) {
      throw new PharmaceuticalStockNotFoundError(input.plasmaId, input.itemId);
    }

    const stock = stockRows[0];
    const opening = parseFloat(stock.openingStock) || 0;
    const totalIn = parseFloat(stock.totalIn) || 0;
    const totalOut = parseFloat(stock.totalOut) || 0;
    const newTotalOut = totalOut + totalRequested;
    const closing = opening + totalIn - newTotalOut;

    if (closing < 0) {
      throw new InsufficientPharmaceuticalStockError(
        (opening + totalIn - totalOut).toFixed(3),
        totalRequested.toFixed(3),
      );
    }

    // 9. Update batches: decrement remainingQty for each
    for (const bq of input.batchQuantities) {
      const batch = batchMap.get(bq.batchId);
      const newRemaining = (
        parseFloat(batch.remainingQty) - bq.quantity
      ).toFixed(3);
      await tx
        .update(pharmaceuticalBatches)
        .set({ remainingQty: newRemaining, updatedAt: new Date() })
        .where(eq(pharmaceuticalBatches.id, bq.batchId));
    }

    // 10. Update stock atomically
    await tx
      .update(pharmaceuticalStock)
      .set({
        totalOut: sql`${pharmaceuticalStock.totalOut} + ${totalRequested}`,
        closingStock: sql`${pharmaceuticalStock.closingStock} - ${totalRequested}`,
        lastUpdatedAt: new Date(),
      })
      .where(eq(pharmaceuticalStock.id, stock.id));

    // 11. Audit
    try {
      await tx.insert(auditLogs).values({
        userId,
        action: "consume",
        resource: "pharmaceutical_stock",
        resourceId: String(stock.id),
        newValue: JSON.stringify({
          plasmaId: input.plasmaId,
          itemId: input.itemId,
          itemName: itemRows[0].name,
          batchQuantities: input.batchQuantities,
          totalQty: totalRequested.toFixed(3),
          closingStock: closing.toFixed(3),
        }),
      });
    } catch {}

    // 12. Return
    return {
      success: true,
      consumption: {
        plasmaId: input.plasmaId,
        itemId: input.itemId,
        totalQty: totalRequested.toFixed(3),
        closingStock: closing.toFixed(3),
      },
    };
  });
}
```

### Example 3: Controller Endpoint — pharmaceuticals.controller.ts (partial)

```typescript
import { Elysia, t } from "elysia";
import { requirePermission } from "../../plugins/rbac";
import { getTenantId } from "../../plugins/tenant";
import * as pharmaService from "./pharmaceuticals.service";
import {
  DuplicatePharmaceuticalCodeError,
  SupplierCategoryMismatchError,
} from "./errors";

export const pharmaceuticalsController = new Elysia({ prefix: "/api" })
  .onError(({ error, set }) => {
    if (error instanceof DuplicatePharmaceuticalCodeError) {
      set.status = 409;
      return { error: error.message, code: "DUPLICATE_PHARMA_CODE" };
    }
    if (error instanceof SupplierCategoryMismatchError) {
      set.status = 409;
      return { error: error.message, code: "SUPPLIER_CATEGORY_MISMATCH" };
    }
    // ... others
    if (error instanceof Error && error.message === "MISSING_USER_ID") {
      set.status = 401;
      return { error: "Authentication required", code: "MISSING_USER_ID" };
    }
  })

  // Vitamins/Medicines CRUD
  .get(
    "/vitamins-medicines",
    async (ctx) => {
      const tenantId = getTenantId(ctx);
      const category = ctx.query.category as string | undefined;
      const items = await pharmaService.listPharmaceuticals(tenantId, {
        category,
      });
      return { items };
    },
    {
      beforeHandle: requirePermission("pharmaceuticals.read"),
      query: t.Object({ category: t.Optional(t.String()) }),
    },
  )

  .post(
    "/vitamins-medicines",
    async (ctx) => {
      const tenantId = getTenantId(ctx);
      if (!ctx.user) throw new Error("MISSING_USER_ID");
      const item = await pharmaService.createPharmaceutical(
        ctx.body,
        tenantId,
        ctx.user.id,
      );
      return { success: true, item };
    },
    {
      beforeHandle: requirePermission("pharmaceuticals.create"),
      body: t.Object({
        code: t.String({ minLength: 1, maxLength: 20 }),
        name: t.String({ minLength: 1, maxLength: 100 }),
        category: t.Union([t.Literal("vitamin"), t.Literal("medicine")]),
        unitOfMeasure: t.String({ minLength: 1, maxLength: 50 }),
        manufacturer: t.Optional(t.String({ maxLength: 100 })),
        strength: t.Optional(t.String({ maxLength: 50 })),
        phone: t.Optional(t.String({ maxLength: 20 })),
        supplierId: t.Optional(t.Number({ min: 1 })),
      }),
    },
  )

  // ... PUT, PUT /:id/toggle, DELETE /:id

  // Usage recording
  .post(
    "/pharmaceutical-usage",
    async (ctx) => {
      const tenantId = getTenantId(ctx);
      if (!ctx.user) throw new Error("MISSING_USER_ID");
      const result = await pharmaService.recordPharmaceuticalUsage(
        ctx.body,
        tenantId,
        ctx.user.id,
      );
      return result;
    },
    {
      beforeHandle: requirePermission("pharmaceuticals.create"),
      body: t.Object({
        cycleId: t.Number({ min: 1 }),
        plasmaId: t.Number({ min: 1 }),
        itemId: t.Number({ min: 1 }),
        batchQuantities: t.Array(
          t
            .Object({
              batchId: t.Number({ min: 1 }),
              quantity: t.Number({ min: 0.001 }),
            })
            .min(1),
        ),
        date: t.String({ format: "date" }),
        note: t.Optional(t.String()),
      }),
    },
  );
```

### Example 4: API Client — client/src/api/pharmaceuticals.ts

```typescript
import { apiClient } from "./client";

export interface Pharmaceutical {
  id: number;
  tenantId: number;
  code: string;
  name: string;
  category: "vitamin" | "medicine";
  unitOfMeasure: string;
  manufacturer: string | null;
  strength: string | null;
  phone: string | null;
  supplierId: number | null;
  supplierName?: string | null;
  isActive: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PharmaceuticalBatch {
  id: number;
  tenantId: number;
  itemId: number;
  itemName?: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  receivedQty: string; // DECIMAL as string
  remainingQty: string;
  createdAt: string;
  updatedAt: string;
}

export interface PharmaceuticalStockItem {
  id: number;
  plasmaId: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  category: string;
  unitOfMeasure: string;
  openingStock: string;
  totalIn: string;
  totalOut: string;
  closingStock: string;
  lastUpdatedAt: string;
}

export interface UsagePayload {
  cycleId: number;
  plasmaId: number;
  itemId: number;
  batchQuantities: { batchId: number; quantity: number }[];
  date: string;
  note?: string;
}

export function listPharmaceuticals(params: {
  tenantId: number;
  category?: string;
  isActive?: boolean;
}): Promise<{ items: Pharmaceutical[] }>;
export function getPharmaceutical(
  id: number,
  tenantId: number,
): Promise<Pharmaceutical>;
export function createPharmaceutical(
  tenantId: number,
  data: Omit<
    Pharmaceutical,
    "tenantId" | "isActive" | "deletedAt" | "createdAt" | "updatedAt"
  >,
): Promise<Pharmaceutical>;
export function updatePharmaceutical(
  id: number,
  tenantId: number,
  data: Partial<Pharmaceutical>,
): Promise<{ success: boolean }>;
export function togglePharmaceutical(
  id: number,
  tenantId: number,
): Promise<{ success: boolean; isActive: number }>;
export function deletePharmaceutical(
  id: number,
  tenantId: number,
): Promise<{ success: boolean }>;

export function listPharmaceuticalStock(params: {
  tenantId: number;
  plasmaId?: number;
  itemId?: number;
  category?: string;
}): Promise<{ stocks: PharmaceuticalStockItem[] }>;
export function listPharmaceuticalBatches(params: {
  itemId: number;
}): Promise<{ batches: PharmaceuticalBatch[] }>;
export function createPharmaceuticalBatch(data: {
  itemId: number;
  batchNumber: string;
  expiryDate: string;
  receivedQty: number;
}): Promise<{ success: true; batch: PharmaceuticalBatch }>;

export function recordPharmaceuticalUsage(data: UsagePayload): Promise<{
  success: true;
  consumption: {
    plasmaId: number;
    itemId: number;
    totalQty: string;
    closingStock: string;
  };
}>;
```

**Implementation notes:**

- Use `apiClient` from `./client`
- Build query strings with `URLSearchParams` for list endpoints
- Numbers → JSON as-is (number type); Drizzle service converts to string via `toString()` or `sql` arithmetic
- Error handling via `ApiError` from client

---

## State of the Art

| Old Approach                       | Current Approach                     | When Changed          | Impact                                |
| ---------------------------------- | ------------------------------------ | --------------------- | ------------------------------------- |
| Float for quantities               | DECIMAL(10,3) stored as strings      | Initial project setup | Precise inventory, no rounding errors |
| Inline validation in controllers   | Service layer + custom error classes | Phase 17-18           | Separation of concerns, testable      |
| Pagination off (all rows)          | Still all rows for small datasets    | Current               | Simple; optimize later if needed      |
| Separate vitamin & medicine tables | Unified table with category enum     | Phase 19 decision     | Simpler queries, shared fields        |

---

## Assumptions Log

**No assumptions flagged** — all findings are verified from the codebase or official documentation:

- Drizzle decimal usage patterns from `feed_stock.ts` and `feed.service.ts` [VERIFIED: source code]
- Elysia controller patterns from `suppliers.controller.ts` and `feed.controller.ts` [VERIFIED: source code]
- TanStack Query hooks from `FeedBrands.tsx`, `Suppliers.tsx` [VERIFIED: source code]
- MUI component patterns from referenced pages [VERIFIED: source code]
- MySQL DECIMAL handling as strings in Drizzle [CITED: drizzle-orm GitHub issue #1026, #1950]
- Current library versions from `package.json` files [VERIFIED: package.json]

---

## Open Questions

1. **Batch-specific usage history table?** Not in scope for Phase 19, but future phase may need traceability (which recording used which batches). Recommendation: add separate `pharmaceutical_usage_details` table linking usage event to batches with quantities; `pharmaceutical_usage` header for date/cycle/plasma. For now, audit log captures JSON but not queryable.

2. **Unit cost tracking deferred — should batches store unit cost?** CONTEXT says cost tracking deferred. Batches only store quantity, not cost.

3. **Expiry alert threshold** — not in scope. Future: configurable days-before-expiry warning.

---

## Environment Availability

**No external system dependencies** beyond existing MySQL database. Stack is fully contained.

| Dependency               | Required By     | Available              | Version | Fallback |
| ------------------------ | --------------- | ---------------------- | ------- | -------- |
| MySQL                    | All persistence | ✓ (via docker-compose) | 8.x     | —        |
| Redis                    | Sessions        | ✓                      | 7.x     | —        |
| Bun                      | Server runtime  | ✓                      | 1.2+    | —        |
| Node-compatible browsers | Frontend        | ✓                      | modern  | —        |

---

## Validation Architecture

**Note:** `.planning/config.json` does not have `workflow.nyquist_validation` set to `false`; treating as **enabled**.

### Test Framework

| Property            | Value                                     |
| ------------------- | ----------------------------------------- |
| Framework           | Vitest (server + client)                  |
| Config file         | `vitest.config.ts` at server/ and client/ |
| Server test command | `bun run --cwd server test`               |
| Client test command | `bun run --cwd client test`               |
| Full suite          | `npm test`                                |

### Phase Requirements → Test Map

| Req ID          | Behavior                                                 | Test Type   | Automated Command                                                           | File Exists? |
| --------------- | -------------------------------------------------------- | ----------- | --------------------------------------------------------------------------- | ------------ |
| PHARMA-CRUD     | Create/Read/Update/Delete/SoftDelete items               | unit        | `vitest server/src/modules/pharmaceuticals/pharmaceuticals.service.test.ts` | ❌ Wave 0    |
| STOCK-UPDATE    | Stock row created on first batch receipt                 | unit        | `vitest server/src/modules/pharmaceuticals/pharmaceuticals.service.test.ts` | ❌ Wave 0    |
| BATCH-FIFO      | Consumption deducts from oldest batch first              | unit        | `vitest ...`                                                                | ❌ Wave 0    |
| USAGE-CONS      | recordPharmaceuticalUsage validates & updates atomically | integration | `vitest ...`                                                                | ❌ Wave 0    |
| PERMISSION-RBAC | endpoints enforce `pharmaceuticals.*` permissions        | integration | `vitest ...`                                                                | ❌ Wave 0    |

### Wave 0 Gaps

- [ ] `server/src/modules/pharmaceuticals/pharmaceuticals.service.test.ts` — covers PHARMA-CRUD, STOCK-UPDATE, BATCH-FIFO, USAGE-CONS
- [ ] `server/src/modules/pharmaceuticals/pharmaceuticals.controller.test.ts` — covers endpoint validation & RBAC
- [ ] `client/src/pages/pharmaceuticals/VitaminsMedicines.test.tsx` — renders table, modal, toggle
- [ ] `client/src/pages/recordings/DailyRecording.test.tsx` — extend to cover pharmaceutical section (new tab/panel)

### Sampling Rate

- **Per task commit:** Server unit tests on changed service functions (`vitest path/to/test.ts -t "test name"`), client component tests for changed components
- **Per wave merge:** Full Vitest suite for server + client
- **Phase gate:** Ensure all new tests pass before `/gsd-verify-work`

---

## Security Domain

**Requirement:** `security_enforcement` enabled (default in config). Include ASVS categories.

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                 |
| --------------------- | ------- | ---------------------------------------------------------------- |
| V2 Authentication     | Yes     | Session cookie via Lucia + Redis                                 |
| V3 Session Management | Yes     | Redis-backed sessions; JWT+CSRF                                  |
| V4 Access Control     | Yes     | RBAC via `requirePermission` plugin                              |
| V5 Input Validation   | Yes     | Zod schemas in controllers + service checks                      |
| V6 Cryptography       | No      | No crypto in this phase                                          |
| V7 Error Handling     | Yes     | Custom error classes mapped to HTTP codes; no PII leaks          |
| V9 Data Protection    | Yes     | Tenant isolation enforced via `getTenantId` and `WHERE tenantId` |
| V10 Communication     | No      | No new external comms                                            |

### Known Threat Patterns for Stack

| Pattern                                 | STRIDE                 | Standard Mitigation                                                                            |
| --------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------- |
| SQL Injection                           | Tampering              | Drizzle parameterized queries (all user input as bound params)                                 |
| Broken Access Control                   | Elevation of Privilege | RBAC + tenantId derivation + every query filters by tenantId                                   |
| Race Condition on Stock                 | Tampering              | `SELECT ... FOR UPDATE` within transaction                                                     |
| IDOR (Insecure Direct Object Reference) | Information Disclosure | Every fetch includes tenantId check; `getXXX` functions verify tenant ownership                |
| Mass Assignment                         | Tampering              | Zod schemas in controllers explicitly enumerate allowed fields; service uses only those fields |

---

## Confidence Assessment

| Area                  | Level | Reason                                                                                                            |
| --------------------- | ----- | ----------------------------------------------------------------------------------------------------------------- |
| Standard Stack        | HIGH  | All libraries already in use; no new dependencies                                                                 |
| Architecture Patterns | HIGH  | Mirror existing feed/supplier modules; proven patterns                                                            |
| Schema Design         | HIGH  | Drizzle patterns verified from `feed_stock.ts` and `suppliers.ts`                                                 |
| API Contract          | HIGH  | Derived from existing controllers (`feed.controller.ts`, `suppliers.controller.ts`)                               |
| Business Logic (FIFO) | HIGH  | Algorithm straightforward; similar to batch-based fulfillment patterns; validated against SQL FIFO best practices |
| Frontend Components   | HIGH  | Patterns directly copied from `FeedBrands.tsx`, `FeedProductModal.tsx`, `DailyRecording.tsx`                      |
| Pitfalls              | HIGH  | Identified from codebase (decimal handling, locking, tenant isolation)                                            |
| Validation Rules      | HIGH  | Consistent with existing service-layer validation in `feed.service.ts` and `suppliers.service.ts`                 |

**Research date:** 2026-04-21  
**Valid until:** 2026-05-21 (30 days for stable stack)
