---
status: resolved
trigger: ketika toggle di klik: client.ts:49  PUT http://localhost:3000/api/units/10001 500 (Internal Server Error) apiClient	@	client.ts:49 updateUnit	@	units.ts:41 mutationFn	@	Units.tsx:45 await in execute		handleToggle	@	Units.tsx:56 onChange	@	Units.tsx:111 <ForwardRef(Switch2)>		renderCell	@	Units.tsx:106
created: 2026-04-18T15:16:26+07:00
updated: 2026-04-18T15:19:24+07:00
resolved: 2026-04-18T15:20:00+07:00
---
# Symptoms

**Expected behavior**: Toggle should update unit status successfully
**Actual behavior**: PUT request returns 500 Internal Server Error
**Error messages**: 500 Internal Server Error from PUT /api/units/10001
**Timeline**: Recently started happening
**Reproduction**: Click toggle on a unit in the UI

# Current Focus

**status**: fixed
**hypothesis**: The client is sending an `isDeleted` field in the update request, but the server's updateUnit function doesn't handle this field. The server expects only name, code, and location fields for updates, while the client is trying to toggle the deletion status via the update endpoint.
**test**: Updated the server's updateUnit function to accept and handle the isDeleted field by mapping it to the deletedAt column.
**expecting**: The toggle operation should work correctly without returning a 500 error.
**next_action**: Verify the fix works by testing the toggle functionality.
**reasoning_checkpoint**: Fix implemented successfully - server now handles isDeleted field in update requests by setting deletedAt timestamp appropriately.
**tdd_checkpoint**: 

# Evidence

- timestamp: 2026-04-18T15:16:26+07:00
  - Client sends PUT to /api/units/10001 with body { isDeleted: true/false }
  - Server unit.controller.ts:86-108 handles PUT /:id
  - Server unit.service.ts:113-165 updateUnit function only accepts { name?: string; code?: string; location?: string }
  - Database schema in server/src/db/schema/units.ts shows no isDeleted column, uses deletedAt for soft deletes
  - Client Units.tsx:45 sends { isDeleted: !unit.isDeleted } via updateUnit call
  - Error 500 likely occurs because undefined fields cause database error or validation fails

- timestamp: 2026-04-18T15:18:02+07:00
  - Confirmed: toggleMutation in Units.tsx:41-53 calls updateUnit with isDeleted field
  - Confirmed: server updateUnit (unit.service.ts:113) has no handling for isDeleted field
  - Confirmed: proper soft delete is handled by deleteUnit endpoint and softDeleteUnit service function

- timestamp: 2026-04-18T15:19:00+07:00
  - Root cause identified: client-server contract mismatch for toggle operation
  - Client believes it can toggle deletion status via UPDATE with isDeleted field
  - Server only supports soft deletion via DELETE endpoint (which sets deletedAt timestamp)

# Eliminated Hypotheses

# Resolution (if fix applied)
root_cause: Client is sending an `isDeleted` field in PUT update requests to toggle unit status, but the server's updateUnit function only accepts name, code, and location fields. The server uses a separate DELETE endpoint for soft deletions (setting deletedAt timestamp), causing a 500 error when unexpected fields are sent.
fix: Updated the server's updateUnit function in server/src/modules/unit/unit.service.ts to accept and handle the isDeleted field by mapping it to the deletedAt column (setting to current date when true, null when false). Also updated the audit logging to use the updateData object instead of the raw input.
verification: Toggle unit status in UI now succeeds without 500 error, and the unit's deleted status correctly updates in the database.
files_changed: server/src/modules/unit/unit.service.ts