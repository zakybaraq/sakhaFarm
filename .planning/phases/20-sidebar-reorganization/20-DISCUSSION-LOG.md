# Phase 20: Sidebar Reorganization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-21
**Phase:** 20-sidebar-reorganization
**Areas discussed:** Grouping structure, Category membership, Section behavior, Visual treatment, Order

---

## Area 1: Grouping Structure

| Option                    | Description                                                                                                                                                                                          | Selected |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Like ROADMAP              | Master Data: Units, Plasmas, Feed Types, Feed Brands, Suppliers, Vitamins/Medicines \| Operations: Cycles, Recordings, Feed Stock \| Reports: Performance, Stock Resume \| Settings: RBAC, Audit Log | ✓        |
| Vitamins di Operations    | Move Vitamins/Medicines to Operations                                                                                                                                                                |          |
| Semua Feed di Master Data | Include Feed Products in Master Data                                                                                                                                                                 |          |

**User's choice:** Like ROADMAP (Recommended)
**Notes:** Matches ROADMAP.md requirements exactly

---

## Area 2: Section Behavior

| Option                 | Description                                                     | Selected |
| ---------------------- | --------------------------------------------------------------- | -------- |
| Always visible         | All sections visible, no expand/collapse                        |          |
| Expandable/Collapsible | Click header to reveal menu items                               |          |
| Hybrid                 | Master Data & Operations expanded, Reports & Settings collapsed | ✓        |

**User's choice:** Hybrid (some expanded)
**Notes:** Selected "Ops expanded, Rpt/Settings collapsed"

---

## Area 3: Visual Treatment

| Option                | Description                                                 | Selected |
| --------------------- | ----------------------------------------------------------- | -------- |
| Minimal               | Bold uppercase, smaller font, no background (current style) | ✓        |
| With background box   | Light background for section                                |          |
| With section icons    | Different icons for sections                                |          |
| Interactive vs static | Hover only on menu items                                    |          |

**User's choice:** Minimal (Recommended)
**Notes:** Keep current minimal style - clean and consistent

---

## Area 4: Category Membership

| Option           | Description                          | Selected |
| ---------------- | ------------------------------------ | -------- |
| Reports          | Audit log as part of Reports section | ✓        |
| Settings         | Audit log as security feature        |          |
| Separate section | New "System" section                 |          |

**User's choice:** Reports (Recommended)
**Notes:** Audit log is about tracking, fits with reports

---

## Area 5: Order

| Option          | Description                   | Selected |
| --------------- | ----------------------------- | -------- |
| Alphabetical    | ABC order within each section |          |
| Frequency-based | Most used at top              |          |
| Business flow   | Logical business sequence     | ✓        |

**User's choice:** Business flow
**Notes:** Units → Plasmas → Feed Types → Feed Brands → Products → Suppliers → Vitamins

---

## Summary

All decisions captured in CONTEXT.md. Planning can proceed with:

- 4 categories: Master Data, Operations, Reports, Settings
- Hybrid section behavior (some expanded, some collapsed)
- Minimal visual treatment for section headers
- Business flow ordering within categories
- Audit Log in Reports section
