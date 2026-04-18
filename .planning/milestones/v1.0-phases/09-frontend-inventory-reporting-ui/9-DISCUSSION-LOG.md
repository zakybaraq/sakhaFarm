# Phase 9: Frontend — Inventory & Reporting UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 09-frontend-inventory-reporting-ui
**Areas discussed:** Surat Jalan entry, Feed stock display, Performance charts, Export format, Audit log viewer, RBAC Manager structure

---

## Surat Jalan Entry

| Option | Description | Selected |
|--------|-------------|----------|
| Modal popup | Quick entry, stays on page — best for daily feed deliveries | ✓ |
| Full page | Full form with history — better for complex entries | |

**User's choice:** Modal popup (Recommended)

---

## Feed Stock Display

| Option | Description | Selected |
|--------|-------------|----------|
| DataGrid with filters | Best for filtering, sorting, large datasets | ✓ |
| Dashboard cards | Overview with summary cards and drill-down | |
| Combined view | Cards at top for alerts, DataGrid below | |

**User's choice:** DataGrid with filters (Recommended)

---

## Performance Charts

| Option | Description | Selected |
|--------|-------------|----------|
| Line chart for BW | BW growth curve shows deviation from standard — clear visual comparison | ✓ |
| Area chart for FCR | Shows efficiency trend over time | |
| Combined dashboard | Both BW curve and FCR trend on same page | |

**User's choice:** Line chart for BW (Recommended)

---

## Export Format

| Option | Description | Selected |
|--------|-------------|----------|
| Excel (xlsx) | Better formatting, cell styling, multiple sheets | ✓ |
| CSV | Simple universal format, works everywhere | |

**User's choice:** Excel (xlsx) (Recommended)

---

## Audit Log Viewer

| Option | Description | Selected |
|--------|-------------|----------|
| DataGrid with filters | Standard MUI DataGrid with column filters | ✓ |
| Timeline view | Activity feed style, chronological | |

**User's choice:** DataGrid with filters (Recommended)

---

## RBAC Manager Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Single page with tabs | Tabs for roles, permissions, users — fast switching | ✓ |
| Separate pages | Separate routes for each section | |

**User's choice:** Single page with tabs (Recommended)

---

## Agent's Discretion

The following were delegated to the agent:
- Loading states (use MUI Skeleton)
- Empty states (custom components)
- Form validation (React Hook Form + Zod)
- Chart colors (green accent #2E7D32)
- DataGrid pagination defaults

---

## Deferred Ideas

None — all discussion stayed within Phase 9 scope.

---

*Phase: 09-frontend-inventory-reporting-ui*
*Discussion completed: 2026-04-17*