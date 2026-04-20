---
status: resolved
trigger: semua data yang dipilih pada halaman http://localhost:5173/reports/performance menunjukkan "Belum ada data recording" tolong cek db apakah ada datanya?
created: 2026-04-21T00:00:00Z
updated: 2026-04-21T00:00:00Z
---

## Symptoms

- **Expected:** Performance page shows real FCR/IP chart data from API
- **Actual:** All cycles show "Belum ada data recording" empty state
- **Timeline:** Started after phase 16-03 gap closure
- **Reproduction:** Navigate to Reports → Performance, select any cycle

## Evidence

- timestamp: 2026-04-21T00:00:00Z
  action: Checked database
  result: cycles table has 2 records (id=11 cycle_number=1, id=23 cycle_number=2), both plasma_id=98
  result: daily_recordings table has 0 records total

- timestamp: 2026-04-21T00:00:00Z
  action: Attempted to create recording via UI
  result: Console shows "Recording submitted" but no POST to /api/recordings in network
  result: Root cause: DailyRecording.tsx onSubmit handler is mock-only (setTimeout + console.log)
  result: No API client exists for recordings (client/src/api/recordings.ts missing)

## Root Cause

Two issues found:
1. `client/src/pages/recordings/DailyRecording.tsx` onSubmit handler was a mock implementation — only setTimeout + console.log, never called the API
2. No recordings API client existed (`client/src/api/recordings.ts` was missing)

## Fix Applied

1. Created `client/src/api/recordings.ts` with `createRecording()` function
2. Wired `DailyRecording.tsx` onSubmit to call `createRecording()` with proper payload
3. Added `queryClient.invalidateQueries({ queryKey: ['performance'] })` to refresh Performance page after recording

## Verification

- ✅ POST /api/recordings returns 200 OK
- ✅ daily_recordings table now has 1 record
- ✅ Performance page shows all 3 charts (BW, FCR, IP) with real data
- ✅ TypeScript diagnostics clean

## Resolution

root_cause: Recording form onSubmit was mock implementation, never called API
fix: Created recordings API client and wired form submission to real endpoint
verification: Database has recording, Performance page displays charts with data
files_changed:
  - client/src/api/recordings.ts (created)
  - client/src/pages/recordings/DailyRecording.tsx (wired to API)
