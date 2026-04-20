---
phase: 17
slug: feed-types-brands-management
status: validated
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-21
validated: 2026-04-21
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `client/vitest.config.ts` |
| **Quick run command** | `cd client && bun run test --run` |
| **Full suite command** | `cd client && bun run test --run && cd ../server && bun run typecheck` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd client && bun run test --run`
- **After every plan wave:** Run `cd client && bun run test --run && cd ../server && bun run typecheck`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | FEED-TYPE-01 | — | tenantId scoped queries only | typecheck | `cd server && bun run typecheck` | ✅ | ⬜ pending |
| 17-01-02 | 01 | 1 | FEED-TYPE-01 | — | tenantId scoped queries only | typecheck | `cd server && bun run typecheck` | ❌ W0 | ⬜ pending |
| 17-02-01 | 02 | 1 | FEED-BRAND-01 | — | tenantId scoped queries only | typecheck | `cd server && bun run typecheck` | ❌ W0 | ⬜ pending |
| 17-03-01 | 03 | 2 | FEED-TYPE-01 | — | N/A | unit | `cd client && bun run test --run` | ✅ | ✅ COVERED |
| 17-03-02 | 03 | 2 | FEED-BRAND-01 | — | N/A | unit | `cd client && bun run test --run` | ✅ | ✅ COVERED |
| 17-04-01 | 04 | 2 | FEED-TYPE-01 | — | N/A | typecheck | `cd client && bun run typecheck` | ✅ | ✅ COVERED |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing vitest and TypeScript infrastructure covers all phase requirements — no new test framework installation needed.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Migration data integrity: `phase` values seeded to `feed_types`, `typeId` backfilled on all feed_products | FEED-TYPE-01 | DB state validation requires live DB inspection | Run `SELECT COUNT(*) FROM feed_products WHERE typeId IS NULL AND deletedAt IS NULL`; expect 0 |
| Feed product create/edit dropdowns populate from new tables | FEED-TYPE-01, FEED-BRAND-01 | UI integration test | Open FeedProducts page → create/edit modal → verify Type and Brand dropdowns load |
| SuratJalanModal feed product dropdown uses dynamic API | FEED-TYPE-01 | UI integration test | Open SuratJalanModal → verify product options match DB, not hardcoded items |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---

## Validation Audit 2026-04-21

| Metric | Count |
|--------|-------|
| Gaps found | 3 |
| Resolved | 3 |
| Escalated | 0 |

Gap resolution:
1. Created `src/pages/feed/__tests__/FeedTypes.test.tsx` — FEED-TYPE-03 ✓
2. Created `src/pages/feed/__tests__/FeedBrands.test.tsx` — FEED-BRAND-03 ✓
3. Created `src/pages/feed/__tests__/FeedProducts.test.tsx` — FEED-PRODUCT-01 ✓
