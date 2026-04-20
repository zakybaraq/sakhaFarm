# Phase 19: Vitamins/Medicines Management - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Add inventory management for vitamins and medicines used in farm operations. This includes:

- Single unified `vitamins_medicines` table (category='vitamin' | 'medicine') with full CRUD
- `pharmaceutical_stock` table — per-plasma inventory tracking (opening/in/out/closing balances)
- `pharmaceutical_batches` table — batch numbers, expiry dates, and received quantities; issuing decrements from batches (FIFO/FEFO-compatible)
- New "Vitamins/Medicines" CRUD page (minimal table layout)
- New section on Daily Recording page to record pharmaceutical consumption per cycle
- Full CRUD including create/edit/toggle/soft delete; audit logging on all mutations

New capabilities only — Phase 20 handles sidebar reorganization; no reporting/batch-specific UI beyond stock tracking is in scope.

</domain>

<decisions>
## Implementation Decisions

### Entity Model

- **D-01:** Use single unified `vitamins_medicines` table with `category` enum field (`'vitamin'`, `'medicine'`), not separate tables
- **D-02:** Item schema fields: `id`, `tenantId`, `code` (varchar 20, unique per tenant), `name` (varchar 100), `unitOfMeasure` (varchar 50), `manufacturer` (varchar 100, nullable), `strength` (varchar 50, nullable), `phone` (varchar 20, nullable — contact number), `supplierId` (int FK → `suppliers.id`, nullable), `isActive` (int default 1), `deletedAt`, `createdAt`, `updatedAt`
- **D-03:** `supplierId` FK optional but allowed; supplier must have category `'vitamin'` or `'medicine'` (validated in service layer); supplier filter dropdown in item form shows only relevant categories
- **D-04:** Soft delete guard: prevent hard delete if `supplierId` references exist in `pharmaceutical_stock` or `pharmaceutical_batches` (like Feed Brands pattern)

### Inventory & Batch Tracking

- **D-05:** Separate `pharmaceutical_stock` table (like `feed_stock`): `id`, `plasmaId` (FK), `itemId` (FK → `vitamins_medicines.id`), `openingStock`, `totalIn`, `totalOut`, `closingStock` (all DECIMAL(10,3)), unique constraint on (plasmaId, itemId), soft-delete not applicable (child of item lifecycle)
- **D-06:** Separate `pharmaceutical_batches` table: `id`, `tenantId`, `itemId` (FK), `batchNumber` (varchar), `expiryDate` (date), `receivedQty` (DECIMAL(10,3)), `remainingQty` (DECIMAL(10,3)), `createdAt`, `updatedAt`; unique on (itemId, batchNumber) for tenant; `remainingQty` is decremented when stock is issued
- **D-07:** Issue/consumption logic: decrement `pharmaceutical_stock` (totalOut/closingStock) AND decrement `pharmaceutical_batches.remainingQty` from the oldest non-empty batches (FIFO) until required quantity satisfied; reject if insufficient batch stock

### Backend Module

- **D-08:** New `server/src/modules/pharmaceuticals/` module: controller, service, schema, errors
- **D-09:** Endpoints (tenant-scoped, RBAC):
  - `GET /api/vitamins-medicines` (list with optional category filter), `POST`, `PUT /:id`, `PUT /:id/toggle`, `DELETE /:id` (soft)
  - `GET /api/pharmaceutical-stock` (list per plasma or all), optionally filtered by item/category
  - `GET /api/pharmaceutical-batches` (list by item), `POST`, `PUT /:id`, `DELETE /:id` (batch CRUD — batches editable only while unused)
- **D-10:** Follow same controller/service pattern as `feed-brands` and `suppliers` (single-service functions, transaction blocks for multi-table writes, audit logging on all mutations)
- **D-11:** Use Drizzle `db.transaction()` for consumption recording (update stock + decrement batches + audit in single atomic transaction)

### Frontend Page

- **D-12:** New page `client/src/pages/pharmaceuticals/VitaminsMedicines.tsx` — minimal table, similar to `FeedBrands.tsx`: columns include Code, Name, Category, Unit, Status, Actions
- **D-13:** Create/Edit modal: fields — code, name, category dropdown (vitamin/medicine), unitOfMeasure dropdown/input, manufacturer (text), strength (text), phone, supplierId (autocomplete filtered to vitamin/medicine suppliers)
- **D-14:** Toggle active via Switch column; soft delete confirms before hard (cascade blocked if referenced)
- **D-15:** Add API client functions in `client/src/api/pharmaceuticals.ts` (mirroring `suppliers.ts` and `feed.ts` structure)

### Daily Recording Integration

- **D-16:** Extend Daily Recording page: add a new "Pharmaceutical Usage" section/tab below the feed/other sections
- **D-17:** Fields: plasma (autocomplete from listPlasmas), item (autocomplete from listVitaminsMedicines filtered by category), batch (autocomplete filtered by selected item), quantity, date (default = today), note (optional)
- **D-18:** On save: call new pharmaceutical usage API endpoint (`POST /api/pharmaceutical-usage`) that performs stock deduction in a transaction; on success, refresh stock display inline

### the agent's Discretion

- Exact order of columns in the table
- Unit of measure options list (vet-validated — medicine units vs feed units differ)
- Batch selection UI (dropdown of available batches with qty/expiry display)
- Empty-state messaging and illustrative icons
- Whether to show total stock value (unitCost × qty) — cost tracking deferred to later phase

### Folded Todos

No pending todos matched Phase 19 scope.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pattern References (Backend)

- `server/src/db/schema/feed_stock.ts` — stock table pattern to replicate for `pharmaceutical_stock`
- `server/src/db/schema/feed_brands.ts` — master data schema pattern (tenantId, isActive, deletedAt, timestamps, unique tenant+code)
- `server/src/modules/suppliers/suppliers.controller.ts` — CRUD controller pattern with category enum filtering
- `server/src/modules/feed-brands/feed-brands.service.ts` — service layer pattern: create/list/get/update/toggle/delete with transaction-based writes and audit logging
- `server/src/modules/feed/feed.controller.ts` — general CRUD endpoint structure

### Pattern References (Frontend)

- `client/src/pages/suppliers/Suppliers.tsx` — minimal CRUD page pattern (ResponsiveTable, modal, toggle, delete)
- `client/src/pages/feed/FeedBrands.tsx` — master data table pattern with category-like display
- `client/src/pages/feed/FeedProducts.tsx` — autocomplete dropdown from parent tables
- `client/src/pages/recordings/DailyRecording.tsx` — existing recording form structure to extend with pharmaceutical section

### API Client Pattern

- `client/src/api/suppliers.ts` — API client structure (list/create/update/delete/toggle, typed interfaces)
- `client/src/api/feed.ts` — listFeedProducts pattern; shows how to compose params

### Schema Migration References

- `server/src/db/schema/suppliers.ts` — supplier FK definition; supplierId `int` nullable with cascade on tenant
- `server/src/db/schema/feed_surat_jalan.ts` — example of FK addition; pattern for adding supplierId to other tables

### Authentication & Multi-Tenancy

- `client/src/contexts/AuthContext.tsx` — `useAuth().user.tenantId` usage pattern
- `server/src/plugins/tenant.ts` — `getTenantId()` middleware — used on all new endpoints

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `ResponsiveTable` + `ColumnDef` — used by all list pages; reuse for Pharmaceuticals table
- `useAuth().user.tenantId` — pass to all list API calls
- `Switch` MUI component for isActive toggle
- Autocomplete components from MUI (used in Feed Products modal for type/brand selection) — reuse for supplier and batch selection
- Modal pattern (FeedBrandModal, SupplierModal) — duplicate and adapt

### Established Patterns

- Master data CRUD: controller → service → schema trio, all tenant-scoped, soft delete + isActive toggle, audit logging inside transactions
- All tables: tenantId (not null), unique (tenantId, code), indexes on tenantId, isActive default 1, timestamps, soft delete via deletedAt
- List endpoints accept optional `category` filter when applicable (Suppliers controller shows pattern)
- TanStack Query: `useQuery` with `queryKey: ['entity', tenantId]`, `useMutation` with `onSuccess: queryClient.invalidateQueries({ queryKey: ['entity'] })`
- Error handling: custom error classes, snackbar toast notifications (success/error)
- API client: one file per domain in `client/src/api/`, typed interfaces, consistent naming

### Integration Points

- `Suppliers` category field already includes `vitamin` and `medicine` — new items supplierId FK will link to `suppliers` records with those categories
- New `pharmaceutical_stock` table integrates like `feed_stock`; inventory view table could be built similar to `FeedStock.tsx` if needed
- New `pharmaceutical_batches` table mirrors conceptual structure of `feed_movements` batch-wise but simpler
- Daily Recording page (`recordings/DailyRecording.tsx`) will be extended — currently handles daily recording for mortality, BW, feed; pharmaceutical section will be a sibling component within the same page

</code_context>

<specifics>
## Specific Ideas

- Single page for both item types (category tabs or combined table) — determined by D-01
- FIFO/FEFO batch issue: always consume from oldest expiry first (within FIFO), check expiry before issuing (reject expired batches)
- Item `phone` field: store supplier contact number for convenience (separate from FK supplier.phone)
- Soft delete guard: if an item is referenced in `pharmaceutical_stock` or `pharmaceutical_batches`, soft-delete it (set deletedAt) rather than allowing hard delete; return friendly error message explaining references exist
- API naming: endpoints use hyphenated path `/vitamins-medicines` consistent with `/feed-types` and `/feed-brands` style

</specifics>

<deferred>
## Deferred Ideas

- Full inventory management page (separate from item CRUD) — stock balances per plasma per item with adjustments UI; keep on backlog (could be standalone phase)
- Expiry alert dashboard widget — highlight items expiring within 30/60 days; not in this phase
- Batch-level usage history and traceability report — future enhancement
- Unit cost tracking and inventory valuation — not in scope; only quantities tracked
- Barcode/QR scanning integration for batch selection — future consideration
- Supplier-specific pricing or purchase-order linkage — separate phase

### Reviewed Todos (not folded)

None — no matched todos found in cross-reference.

</deferred>

---

_Phase: 19-vitamins-medicines-management_
_Context gathered: 2026-04-21_
