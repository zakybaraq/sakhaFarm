# Phase 20: Sidebar Reorganization - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Regroup sidebar menu items into logical categories (Master Data, Operations, Reports, Settings) for better usability and navigation.
</domain>

<decisions>
## Implementation Decisions

### D-01: Grouping Structure

- **Master Data**: Units, Plasmas, Feed Types, Feed Brands, Feed Products, Suppliers, Vitamins/Medicines
- **Operations**: Cycles, Recordings, Feed Stock
- **Reports**: Performance, Stock Resume, Audit Log
- **Settings**: RBAC (Users, Roles, Permissions)

### D-02: Section Behavior

- **Hybrid approach**: Master Data and Operations sections expanded by default
- Reports and Settings sections collapsed by default
- User can click to expand/collapse each section

### D-03: Visual Treatment

- Minimal style (bold uppercase section headers, smaller font than menu items)
- No background box for sections
- Section headers are static (no hover effect)
- Menu items have hover and active states

### D-04: Audit Log Placement

- Audit Log included in Reports section (not Settings)
- Reports now has: Performance, Stock Resume, Audit Log

### D-05: Menu Ordering

- **Master Data**: Business flow order - Units → Plasmas → Feed Types → Feed Brands → Feed Products → Suppliers → Vitamins/Medicines
- **Operations**: Cycles → Recordings → Feed Stock
- **Reports**: Performance → Stock Resume → Audit Log
- **Settings**: RBAC

### D-06: Menu Item Mapping

| Path                  | Menu Text      | Category    |
| --------------------- | -------------- | ----------- |
| /units                | Unit           | Master Data |
| /plasmas              | Plasma         | Master Data |
| /feed/types           | Jenis Pakan    | Master Data |
| /feed/brands          | Merek Pakan    | Master Data |
| /feed/products        | Produk Pakan   | Master Data |
| /suppliers            | Supplier       | Master Data |
| /pharmaceuticals      | Obat & Vitamin | Master Data |
| /cycles               | Cycle          | Operations  |
| /recordings           | Recording      | Operations  |
| /feed                 | Feed           | Operations  |
| /reports/performance  | Performance    | Reports     |
| /reports/stock-resume | Stock Resume   | Reports     |
| /reports/audit        | Audit Log      | Reports     |
| /rbac                 | RBAC           | Settings    |

</decisions>

<canonical_refs>

## Canonical References

**Must Read Before Planning:**

- `client/src/components/layout/Sidebar.tsx` — Current sidebar implementation
- `.planning/ROADMAP.md` — Phase 20 goal and requirements
- `.planning/REQUIREMENTS.md` — UI-01, UI-02 requirements

</canonical_refs>

<code_context>

## Existing Code Insights

### Current Sidebar Structure

- Flat list with 15 menu items + 1 section header (Reports)
- Uses MUI List, ListItem, ListItemButton components
- Already has `isSectionHeader` flag for section headers
- Uses `permission` field for RBAC filtering

### Reusable Assets

- Sidebar.tsx component already exists
- Section header pattern already implemented (isSectionHeader flag)
- Collapse/expand state can be tracked locally

### Integration Points

- menuItems array in Sidebar.tsx needs restructuring
- Add section state management (expanded/collapsed per section)
- Already uses react-router-dom for navigation

</code_context>

<specifics>
## Specific Ideas

1. **Section implementation**: Add collapsible behavior - each section needs `expanded` state
2. **Icon assignment**: Consider using different icons for section headers vs menu items
3. **Mobile consideration**: Hybrid behavior (expanded on desktop, collapsed on mobile?)
4. **Animation**: Smooth expand/collapse transition for better UX

</specifics>

<deferred>
## Deferred Ideas

- Virtual scrolling for long menu lists (future enhancement)
- Drag-and-drop menu reordering (future enhancement)
- Menu usage analytics - which items accessed most (infrastructure)

</deferred>

---

_Phase: 20-sidebar-reorganization_
_Context gathered: 2026-04-21_
