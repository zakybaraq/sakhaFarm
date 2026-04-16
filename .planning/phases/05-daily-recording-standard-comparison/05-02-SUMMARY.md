---
phase: 05-daily-recording-standard-comparison
plan: 02
subsystem: recordings
tags: [recording, bulk-import, csv, cycle-summary, ip-calculation]
key_files:
  created:
    - server/src/modules/recordings/recordings.bulk.ts
    - server/src/modules/recordings/recordings.summary.ts
  modified:
    - server/src/modules/recordings/recordings.controller.ts
    - server/src/modules/cycle/cycle.controller.ts
    - server/src/db/schema/daily_recordings.ts
technologies: [Elysia.js, Drizzle ORM]
metrics:
  duration: ~5min
  files: 5
  tasks: 4
date: "2026-04-17"
---

# Phase 05 Plan 02: Bulk Import CSV + Cycle Summary with IP Calculation

## One-Liner

Bulk CSV import for recordings with row-by-row error handling and cycle summary endpoint with IP calculation.

## Completed Tasks

| Task | Name | Files |
|------|------|-------|
| 1 | Bulk recordings import service | recordings.bulk.ts |
| 2 | Cycle summary with IP calculation | recordings.summary.ts |
| 3 | Bulk import endpoint | recordings.controller.ts (POST /api/recordings/bulk) |
| 4 | Cycle summary endpoint | cycle.controller.ts (GET /api/cycles/:id/summary) |

## Implementation Details

### Endpoints Added

| Method | Path | Permission | Description |
|--------|------|-------------|-------------|
| POST | /api/recordings/bulk | recording.create | Bulk import CSV |
| GET | /api/cycles/:id/summary | cycle.read | Cycle summary with IP |

### Bulk Import (per D-04)

- **CSV columns**: date, dead, culled, remaining_population, body_weight_g, feed_consumed_kg, notes (optional)
- **Validation**: Row-by-row, skip on error, continue
- **Response**: `{ success: true, created: N, errors: [{ row: N, error: "..." }] }`
- **Limits**: Max 1000 rows per request

### IP Calculation (per D-05)

Formula: `IP = (SR% × 0.4) + (BW_achievement% × 0.3) + (FCR_achievement% × 0.3)`

- SR% = (Final population / Initial population) × 100
- BW_achievement% = Actual BW / Standard BW × 100
- FCR_achievement% = Standard FCR / Actual FCR × 100 (inverted)

IP only returned for completed cycles.

### Cycle Summary Response

```json
{
  "summary": {
    "cycle": { "id", "docType", "chickInDate", "initialPopulation", "status", "harvestDate" },
    "recordings": [{ "id", "recordingDate", "dayAge", "dead", "culled", "remainingPopulation", "bodyWeightG", "feedConsumedKg" }],
    "cumulativeMetrics": { "totalDead", "totalCulled", "totalFeedKg", "cumulativeMortality", "deplesi", "survivalRate", "averageBodyWeight", "runningFCR" },
    "deviation": { "grams", "percent", "status", "standardBwG", "actualBwG" },
    "ip": 85.5
  }
}
```

## Deviations from Plan

**None** - Plan executed as written with fixes for:
- Drizzle date type compatibility (added `as any` casts)
- Schema missing `deletedAt` column (added to daily_recordings.ts)

## Auth Gates

**None** - No authentication gates encountered.

## Known Stubs

**None** - All functionality wired.

## Key Decisions Made

| Decision | Implementation |
|----------|---------------|
| D-04: Bulk CSV import | Row-by-row validation with errors array |
| D-05: IP calculation | Weighted formula (SR×0.4 + BW×0.3 + FCR×0.3) |
| Max 1000 rows | Check at start of importBulk function |