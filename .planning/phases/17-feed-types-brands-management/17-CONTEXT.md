# Phase 17: Feed Types & Brands Management - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Add master data management for feed product types (e.g., Starter, Grower, Finisher) and brands (e.g., Charoen Pokphand, Wonokoyo). This includes:
- New `feed_types` and `feed_brands` DB tables with full CRUD pages
- Migration of existing `feed_products.phase` varchar to a proper `type_id` FK
- New `Feed Products` management page (previously no UI existed)
- Feed product create/edit modal includes type and brand dropdowns

New capabilities only — does not include supplier management or sidebar reorganization (those are Phases 18 and 20).

</domain>

<decisions>
## Implementation Decisions

### Database Schema

- **D-01:** Create `feed_types` table with fields: `id`, `tenantId`, `code` (varchar 20), `name` (varchar 100), `isActive` (int default 1), `deletedAt`, `createdAt`, `updatedAt`. Unique constraint on (tenantId, code).

- **D-02:** Create `feed_brands` table with fields: `id`, `tenantId`, `code` (varchar 20), `name` (varchar 100), `phone` (varchar 20, nullable), `isActive` (int default 1), `deletedAt`, `createdAt`, `updatedAt`. Unique constraint on (tenantId, code).

- **D-03:** Migrate `feed_products` schema:
  - Drop `phase` varchar column
  - Add `typeId` int nullable FK → `feed_types.id`
  - Add `brandId` int nullable FK → `feed_brands.id`

- **D-04:** Migration auto-seeds `feed_types` rows from distinct `phase` values in `feed_products`, then sets `typeId` on existing products before dropping `phase`. No data loss.

### Backend

- **D-05:** New backend modules following existing feature-based pattern (same as units/plasmas):
  - `server/src/modules/feed-types/` — controller, service, schema, errors
  - `server/src/modules/feed-brands/` — controller, service, schema, errors
  - Register routes in `server/src/index.ts`

- **D-06:** Feed Types endpoints: `GET /api/feed-types` (list), `POST /api/feed-types` (create), `PUT /api/feed-types/:id` (edit), `PUT /api/feed-types/:id/toggle` (activate/deactivate), `DELETE /api/feed-types/:id` (soft delete). Same RBAC permission pattern as units.

- **D-07:** Feed Brands endpoints: same pattern as Feed Types — GET list, POST create, PUT edit, PUT toggle, DELETE soft.

- **D-08:** Update `feed.controller.ts` and `feed.service.ts` to accept `typeId` and `brandId` in create/update feed product requests (replacing `phase`).

### Frontend Pages

- **D-09:** New **Feed Types** page (`client/src/pages/feed/FeedTypes.tsx`) — full CRUD: table listing all types with name/code/status columns, create/edit modal, toggle active, delete. Same pattern as Units/Plasmas pages.

- **D-10:** New **Feed Brands** page (`client/src/pages/feed/FeedBrands.tsx`) — full CRUD: table listing brands with name/code/phone/status columns, create/edit modal with name + code + phone fields, toggle active, delete.

- **D-11:** New **Feed Products** management page (`client/src/pages/feed/FeedProducts.tsx`) — list all feed products, create/edit modal with fields: code, name, type (Autocomplete from feed_types), brand (Autocomplete from feed_brands), zakKgConversion. Existing `FeedStock.tsx` stays separate (stock view, not product catalog).

- **D-12:** Update `SuratJalanModal.tsx` feed product dropdown to use the updated `listFeedProducts` API (now returns type + brand info).

### CRUD Scope

- **D-13:** Feed Types and Feed Brands both need full CRUD: create, edit (name/code/phone), toggle active, soft delete. Same UX pattern as Units and Plasmas pages — consistent across all master data.

- **D-14:** Delete guard: if a feed_type or feed_brand is referenced by any feed_product, soft delete (set deletedAt) rather than hard delete. Return descriptive error if hard delete is attempted on a referenced record.

### Claude's Discretion

- Route/path naming for new pages (e.g., `/feed/types`, `/feed/brands`, `/feed/products`)
- Whether Feed Types, Feed Brands, Feed Products appear as sidebar sub-items under "Feed" or as top-level items (sidebar reorganization is Phase 20 — for now, group under Feed or add to sidebar with minimal friction)
- Permission names for new entities (follow existing naming convention: `feed-types.create`, `feed-brands.read`, etc.)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Feed Module (extend, don't replace)
- `server/src/db/schema/feed_products.ts` — current schema with `phase` field to be migrated
- `server/src/modules/feed/feed.controller.ts` — existing feed controller pattern to follow
- `server/src/modules/feed/feed.service.ts` — existing feed service pattern
- `client/src/api/feed.ts` — existing feed API client (add listFeedTypes, listFeedBrands here or in new files)

### Pattern Reference (copy these patterns)
- `server/src/db/schema/units.ts` — unit schema pattern (tenantId, isActive, deletedAt, timestamps)
- `server/src/modules/unit/` — controller/service pattern for master data CRUD
- `client/src/pages/units/` — Units page + UnitModal pattern to follow for Feed Types/Brands/Products pages

### Frontend Feed Pages
- `client/src/pages/feed/FeedStock.tsx` — existing stock view page (keep as-is, don't merge with new catalog page)
- `client/src/pages/feed/SuratJalanModal.tsx` — needs update: feed product dropdown after typeId/brandId migration

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ResponsiveTable` + `ColumnDef` — used by all list pages; reuse for Feed Types, Brands, Products
- `useAuth().user.tenantId` — use for all new API calls (D-07 from Phase 16 context)
- Existing `FeedProduct` interface in `client/src/api/feed.ts` — will need `typeName`, `brandName`, `typeId`, `brandId` fields added

### Established Patterns
- Master data pages (Units, Plasmas): list → modal → confirm delete — replicate exactly
- Soft delete + isActive toggle: all master data uses same pattern
- Drizzle schema with `tenantId` FK, `deletedAt`, `createdAt`, `updatedAt` timestamps — follow exactly

### Integration Points
- `feed_products.phase` → removed; `feed_products.typeId` + `feed_products.brandId` added
- `listFeedProducts()` API response will include `typeId`, `brandId`, `typeName`, `brandName` — downstream consumers (StockResume, Surat Jalan) read these
- New sidebar entries needed for Feed Types, Feed Brands, Feed Products (scope: minimal addition, full reorganization is Phase 20)

</code_context>

<specifics>
## Specific Ideas

- Feed Types examples from existing data: Starter, Grower, Finisher (derived from current `phase` field values)
- Feed Brands examples: Charoen Pokphand (CP), Wonokoyo — from ROADMAP description
- Brand `phone` field: contact number for the feed supplier/brand rep (not the same as Supplier management in Phase 18)

</specifics>

<deferred>
## Deferred Ideas

- Supplier management — full supplier entity with purchase linkage (Phase 18)
- Sidebar reorganization into Master Data / Operations / Reports groups (Phase 20)
- Nutritional info (protein%, moisture%) as brand/type attributes — not in scope, can be added later
- Brand-to-type relationship (e.g., "CP only makes Starter and Grower") — not in scope; brands and types are independent catalogs

</deferred>

---

*Phase: 17-feed-types-brands-management*
*Context gathered: 2026-04-21*
