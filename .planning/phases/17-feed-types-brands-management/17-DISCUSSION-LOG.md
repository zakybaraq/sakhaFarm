# Phase 17: Feed Types & Brands Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-21
**Phase:** 17-feed-types-brands-management
**Areas discussed:** phase field migration, Feed Products CRUD page, CRUD scope for Types & Brands, Brand schema fields

---

## phase field migration

| Option | Description | Selected |
|--------|-------------|----------|
| Replace phase with type_id FK | Migrate phase values → feed_types, drop phase column | ✓ |
| Keep phase, add type_id alongside | Add nullable type_id FK, keep phase for compat | |
| Keep phase as-is, types separate | Don't touch feed_products, types are independent | |

**User's choice:** Replace phase with type_id FK  
**Notes:** Migration must auto-seed feed_types from distinct phase values and update type_id before dropping the column — no data loss.

---

## Feed Products CRUD page

| Option | Description | Selected |
|--------|-------------|----------|
| Add Feed Products management page in this phase | New page with create/edit modal including type + brand dropdowns | ✓ |
| Only manage Types & Brands — product association deferred | Build Type/Brand pages only | |
| Embed in Surat Jalan flow only | No dedicated page, inline selection | |

**User's choice:** Add Feed Products management page  
**Follow-up (fields for create/edit modal):**

| Option | Description | Selected |
|--------|-------------|----------|
| code, name, type, brand, zak/kg conversion | Core fields only | ✓ |
| All current fields + type + brand | Full schema exposure | |
| Just name, type, brand | Minimal fields | |

**User's choice:** code, name, type (dropdown), brand (dropdown), zakKgConversion

---

## CRUD scope for Types & Brands

| Option | Description | Selected |
|--------|-------------|----------|
| Create + list + delete | Simple catalog, no edit | |
| Full CRUD with active/inactive toggle | Same pattern as Units/Plasmas | ✓ |
| Create + list only | Append-only, no delete | |

**User's choice:** Full CRUD with active/inactive toggle  
**Notes:** Consistent with all other master data pages in the app.

---

## Brand schema fields

| Option | Description | Selected |
|--------|-------------|----------|
| name + code only | Simple catalog entry | |
| name + code + contact/phone | Add contact phone for brand rep | ✓ |
| name + code + country of origin | Add manufacturer country | |

**User's choice:** name + code + contact/phone  

**Follow-up (feed_types fields):**

| Option | Description | Selected |
|--------|-------------|----------|
| name + code only | Simple catalog entry | ✓ |
| name + code + description | Add growth stage notes | |

**User's choice:** name + code only

---

## Claude's Discretion

- Route/path naming for new pages
- Sidebar placement for new pages (minimal addition, full reorg is Phase 20)
- Permission naming convention for new entities

## Deferred Ideas

- Supplier management (Phase 18)
- Sidebar reorganization into groups (Phase 20)
- Nutritional info as brand/type attributes
- Brand-to-type relationship constraints
