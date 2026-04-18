# Phase 3: Menu & Naming Cleanup — CONTEXT.md

## Prior Context

**From PROJECT.md**:
- Clear menu hierarchy
- Professional appearance

**From ROADMAP.md** (Phase 3: Menu & Naming Cleanup):
- Singular menu names (Units → Unit, Plasmas → Plasma)
- Remove separate Users menu (integrated into RBAC)
- Clear menu hierarchy

## Implementation Decisions Made

### 1. Menu Names
| Option | Decision | Rationale |
|--------|----------|-----------|
| Plural (Units, Plasmas, Cycles) | REJECTED | Cluttered |
| Singular (Unit, Plasma, Cycle) | **SELECTED** | Cleaner, modern |

### 2. Users Menu
| Option | Decision | Rationale |
|--------|----------|-----------|
| Separate Users menu | REJECTED | Redundant with RBAC |
|統合 into RBAC menu | **SELECTED** | Single access point |

### 3. Feed Stock Naming
| Option | Decision | Rationale |
|--------|----------|-----------|
| Feed Stocks | REJECTED | |
| Feed | **SELECTED** | Common term |

### 4. Performance Naming
| Option | Decision | Rationale |
|--------|----------|-----------|
| Performance | **SELECTED** | Proper noun |
| Reports | SKIP | More specific later |

## Menu Structure Final
- Dashboard
- Unit
- Plasma
- Cycle
- Recording
- Feed
- Performance
- Stock Resume
- Audit Log
- RBAC

## Files Modified
- `client/src/components/layout/Sidebar.tsx`

## Gray Areas (Not in Scope)
- Icon customization: Keep MUI default
- Menu reordering: Keep alphabetical
- Nested menus: Not needed