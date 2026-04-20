# Phase 19: Vitamins/Medicines Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-21
**Phase:** 19-Vitamins/Medicines Management
**Mode:** standard (discuss)

---

## Areas Discussed

### Entity Model

| Option                           | Description                                                                    | Selected |
| -------------------------------- | ------------------------------------------------------------------------------ | -------- |
| Single table with category field | One CRUD page, filter tabs, same fields for both; simpler like Suppliers       | ✓        |
| Two separate tables              | Separate pages/modules with different fields possible; more complex separation |          |

**User's choice:** Single unified table with `category` ('vitamin' | 'medicine')
**Notes:** Keeps implementation simple; filtering and categorization handled in UI and queries.

---

### Item Schema Fields

| Option                                | Selected |
| ------------------------------------- | -------- |
| unitOfMeasure                         | ✓        |
| manufacturer/brand                    | ✓        |
| strength/concentration                | ✓        |
| phone/contact                         | ✓        |
| supplierId (FK)                       | ✓        |
| the agent's Discretion (minimal only) |          |

**User's choice:** All extended fields included.
**Notes:** Comprehensive item profile for traceability. Supplier FK required for audit linkage.

---

### Inventory Tracking Strategy

| Option                                | Description                                                                    | Selected |
| ------------------------------------- | ------------------------------------------------------------------------------ | -------- |
| pharmaceutical_stock table per plasma | Like feed_stock: opening/in/out/closing balances per plasma                    | ✓        |
| Simple currentStock column            | Just a number on item table; no per-plasma, no history                         |          |
| Transaction log only                  | Transactions table only; current stock = sum; fully auditable but more complex |          |

**User's choice:** Separate `pharmaceutical_stock` table per plasma.
**Notes:** Enables per-plasma inventory views and reconciliation.

---

### Expiry / Batch Tracking

| Option                                    | Description                                                        | Selected |
| ----------------------------------------- | ------------------------------------------------------------------ | -------- |
| No expiry tracking in this phase          | Only total stock; expiry added later                               |          |
| Optional expiryDate on items              | Single expiry per item; basic FEFO hinting                         |          |
| Full batch table (pharmaceutical_batches) | Batch numbers, expiry, received qty; issue from batches; FIFO/FEFO | ✓        |

**User's choice:** Full batch-level tracking.
**Notes:** Pharmaceutical supplies require batch traceability for compliance.

---

### Usage Recording

| Option                           | Description                                       | Selected |
| -------------------------------- | ------------------------------------------------- | -------- |
| Modal on Vitamins/Medicines page | Standalone usage record form                      |          |
| Section on Daily Recording page  | Integrated Pharmaceuticals tab in Daily Recording | ✓        |
| Simple stock adjustment only     | Direct stock edit from items page                 |          |

**User's choice:** New section on Daily Recording page.
**Notes:** Centralized daily operations workflow; consumption recorded alongside other daily data.

---

### Page Layout

| Option                           | Description                                        | Selected |
| -------------------------------- | -------------------------------------------------- | -------- |
| Minimal table only               | Code, Name, Status columns only; details in modal  | ✓        |
| Catalog + Inventory tabbed view  | Two tabs: catalog CRUD + per-plasma inventory view |          |
| Catalog + Inventory + Usage tabs | Three tabs including full usage history            |          |

**User's choice:** Minimal table layout.
**Notes:** Inventory and usage will be shown in dedicated pages/sections, not in this CRUD page.

---

### Supplier Linkage

| Option                           | Description                                     | Selected |
| -------------------------------- | ----------------------------------------------- | -------- |
| Yes — supplierId FK required     | FK to suppliers (category=vitamin/medicine)     | ✓        |
| No — supplier optional free-text | Text field only; no FK constraint               |          |
| Only on usage recording          | Item has no supplier; linked only at usage time |          |

**User's choice:** Mandatory supplierId FK (nullable in schema but validated to valid supplier when provided).
**Notes:** Aligns with supplier category filtering concept already implemented.

---

### Sidebar Placement (pre-Phase 20)

| Option                  | Description                                           | Selected |
| ----------------------- | ----------------------------------------------------- | -------- |
| Top-level entry         | Standalone menu item; Phase 20 will reorganize anyway | ✓        |
| Inside Operations group | With Cycles, Recordings, Feed Stock                   |          |
| Child of Feed menu      | Under Feed → Vitamins/Medicines submenu               |          |

**User's choice:** Temporary top-level entry.
**Notes:** Phase 20 sidebar reorganization coming; minimal placement acceptable.

---

## the agent's Discretion

- Exact order of columns in the items table
- Unit of measure options list
- Batch selection UI specifics (dropdown layout with expiry/qty preview)
- Empty-state messaging and icons
- Whether to show stock value (cost × qty) — cost tracking deferred

---

## Deferred Ideas

- Full inventory management page (separate CRUD for stock adjustments) — separate phase
- Expiry alert widgets and dashboard KPIs — separate phase
- Batch-level traceability reports and recall workflows — separate phase
- Unit cost tracking and inventory valuation — separate phase
- Barcode/QR scanning for batch selection — separate phase

---

## Scope Check

All discussion stayed within Phase 19 boundary. No scope creep detected.
