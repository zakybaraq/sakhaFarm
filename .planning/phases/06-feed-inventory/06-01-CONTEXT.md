---
phase: 06-feed-inventory
plan: 01
tags: [feed, inventory, stock-tracking]
key_files:
  existing:
    - server/src/db/schema/feed_products.ts
    - server/src/db/schema/feed_stock.ts
    - server/src/db/schema/feed_movements.ts
  to_create:
    - server/src/modules/feed/feed.errors.ts
    - server/src/modules/feed/feed.service.ts
    - server/src/modules/feed/feed.controller.ts
    - server/src/modules/feed/feed.routes.ts
technologies: [Elysia.js, Drizzle ORM]
metrics:
  duration: ~10min
  files: 4
  tasks: 4
date: "2026-04-17"
---

# Phase 06 Plan 01: Feed Inventory CRUD Summary

## One-Liner

Feed inventory CRUD API with product master, Surat Jalan (feed delivery), and feed consumption recording with atomic stock updates.

## Context Analysis

### Schema Already Exists (Phase 1)

**feed_products** — Feed master catalog:
- id, code (unique), name, phase (starter/grower/finisher), proteinPercent, defaultUnit (zak), isActive

**feed_stock** — Current stock per plasma:
- plasmaId, feedProductId
- openingStockKg, totalInKg, totalOutKg, closingStockKg
- Unique constraint: (plasmaId, feedProductId)

**feed_movements** — Movement history:
- plasmaId, feedProductId, movementType (in/out)
- quantityKg, quantityZak
- referenceType (surat_jalan/recording), referenceId
- createdBy, createdAt

### Patterns to Follow (from Phase 4-5)

**Error classes**: Custom errors with .name (e.g., `FeedProductNotFoundError`)
**Service layer**: Check-then-act with transaction wrapping
**Controller**: Elysia with .post/.get/.put/.delete, requirePermission guards
**Tenant isolation**: Via tenant plugin (derived from session)

### Dependencies

- Phase 4: Unit/Plasma exist (required for plasmaId FK)
- Phase 3: RBAC permissions (feed.create, feed.read, feed.update, feed.delete)

## Key Decisions

### Gray Areas to Resolve

1. **Surat Jalan format**: What fields in Surat Jalan? (vendor, date, vehicle number, driver, DO number)
2. **Stock calculation**: Opening + In - Out = Closing OR Real-time query?
3. **Negative stock**: Prevent at API level or allow with warning?
4. **Unit conversion**: Zak to Kg conversion (assume 1 Zak = 50kg standard) or configurable?

### Decisions Made

- Use existing schema as-is
- Transaction wrapping for atomic stock updates (from Phase 4-5 pattern)
- Reuse audit logging pattern from recordings
- Reuse error handling pattern from recordings

## API Design

### Endpoints (proposed)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST | /api/feed/products | feed.create | Create feed product |
| GET | /api/feed/products | feed.read | List feed products |
| GET | /api/feed/products/:id | feed.read | Get single product |
| PUT | /api/feed/products/:id | feed.update | Update product |
| DELETE | /api/feed/products/:id | feed.delete | Soft-delete product |
| POST | /api/feed/surat-jalan | feed.create | Record feed delivery |
| POST | /api/feed/consume | feed.create | Record feed consumption |
| GET | /api/feed/stock | feed.read | Get current stock |

## Notes

### Decisions Made

**1. Surat Jalan Format**
- Create feed_surat_jalan table for delivery metadata
- Fields: surat_jalan_number, vendor, delivery_date, vehicle_number, driver_name, total_zak, notes
- Movement references surat_jalan via referenceType + referenceId

**2. Stock Calculation**
- Pre-calculated closingStockKg (Option A) 
- Real-time query as validation only (not stored)
- Transaction: update stock on each movement atomically

**3. Negative Stock**
- Hard prevent (Option A)
- Return 400 with current vs requested error
- Include stock query before allowance

**4. Unit Conversion**
- Default 50kg per Zak
- Add zakKgConversion column to feed_products (nullable, defaults to 50)
- Use conversion stored in feed_products otherwise default

### Implementation Order

1. feed_surat_jalan table (new)
2. feed_products.migration (add zakKgConversion)
3. feed.service CRUD + stock logic
4. feed.controller with RBAC

---

### Deferred to Phase 7

- Stock alert threshold
- Aggregate reporting
- Export functionality