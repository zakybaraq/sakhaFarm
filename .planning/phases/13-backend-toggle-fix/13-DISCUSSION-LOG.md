# Phase 13: Backend Toggle Fix — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-20
**Phase:** 13-backend-toggle-fix
**Areas discussed:** Fix approach, Error UX, Toggle behavior

---

## Fix Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Add isDeleted to PUT body | Add `isDeleted: t.Optional(t.Boolean())` to existing PUT schema — minimal change | ✓ |
| Dedicated PATCH /:id/toggle | New endpoint for semantic clarity — more moving parts | |
| Separate PATCH /:id/status | PATCH with `{ isActive: boolean }` — cleaner contract | |

**User's choice:** Add isDeleted to existing PUT body schema (minimal change, no new endpoints)
**Notes:** Further investigation revealed the correct field is `isActive`, not `isDeleted` — see Toggle Behavior below.

---

## Error UX

| Option | Description | Selected |
|--------|-------------|----------|
| Show specific error from backend | Display backend error message in existing Snackbar (already wired) | ✓ |
| Generic error message | Always show "Gagal menonaktifkan" — simpler but less informative | |
| Claude's discretion | Let planner decide | |

**User's choice:** Surface specific backend error message via existing Snackbar onError handlers.
**Notes:** No extra work needed — current onError handlers already pass error.message to Snackbar.

---

## Toggle Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Change isActive status, row stays visible | Toggle updates `isActive` field (0/1). Record stays in table. | ✓ |
| Soft-delete, row disappears | Toggle sets `deletedAt`. Record filtered out of list. | |

**User's choice:** Toggle changes `isActive` — row stays visible, showing inactive status.
**Notes:** This revealed that the entire toggle should use `isActive` (DB int field), not `isDeleted`/`deletedAt`. `deletedAt` is exclusively for the hard-delete button. Both frontend and backend need to be aligned on `isActive`.

---

## Claude's Discretion

- Whether to type `isActive` as `number` or `boolean` in frontend interfaces
- Exact Drizzle update mapping for the int field (1/0 vs boolean coercion)

## Deferred Ideas

None.
