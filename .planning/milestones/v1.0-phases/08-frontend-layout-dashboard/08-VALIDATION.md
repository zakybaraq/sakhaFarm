---
phase: 08
slug: frontend-layout-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-04-17"
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.1.0 + @testing-library/react 16.3.0 |
| **Config file** | client/vitest.config.ts |
| **Quick run command** | `cd client && bun test --reporter=dot` |
| **Full suite command** | `cd client && bun test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd client && bun test --reporter=dot`
- **After every plan wave:** Run `cd client && bun test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | D-01,D-05 | T-08-01 | API client sends credentials: include; no token in localStorage | unit | `cd client && bun test src/api/client.test.ts` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | D-03,D-04 | T-08-02 | Auth context provides user state; cookie-based only | unit | `cd client && bun test src/contexts/AuthContext.test.tsx` | ❌ W0 | ⬜ pending |
| 08-01-03 | 01 | 1 | D-07 | T-08-03 | RequireAuth redirects unauthenticated to /login | unit | `cd client && bun test src/components/RequireAuth.test.tsx` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 1 | D-02 | — | Sidebar renders nav items and collapses | unit | `cd client && bun test src/components/layout/Sidebar.test.tsx` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 1 | D-02 | — | Navbar renders breadcrumbs and user menu | unit | `cd client && bun test src/components/layout/Navbar.test.tsx` | ❌ W0 | ⬜ pending |
| 08-02-03 | 02 | 1 | D-02 | — | Footer renders version and status | unit | `cd client && bun test src/components/layout/Footer.test.tsx` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 2 | D-06 | T-08-04 | Sidebar menu items filtered by permissions | unit | `cd client && bun test src/components/layout/Sidebar.test.tsx` | ❌ W0 | ⬜ pending |
| 08-03-02 | 03 | 2 | D-08 | — | Dashboard shows 4 KPI cards | unit | `cd client && bun test src/pages/Dashboard.test.tsx` | ❌ W0 | ⬜ pending |
| 08-03-03 | 03 | 2 | D-02 | — | Login page form validation and submit | unit | `cd client && bun test src/pages/Login.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `client/src/test/setup.ts` — shared test setup with fetch mock
- [ ] `client/src/api/client.test.ts` — stubs for D-05
- [ ] `client/src/contexts/AuthContext.test.tsx` — stubs for D-03, D-04
- [ ] `client/src/components/RequireAuth.test.tsx` — stubs for D-07
- [ ] `client/src/components/layout/Sidebar.test.tsx` — stubs for D-02, D-06
- [ ] `client/src/components/layout/Navbar.test.tsx` — stubs for D-02
- [ ] `client/src/pages/Dashboard.test.tsx` — stubs for D-08
- [ ] `client/src/pages/Login.test.tsx` — stubs for login flow

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sidebar collapses/expands smoothly | D-02 | Animation visual check | Click toggle, verify animation |
| Responsive layout at breakpoints | D-09 | Viewport-specific behavior | Test at 375px, 768px, 1440px |
| Footer sticks to bottom on short pages | D-02 | CSS sticky behavior | Navigate to short content page |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
