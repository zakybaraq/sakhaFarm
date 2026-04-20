# Phase 16: Reports Data Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-21
**Phase:** 16-reports-data-integration
**Areas discussed:** Tenant ID, Date Filters, Export Approach, IP Metric Display

---

## Tenant ID

| Option | Description | Selected |
|--------|-------------|----------|
| Single-tenant by design | tenantId=1 is correct and permanent | |
| Read from auth context | tenantId from logged-in user's session/auth context | ✓ |
| Tech debt, fix later | Known shortcut to address in a future phase | |

**User's choice:** Read from auth context  
**Notes:** `User.tenantId` is already available via `useAuth().user.tenantId` — AuthContext exposes the full `User` object. Fix is `user?.tenantId ?? 1` in both Performance.tsx and StockResume.tsx.

---

## Date Filters

| Option | Description | Selected |
|--------|-------------|----------|
| Deferred to a future phase | Leave fields as visual placeholders | |
| Wire them in this phase | Add dateFrom/dateTo to queryKey and API params | ✓ |
| Remove the fields | Remove non-functional fields | |

**User's choice:** Wire them in this phase  
**Notes:** Backend already supports `dateFrom`/`dateTo` in `getStockResume`. Only `reporting.ts` client and `StockResume.tsx` need updates.

---

## Export Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Keep client-side exportToXlsx | Already works, no backend changes | ✓ |
| Switch to server-side export endpoint | Server generates Excel, better for large datasets | |
| Client-side is fine for now, revisit later | Accept current approach, note for future | |

**User's choice:** Keep client-side exportToXlsx  
**Notes:** Final decision — no server-side export endpoint needed. When date filters are wired, export will use already-loaded rows.

---

## IP Metric Display

| Option | Description | Selected |
|--------|-------------|----------|
| Add IP chart/KPI in this phase | Add chart or summary card showing IP | ✓ |
| Defer IP display to a future phase | BW and FCR are the essential metrics | |
| Show IP as a summary card only | Display final/latest IP as summary stat | |

**User's choice:** Add IP chart in this phase (line chart style)  
**Follow-up:** Asked about display format:

| Option | Description | Selected |
|--------|-------------|----------|
| Line chart (same style as FCR) | Third LineChart card for IP trend | ✓ |
| Summary KPI cards above charts | Stat cards: Latest BW, FCR, IP | |
| Both: KPI cards + IP chart | Cards AND dedicated IP chart | |

**User's choice:** Line chart (same style as FCR)  
**Notes:** Third `<Paper>` card below FCR card, titled "Trend IP (Index Performa)". API already returns `ip: number | null` per PerformanceRecord.

---

## Claude's Discretion

- IP chart null handling for `ip: null` values — follow existing codebase null-safe chart patterns

## Deferred Ideas

- Server-side Excel export endpoint — not needed, client-side export is sufficient
- IP + BW/FCR summary KPI cards at top of Performance page — only IP chart is in scope
