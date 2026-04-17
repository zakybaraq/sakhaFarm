---
phase: 07-inventory-reporting
plan: 01
tags: [reporting, inventory, export]
key_files:
  existing:
    - server/src/db/schema/feed_stock.ts
    - server/src/db/schema/feed_products.ts
    - server/src/db/schema/daily_recordings.ts
  to_create:
    - server/src/modules/reporting/reporting.service.ts
    - server/src/modules/reporting/reporting.controller.ts
    - server/src/modules/reporting/reporting.routes.ts
technologies: [Elysia.js, Drizzle ORM, Redis]
metrics:
  duration: ~10min
  files: 3
  tasks: 3
date: "2026-04-17"
---

# Phase 07: Inventory Resume & Reporting

## Context

### From ROADMAP.md

**Depends on**: Phase 5 (Daily Recording), Phase 6 (Feed Inventory)

**Deliverables:**
- Resume Stock endpoint: aggregate stock per feed type per unit (with plasma breakdown)
- Daily Performance Report: BW, FCR, deplesi per cycle per day  
- Filter support: by unit, date range, feed type, DOC type
- Export endpoint: CSV/Excel format
- Redis caching for expensive aggregate queries
- Pagination for large result sets

## Gray Areas Discussed

### 1. Resume Stock Query Design
**Decision:** SQL aggregation via JOINs
- Use SQL SUM(GROUP BY) for performance
- Join feed_products for zakKgConversion (unit conversion)
- Return both Zak and Kg totals
- Include plasma breakdown array

### 2. Performance Report Format  
**Decision:** JSON array per day per cycle
```json
{
  "date": "YYYY-MM-DD",
  "cycleId": N,
  "cycleNumber": N,
  "avgBodyWeightG": N,
  "fcr": N.NN,
  "deplesiPercent": N.N,
  "population": N
}
```
- Calculate FCR: feedConsumedKg / (population change + cumulative mortality)
- Calculate deplesi: (dead + culled) / initialPopulation * 100

### 3. Export Format
**Decision:** CSV first
- Headers: date, cycle, feed, zak, kg, notes
- Use standard CSV library
- Excel deferred to Phase 10 if needed

### 4. Caching Strategy
**Decision:** Selective caching
- Cache /api/reporting/resume and /api/reporting/performance only
- TTL: 60 seconds for resume, 300 seconds for performance
- Invalidate on feed_movement INSERT (any type)

## API Design

### Endpoints (proposed)

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | /api/reporting/stock-resume | reporting.read | Aggregated stock resume |
| GET | /api/reporting/performance | reporting.read | Daily performance |
| GET | /api/reporting/stock-resume/export | reporting.export | Export CSV |
| GET | /api/reporting/performance/export | reporting.export | Export CSV |

### Query Parameters

- ?unitId=N (filter by unit)
- ?plasmaId=N (filter by plasma)  
- ?feedProductId=N (filter by feed)
- ?dateFrom=YYYY-MM-DD
- ?dateTo=YYYY-MM-DD
- ?page=N&limit=N (pagination)

## Patterns to Follow

- Reuse Phase 6 feed service patterns
- Reuse audit logging from recordings
- Reuse error handling pattern
- Reuse RBAC guards from users phase

## Notes

- Pagination required for large result sets
- Export should accept query params for filtering