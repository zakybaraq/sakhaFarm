# Phase 15 UAT - Recordings, Feed & RBAC Data Integration

## Verification Tests

### REC-01: Cycle Dropdown on Recordings
| Test | Expected | Status |
|------|----------|--------|
| Cycle dropdown populated from API | listActiveCycles called | ✅ Already done |

### REC-02: Deviasi BW from DB Standards
| Test | Expected | Status |
|------|----------|--------|
| Standards fetched from /api/standards/:docType | useQuery with standards key | ✅ IMPLEMENTED |
| Fallback to mockStandards if API empty | mockStandards fallback logic | ✅ IMPLEMENTED |
| Deviasi BW shows dash when no data | bwDeviation === null → '-' | ✅ IMPLEMENTED |

**Code Evidence:**
- DailyRecording.tsx lines 53-58: useQuery for standards API
- DailyRecording.tsx lines 61-63: fallback to mockStandards
- useRecordingCalculations.ts line 21: bwDeviation = null when no data
- RecordingCards.tsx line 86: shows '-' when bwDeviation === null

### FEED-01 & FEED-02: Feed Data Integration
| Test | Expected | Status |
|------|----------|--------|
| FeedStock uses real API data | getFeedStock called | ✅ IMPLEMENTED |
| Mock data removed | No mockStockData array | ✅ VERIFIED |
| Refetch on Surat Jalan creation | invalidateQueries on success | ✅ IMPLEMENTED |

**Code Evidence:**
- FeedStock.tsx lines 10-11: getFeedStock import
- FeedStock.tsx lines 23-27: useQuery for feed-stock
- FeedStock.tsx line 162: queryClient.invalidateQueries

### RBAC-02 & RBAC-03: Permissions & Role Assignment
| Test | Expected | Status |
|------|----------|--------|
| Permissions from API | listPermissions called | ✅ IMPLEMENTED |
| Mock permissions removed | No mockPermissions usage | ✅ VERIFIED |
| Role-permission assignment works | groupedPermissions uses API data | ✅ IMPLEMENTED |

**Code Evidence:**
- rbac.ts lines 111-119: listPermissions function
- RbacManager.tsx line 32: listPermissions import
- RbacManager.tsx lines 119-122: useQuery for permissions
- RbacManager.tsx line 353: groupedPermissions uses API data

---

## UAT Summary

| Requirement | Test Status |
|-------------|--------------|
| REC-01 | ✅ PASS (already done) |
| REC-02 | ✅ PASS |
| FEED-01 | ✅ PASS |
| FEED-02 | ✅ PASS |
| RBAC-01 | ✅ PASS (already done) |
| RBAC-02 | ✅ PASS |
| RBAC-03 | ✅ PASS |

**Overall: 7/7 PASS**

All implementation verified against code. Ready for user acceptance testing.

---

## Manual Test Instructions

1. **Deviasi BW**: Navigate to Recordings page, verify standards load from API. Show dash when no recording data.
2. **Feed Stock**: Navigate to Feed page, verify table shows real data (not mock).
3. **RBAC Permissions**: Navigate to RBAC Manager → Permissions tab, verify permissions load from API.
4. **Role-Permission Assignment**: Edit a role, verify permissions checkboxes work with real data.
