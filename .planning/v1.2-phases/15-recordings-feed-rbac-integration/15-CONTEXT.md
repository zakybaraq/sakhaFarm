# Phase 15 Context - Recordings, Feed & RBAC Data Integration

## Decisions Made

### REC-01: Cycle Dropdown on Recordings
- Already implemented: Uses `listActiveCycles` from API
- No change needed

### REC-02: Deviasi BW Calculation
- **Decision**: Use cycle-specific standards from database
- Implementation: Query cycle's standard body weight from DB (check if cycle has docType/standardBW field)
- If no cycle-specific standard, use current mockStandards as fallback

### FEED-01 & FEED-02: Feed Data Integration
- **Decision**: Connect Feed page to real database
- FeedStock.tsx: Replace mockStockData with real API data
- Check feed_products table for feed types
- Check suppliers table or feed schema for supplier data
- Supplier dropdown: Connect to DB or remove if not in schema

### RBAC-01, RBAC-02, RBAC-03: RBAC Data Integration
- **Decision**: Verify and connect to real API
- RBAC-01: Roles already use `listRoles` API - verify it works
- RBAC-02: Replace mockPermissions with real permissions from DB
- RBAC-03: Verify role-permission assignment works with real data

## Technical Notes

### Backend Work May Be Needed:
1. Check if cycles table has docType/standardBW fields
2. Check feed schema for products and suppliers tables
3. Check permissions table structure in DB
4. Ensure all APIs return correct data shapes

### Frontend Changes:
1. DailyRecording.tsx: Query cycle standards from API
2. FeedStock.tsx: Wire to feed stock API
3. Feed modal: Wire feed type and supplier dropdowns
4. RbacManager.tsx: Replace mockPermissions with API

## Prior Context
- Phase 14: Cycle status badge, superadmin permissions, phone column completed
- Phase 14 verified with UAT and VERIFICATION docs

## Excluded
None - all Phase 15 requirements to be addressed
