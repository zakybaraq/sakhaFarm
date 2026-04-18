---
status: testing
phase: 05-daily-recording-standard-comparison
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md]
started: 2026-04-17T06:00:00Z
updated: 2026-04-17T06:00:00Z
---

## Current Test

number: 1
name: Cold Start Smoke Test
expected: Server boots without errors. Recordings endpoints registered and accessible.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Server boots without errors. GET /api/health returns ok. Recordings endpoints registered.
result: [pending]

### 2. Create Daily Recording (Active Cycle)
expected: POST /api/recordings with valid data (cycleId, recordingDate, remainingPopulation, bodyWeightG) returns 200 with created recording.
result: [pending]

### 3. Future Date Rejection
expected: POST /api/recordings with future date (e.g., 2099-01-01) returns 400 with error code FUTURE_DATE.
result: [pending]

### 4. Completed Cycle Rejection
expected: POST /api/recordings for a completed cycle returns 400 with error code CYCLE_NOT_ACTIVE.
result: [pending]

### 5. List Recordings
expected: GET /api/recordings?cycleId= returns array of recordings for that cycle.
result: [pending]

### 6. Get Single Recording with Deviation
expected: GET /api/recordings/:id returns recording with deviation object (grams, percent, status).
result: [pending]

### 7. Update Recording
expected: PUT /api/recordings/:id with partial body updates the recording. Returns {success: true}.
result: [pending]

### 8. Soft-Delete Recording
expected: DELETE /api/recordings/:id marks recording as deleted. Returns {success: true}.
result: [pending]

### 9. Bulk CSV Import
expected: POST /api/recordings/bulk with CSV content creates multiple recordings. Returns {success, created, errors}.
result: [pending]

### 10. Bulk Import Row-Level Errors
expected: Bulk import with some invalid rows returns errors with row numbers while still importing valid rows.
result: [pending]

### 11. Cycle Summary with IP
expected: GET /api/cycles/:id/summary returns cycle data, recordings, cumulative metrics, and IP calculation.
result: [pending]

### 12. IP Calculation Formula
expected: IP = (SR% × 0.4) + (BW_achievement% × 0.3) + (FCR_achievement% × 0.3) calculated correctly.
result: [pending]

### 13. Duplicate Recording Date
expected: POST /api/recordings with same date for same cycle returns 400 DUPLICATE_RECORDING_DATE.
result: [pending]

## Summary

total: 13
passed: 0
issues: 0
pending: 13
skipped: 0
blocked: 0

## Gaps

[none yet]