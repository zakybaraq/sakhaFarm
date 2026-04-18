# Phase 1: Sidebar Layout Fixes — CONTEXT.md

## Prior Context

**From PROJECT.md** (Section: UI/UX Design Principles):
- Sidebar collapsible
- Professional appearance
- Clean layout

**From ROADMAP.md** (Phase 1: Sidebar Layout Fixes):
- Fix divider alignment with Navbar
- Move collapse button next to logo (not below)
- Resize logo to fit beside toggle
- Change plural menu names to singular
- Remove duplicate Users menu

## Implementation Decisions Made

### 1. Logo Position
| Option | Decision | Rationale |
|--------|----------|-----------|
| Next to toggle in header | REJECTED | User preference |
| Left-aligned | **SELECTED** | Clean, professional |
| Centered when expanded | REJECTED | |
| Centered when collapsed | **SELECTED** | Visual balance |

### 2. Toggle Button Position
| Option | Decision | Rationale |
|--------|----------|-----------|
| Next to logo in header | REJECTED | User preference |
| Bottom of sidebar | **SELECTED** | Easy access, consistent UX |

### 3. Divider Alignment
| Option | Decision | Rationale |
|--------|----------|-----------|
| Multiple dividers | REJECTED | Inconsistent |
| Single divider (header-list) | REJECTED | |
| Single divider (list-toggle) | **SELECTED** | Aligns with Footer border |

### 4. Menu Names
| Option | Decision | Rationale |
|--------|----------|-----------|
| Plural (Units, Plasmas) | REJECTED | |
| Singular (Unit, Plasma) | **SELECTED** | Cleaner, consistent |

### 5. Users Menu
| Option | Decision | Rationale |
|--------|----------|-----------|
| Separate Users menu | REJECTED | Redundant |
|統合 into RBAC | **SELECTED** | Already accessible |

## Files Modified
- `client/src/components/layout/Sidebar.tsx` — All layout changes

## Gray Areas (Not in Scope)
- Dark mode toggle: Deferred to future phase
- Custom theme colors: Keep default MUI theme
- Sidebar animation: Use MUI default

## Verification
- [x] Build passes
- [x] Toggle button at bottom
- [x] Logo centered when collapsed
- [x] Divider aligns with Footer