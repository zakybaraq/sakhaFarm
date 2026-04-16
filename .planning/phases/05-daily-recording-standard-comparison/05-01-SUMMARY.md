---
phase: 05-daily-recording-standard-comparison
plan: 01
subsystem: recordings
tags: [recording, crud, validation, metrics]
key_files:
  created:
    - server/src/modules/recordings/recordings.errors.ts
    - server/src/modules/recordings/recordings.service.ts
    - server/src/modules/recordings/recordings.controller.ts
    - server/src/modules/recordings/recordings.routes.ts
  modified:
    - server/src/index.ts (already registered)
technologies: [Elysia.js, Drizzle ORM]
metrics:
  duration: ~5min
  files: 4
  tasks: 4
date: "2026-04-17"
---

# Phase 05 Plan 01: Recording CRUD with Validation Summary

## One-Liner

Daily recording CRUD API with validation rules (future dates, completed cycles) and automatic metric calculations (cumulative mortality, depletion %, SR).

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|-------|-------|
| 1 | Recordings errors module | 875e7ba | recordings.errors.ts |
| 2 | Recordings service module | 48d01aa | recordings.service.ts |
| 3 | Recordings controller | 48d01aa | recordings.controller.ts |
| 4 | Recordings routes | 875e7ba | recordings.routes.ts |

## Implementation Details

### API Endpoints

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST | /api/recorders | recording.create | Create recording |
| GET | /api/recordings?cycleId= | recording.read | List recordings |
| GET | /api/recordings/:id | recording.read | Get single recording |
| PUT | /api/recordings/:id | recording.update | Update recording |
| DELETE | /api/recordings/:id | recording.delete | Soft delete |

### Validation Rules Enforced

- **Future dates**: Rejected with 400 (FutureDateError)
- **Completed/failed cycles**: Rejected with 400 (CycleNotActiveError)
- **Duplicate recording date**: Rejected with 400 (DuplicateRecordingDateError)

### Calculated Metrics (per D-02)

| Metric | Formula | Returned In |
|--------|--------|------------|
| Cumulative Mortality % | Sum(dead + culled) / Initial × 100 | createRecording, getRecording |
| Depletion % | (Initial - Remaining) / Initial × 100 | createRecording, getRecording |
| Survival Rate % | Remaining / Initial × 100 | createRecording, getRecording |

### Standard Comparison (per D-03)

| Field | Description |
|-------|-------------|
| deviation.grams | Actual BW - Standard BW |
| deviation.percent | ((Actual - Standard) / Standard) × 100 |
| deviation.status | above_standard/on_standard/below_standard |

## Deviations from Plan

**None** - Plan executed as written with fixes for:
- HTTP status codes (set.status = 400/404 for validation errors)
- Cumulative mortality calculation (now sums ALL recordings up to date, not just current entry)

## Auth Gates

**None** - No authentication gates encountered.

## Known Stubs

**None** - All functionality wired.

## Key Decisions Made

| Decision | Implementation |
|----------|---------------|
| D-01: Future date rejection | FutureDateError with 400 status |
| D-02: Cumulative calculation | lte query sums all recordings up to date |
| D-03: Standard deviation | fetchStandard(docType, dayAge) returns null if not found |