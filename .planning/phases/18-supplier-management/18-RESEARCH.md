# Phase 18: Supplier Management - Research

**Researched:** 2026-04-21
**Mode:** Implementation (following existing patterns)

---

## Standard Stack

Confirmed from codebase — no external research needed:

| Layer    | Technology                   | Source                             |
| -------- | ---------------------------- | ---------------------------------- |
| Backend  | Elysia.js                    | Already in use (auth, feed-brands) |
| ORM      | Drizzle ORM                  | Already in use                     |
| Database | MySQL                        | Already in use                     |
| Frontend | React + TanStack Query + MUI | Already in use                     |
| Table    | TanStack Table v8            | Already in use                     |

**No new libraries required.** This phase extends existing patterns.

---

## Architecture Patterns

### Backend (copy feed-brands pattern)

```
server/src/db/schema/suppliers.ts     # Schema (follow feed_brands.ts)
server/src/modules/suppliers/
  ├── suppliers.controller.ts        # CRUD endpoints
  ├── suppliers.service.ts       # Business logic
  └── errors.ts              # Custom errors
server/src/db/schema/index.ts     # Export new table
server/src/index.ts           # Register routes
```

### Frontend (copy feed-brands pattern)

```
client/src/pages/suppliers/
  ├── Suppliers.tsx           # List page with ResponsiveTable
  └── SupplierModal.tsx        # Create/Edit modal
client/src/api/suppliers.ts      # API client functions
client/src/components/layout/Sidebar.tsx # Add menu entry
```

### Database Migration

1. Create `suppliers` table (migration file)
2. Add `supplierId` column to `feed_surat_jalan` (nullable FK)

---

## Don't Hand-Roll

Based on established patterns:

| Problem          | Use Instead                                                         |
| ---------------- | ------------------------------------------------------------------- |
| List pagination  | TanStack Query + limit/offset (same as feed-brands)                 |
| Soft delete      | `deletedAt` timestamp + `isActive` toggle (same as all master data) |
| Tenant isolation | `tenantId` FK + WHERE clause (already implemented)                  |
| CRUD operations  | Copy `feed-brands.service.ts` patterns exactly                      |
| Table UI         | `ResponsiveTable` + `ColumnDef` (already in use)                    |

---

## Common Pitfalls

From Phase 17 learnings (feed-brands):

1. **Category enum handling** — Use restricted dropdown, NOT freeform text
2. **Backward compatibility** — Keep `vendor` field in Surat Jalan as fallback (nullable)
3. **Delete guard** — Prevent hard delete if supplier linked to Surat Jalan records
4. **TypeScript types** — Export proper `Supplier` and `NewSupplier` types from schema

---

## Code Examples

### Schema (copy feed_brands.ts pattern)

```typescript
export const suppliers = mysqlTable(
  "suppliers",
  {
    id: int("id").autoincrement().primaryKey(),
    tenantId: int("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 20 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    contactPerson: varchar("contact_person", { length: 100 }),
    phone: varchar("phone", { length: 20 }).notNull(),
    address: text("address"),
    category: varchar("category", { length: 20 }).notNull(), // feed/vitamin/medicine/other
    isActive: int("is_active").default(1),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    uqSuppliersCode: unique("uq_suppliers_code").on(table.tenantId, table.code),
  }),
);
```

### Controller Endpoints (copy feed-brands pattern)

```typescript
.get('/', async (ctx: any) => {
  const currentTenantId = getTenantId(ctx)
  const result = await listSuppliers(currentTenantId, ctx.query)
  return result
})
.post('/', async (ctx: any) => {
  const currentTenantId = getTenantId(ctx)
  if (!ctx.user) throw new Error('MISSING_USER_ID')
  const userId = ctx.user.id
  const result = await createSupplier(ctx.body, currentTenantId, userId)
  return result
})
// ... PUT edit, PUT toggle, DELETE soft delete
```

---

## Implementation Notes

1. **Phase 18 depends on Phase 17** — Feed brands pattern already implemented and working
2. **Single migration** — Suppliers table creation + FK addition to Surat Jalan
3. **No new types needed** — Follow existing `FeedBrand` type pattern
4. **Frontend API** — Add to existing `feed.ts` or create new `suppliers.ts`

---

## Confidence

**Level:** HIGH

This phase is a straightforward CRUD extension following patterns already implemented in:

- Phase 17: feed-brands (fully working)
- Phases 1-12: units, plasmas, users, roles, permissions (all working)

No external research needed. Implementation can proceed immediately.

---

_Researcher: gsd-phase-researcher_
_Phase: 18-supplier-management_
_Date: 2026-04-21_
