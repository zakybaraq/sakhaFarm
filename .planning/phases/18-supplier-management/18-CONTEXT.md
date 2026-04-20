# Phase 18: Supplier Management - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Add entity management for suppliers/vendors who provide farm supplies (feed, vitamins, medicines). This includes:

- New `suppliers` DB table with full CRUD
- Supplier page in UI
- Optional: Link suppliers to Surat Jalan purchases for tracking
- New sidebar entry

New capabilities only — does not include vitamins/medicines inventory (Phase 19) or sidebar reorganization (Phase 20).

</domain>

<decisions>
## Implementation Decisions

### Database Schema

- **D-01:** Create `suppliers` table with fields:
  - `id` (int, PK, autoincrement)
  - `tenantId` (int, FK→tenants)
  - `code` (varchar 20, unique per tenant)
  - `name` (varchar 100)
  - `contactPerson` (varchar 100, nullable) — contact name for orders
  - `phone` (varchar 20) — contact phone number
  - `address` (text, nullable) — supplier address
  - `category` (enum: feed/vitamin/medicine/other)
  - `isActive` (int default 1)
  - `deletedAt` (timestamp, nullable)
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)
  - Unique constraint on (tenantId, code)

- **D-02:** Add `supplierId` FK to `feed_surat_jalan` table:
  - New `supplierId` int nullable FK → `suppliers.id`
  - Keep existing `vendor` varchar field as fallback (nullable) for backward compatibility
  - UI shows supplier dropdown; if selected, auto-fills vendor name

### Category Values

- **D-03:** Restricted category dropdown: `feed`, `vitamin`, `medicine`, `other`
  - Not freeform text — enables filtering and reporting
  - Category affects which pages can link to supplier (feed → Surat Jalan, vitamin/medicine → future usage logs)

### Backend

- **D-04:** New backend module: `server/src/modules/suppliers/`
  - controller, service, schema
  - Follow same pattern as units/plasmas/feed-brands

- **D-05:** Supplier endpoints:
  - `GET /api/suppliers` (list with filters: category, isActive)
  - `POST /api/suppliers` (create)
  - `PUT /api/suppliers/:id` (edit)
  - `PUT /api/suppliers/:id/toggle` (activate/deactivate)
  - `DELETE /api/suppliers/:id` (soft delete)
  - Same RBAC permission pattern: `supplier.create`, `supplier.read`, etc.

- **D-06:** Update Surat Jalan POST to accept optional `supplierId`:
  - Request body: add `supplierId?: number`
  - If provided, use supplier name as `vendor` value (or set null on vendor field)

### Frontend Pages

- **D-07:** New **Supplier** page (`client/src/pages/suppliers/Suppliers.tsx`)
  - Full CRUD: table listing with columns (code, name, contactPerson, phone, category, status)
  - Create/edit modal with all fields including category dropdown
  - Toggle active, delete with confirmation
  - Same pattern as Units/Plasmas/FeedBrands pages

- **D-08:** Update **SuratJalanModal** to include supplier autocomplete:
  - Add supplier dropdown field
  - When supplier selected, auto-populate vendor name field
  - Filter suppliers by category=feed for Surat Jalan context

- **D-09:** New sidebar entry:
  - Add "Supplier" under Operations section (or keep top-level since it's master data)
  - Permission: `supplier.read`

### Claude's Discretion

- Exact sidebar placement (Operations vs Master Data — Phase 20 will reorganize)
- Order of category enum values in UI dropdown
- Whether to show supplier count on dashboard KPIs

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema Patterns

- `server/src/db/schema/feed_brands.ts` — pattern to follow for suppliers table
- `server/src/db/schema/feed_surat_jalan.ts` — add supplierId here
- `server/src/db/schema/units.ts` — tenant-scoped master data pattern

### Controller/Service Patterns

- `server/src/modules/feed-brands/feed-brands.controller.ts` — CRUD pattern
- `server/src/modules/feed-brands/feed-brands.service.ts` — service pattern

### Frontend Patterns

- `client/src/pages/feed-brands/FeedBrands.tsx` — page pattern
- `client/src/pages/feed-brands/FeedBrandModal.tsx` — modal pattern
- `client/src/pages/feed/SuratJalanModal.tsx` — update with supplier dropdown

### API Client

- `client/src/api/feed.ts` — add `listSuppliers`, `createSupplier`, `updateSupplier`, `deleteSupplier` functions

</canonical_refs>

<specifics>
## Specific Details

### Supplier Category Examples

- Feed suppliers: Charoen Pokphand (CP), Wonokoyo,金陵,正大
- Vitamin suppliers:/vitamin brands
- Medicine suppliers: pharmaceutical distributors

### Category-Context Rules

- Category `feed` → appears in Surat Jalan modal dropdown
- Category `vitamin`/medicine → appears in future usage recording (Phase 19)
- Category `other` → available for general purchase tracking

### Integration Flow

1. User creates supplier with category=feed
2. User creates Surat Jalan
3. Supplier dropdown filters to category=feed suppliers
4. Selecting supplier auto-fills vendor name

</specifics>

<deferred>
## Deferred Ideas

- Supplier-specific pricing/contracts — track negotiated prices per supplier
- Purchase order numbers linked to Surat Jalan
- Supplier performance tracking (delivery timeliness, quality)
- Vitamins/medicines usage logging (Phase 19)
- Full sidebar reorganization (Phase 20)

</deferred>

---

_Phase: 18-supplier-management_
_Context gathered: 2026-04-21_
