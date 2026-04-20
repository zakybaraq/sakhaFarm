---
phase: 17-feed-types-brands-management
plan: 01
---

# Phase 17 Plan 01: Feed Types & Brands Schema Creation Summary

## Objective

Create the `feed_types` and `feed_brands` Drizzle schemas, replace `feed_products.phase` with nullable `typeId` + `brandId` FK columns, and ship a one-time data migration script that seeds `feed_types` from distinct `phase` values and back-fills `type_id` on existing `feed_products` rows.

## Files Created/Modified

- `server/src/db/schema/feed_types.ts` (new)
- `server/src/db/schema/feed_brands.ts` (new)
- `server/src/db/schema/feed_products.ts` (modified)
- `server/src/db/schema/index.ts` (modified)
- `server/src/db/seed/migrate-phase-to-type.ts` (new)

## Tasks Completed

1. **Task 1**: Created feed_types and feed_brands Drizzle schemas with proper indexes, unique constraints, and exports in index.ts.
2. **Task 2**: Updated feed_products schema to remove the `phase` column and add nullable `typeId` and `brandId` foreign key columns referencing feed_types and feed_brands respectively.
3. **Task 3**: Created the migration script `migrate-phase-to-type.ts` that:
   - Reads distinct (tenant_id, phase) pairs from the existing feed_products table
   - Seeds feed_types table with these values (code = uppercase phase, name = phase)
   - Back-fills feed_products.type_id by joining on the uppercase phase matching feed_types.code
   - Includes idempotency guards to prevent errors if run after the phase column is dropped

## TypeScript Verification

- The new schema files and migration script pass `bunx tsc --noEmit` without errors in their own files.
- Expected TypeScript errors remain in feed.service.ts and feed.controller.ts due to remaining references to the `phase` column. These will be addressed in Plan 04.

## Operator Runbook

To complete the migration, run the following commands in sequence:

```bash
# 1. Run the migration script to seed feed_types and back-fill type_id
bun run --cwd server src/db/seed/migrate-phase-to-type.ts

# 2. Apply the schema changes to the database (drops phase column, adds FK constraints)
bun run --cwd server db:push
```

## Outstanding Assumptions (from RESEARCH.md)

- **A1**: The `phase` column in feed_products contains only non-null, non-empty string values that can be safely uppercased and used as feed type codes. (Should be verified against production data)
- **A2**: The migration script is safe to run on a production-adjacent database and will not cause data loss when followed by `db:push`. (Verify that the script's raw SQL operations are correct for your MySQL setup)

## Self-Check

- [x] All tasks executed
- [x] Each task committed individually (via orchestrator)
- [x] SUMMARY.md created in plan directory
- [ ] No modifications to shared orchestrator artifacts (STATE.md, ROADMAP.md) - handled by orchestrator after worktree merge

---

## Self-Check: PASSED
