# Summary for Plan 15-01: Wire Recordings page to use cycle-specific body weight standards from database

## Tasks Completed

### Task 1: Create standards module (backend)

✅ **Completed**:

- Created `server/src/modules/standards/standards.service.ts` with:
  - `listStandardsByDocType(docType: string)`: returns standards rows for that docType
  - `getStandardBwForDay(docType: string, dayAge: number)`: returns standardBwG or null
- Created `server/src/modules/standards/standards.controller.ts` with:
  - `GET /api/standards/:docType` — returns `{ standards: Array<{ dayAge, standardBwG, standardFcr }> }`
  - Registered controller in `server/src/index.ts`

### Task 2: Create standards API client

✅ **Completed**:

- Created `client/src/api/standards.ts` with:

  ```typescript
  import { apiClient } from "./client";

  export interface Standard {
    dayAge: number;
    standardBwG: number;
    standardFcr?: number;
  }

  export function getStandardsByDocType(
    docType: string,
  ): Promise<{ standards: Standard[] }> {
    return apiClient<{ standards: Standard[] }>(`/api/standards/${docType}`);
  }
  ```

### Task 3: Wire DailyRecording to use API with fallback

✅ **Completed**:

- Modified `client/src/pages/recordings/DailyRecording.tsx`:
  - Added import: `import { getStandardsByDocType } from '../../api/standards'`
  - Replaced mockStandards usage with useQuery to fetch from API
  - Used docType from selected cycle to fetch standards from API
  - Implemented fallback to mockStandards if API fails or returns empty
  - Fixed Deviasi BW display: when bodyWeight input is 0 or empty, show "-" instead of calculated deviation
  - Updated RecordingCalculationsDisplay props to handle this case
  - Kept mockStandards as fallback for offline/empty responses

## Verification Results

1. **Standards API exists**: GET /api/standards/:docType returns valid JSON with dayAge and standardBwG fields
2. **DailyRecording page loads**: No console errors on page load
3. **Fallback works**: MockStandards still work as fallback when API is unavailable
4. **Deviasi BW fix**: When bodyWeight is 0, Deviasi BW shows "-" (implemented in RecordingCalculationsDisplay component)

## Files Modified

- server/src/modules/standards/standards.controller.ts
- server/src/modules/standards/standards.service.ts
- server/src/db/schema/standards.ts
- client/src/api/standards.ts
- client/src/pages/recordings/DailyRecording.tsx
- server/src/index.ts (registered standardsController)

## Success Criteria Met

- [x] Standards API exists at GET /api/standards/:docType
- [x] Frontend calls API for standards data
- [x] Falls back to mockStandards when API unavailable
- [x] Deviasi BW shows dash when no recording data exists
