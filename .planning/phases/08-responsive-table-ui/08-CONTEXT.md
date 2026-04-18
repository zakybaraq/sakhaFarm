# Phase 08: Responsive Table UI - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace all MUI DataGrid components with a modern, responsive table implementation that provides excellent UI/UX on mobile devices (HP/phones). The goal is to create a table that looks good and works well across all screen sizes.
</domain>

<decisions>
## Implementation Decisions

### Problem Statement
- Current MUI DataGrid UI looks "jadul" (outdated/old-fashioned)
- Not responsive on mobile phones
- Need to replace with modern table library

### Library Selection
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| TanStack Table v8 | Headless, fully customizable, React 18, excellent mobile | Requires more setup | **RECOMMENDED** |
| AG Grid | Rich features, good mobile | Heavy, complex | Alternative if needed |
| Material Table | MUI compatible | Still has mobile issues | Not recommended |
| Custom CSS Table | Full control, lightweight | More work to implement | Last resort |

### Recommended Approach
1. Install `@tanstack/react-table` (TanStack Table v8)
2. Create `ResponsiveTable` wrapper component
3. Add mobile-specific features (horizontal scroll, priority columns)
4. Replace DataGrid in all 9 pages incrementally
5. Test on mobile viewport

### Mobile Requirements
- Horizontal scroll for overflow columns
- Collapsible secondary columns on small screens
- Touch-friendly pagination (larger buttons)
- Minimum 44px touch targets
- Readable font sizes on mobile

### File Structure
```
client/src/
├── components/ui/
│   └── ResponsiveTable.tsx    # Main table component
├── hooks/
│   └── useResponsiveTable.ts   # State management hook
└── types/
    └── table.ts               # TypeScript types
```

</decisions>

<canonical_refs>
## Canonical References

**Must Read Before Planning:**
- `.planning/ROADMAP.md` — Phase 08 goal definition
- `.planning/STATE.md` — Current progress and state
- Existing DataGrid usage in all pages

</canonical_refs>

<code_context>
## Current DataGrid Usage (9 pages)

| File | Components | Columns | Features Used |
|------|------------|---------|----------------|
| Units.tsx | 1 | ~5 | Sort, pagination |
| Plasmas.tsx | 1 | ~6 | Sort, pagination, selection |
| Cycles.tsx | 1 | ~7 | Sort, pagination |
| FeedStock.tsx | 1 | ~5 | Sort, pagination |
| StockResume.tsx | 1 | ~6 | Sort, pagination |
| Users.tsx | 1 | ~4 | Sort, pagination, selection |
| AuditLog.tsx | 1 | ~8 | Sort, pagination, filtering |
| RbacManager.tsx | 2 | ~4 each | Sort, pagination, selection |

**Total: 10 DataGrid instances across 9 pages**

</code_context>

<specifics>
## Specific Implementation Ideas

1. **TanStack Table Integration**
   - Use `@tanstack/react-table` for headless table logic
   - Create wrapper component for styling and mobile features
   - Leverage built-in sorting, filtering, pagination

2. **Mobile Features**
   - Priority-based column hiding (show essential columns first)
   - Horizontal scroll with sticky first column
   - Pull-to-refresh gesture support
   - Larger pagination buttons (min 44px)

3. **UI/UX Improvements**
   - Modern gradient header styling
   - Subtle row hover effects
   - Smooth transitions on sort/pagination
   - Loading skeleton with shimmer effect
   - Empty state with illustration

</specifics>

<deferred>
## Deferred Ideas

- Virtual scrolling for large datasets (can be added later if performance issue)
- Advanced filtering UI (date range picker, multi-select)
- Export to CSV/Excel functionality
- Column reorder/drag functionality

</deferred>