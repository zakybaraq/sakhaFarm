# Phase 2: DataGrid Improvements — CONTEXT.md

## Prior Context

**From PROJECT.md** (Section: DataGrid Improvements):
- Fixed dimensions (no resize)
- Better column management
- Consistent styling

**From ROADMAP.md** (Phase 2: DataGrid Improvements):
- Fixed dimensions (disable resize)
- Consistent styling across all pages
- Units, Plasmas, Cycles, Recordings, Feed Stock, Performance, Stock Resume, Audit Log, RBAC, Users

## Current Implementation Analysis

### Files Using DataGrid
```
- client/src/pages/units/Units.tsx          → height: 500
- client/src/pages/plasmas/Plasmas.tsx     → height: 500  
- client/src/pages/cycles/Cycles.tsx       → height: 500
- client/src/pages/feed/FeedStock.tsx     → height: 500
- client/src/pages/reports/StockResume.tsx → height: 500
- client/src/pages/admin/Users.tsx         → height: 500
- client/src/pages/admin/AuditLog.tsx     → height: 500
- client/src/pages/rbac/RbacManager.tsx      → height: 500
```

### Current Pattern
```tsx
<Paper sx={{ height: 500 }}>
  <DataGrid
    rows={data ?? []}
    columns={columns}
    loading={isLoading}
    pageSizeOptions={[10, 25, 50]}
    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
  />
</Paper>
```

### MUI DataGrid v8 Configuration Options
- `autosizeOnMount`: Enable column autosize on mount
- `disableAutosize`: Disable column autosize
- `disableColumnResizing`: Disable column resize
- `columnResizingScrollOffset`: Scroll offset when resizing

## Decisions Made

### 1. Height Approach
| Option | Decision | Rationale |
|--------|----------|-----------|
| Fixed pixel (500px) | **SELECTED** | Already implemented, consistent with existing design |
| Viewport-based | SKIP | More complex, not needed for MVP |
| Theme spacing | SKIP | No significant benefit |

### 2. Disable Column Resize
| Option | Decision | Rationale |
|--------|----------|-----------|
| Disable resize | **DECIDED** | Consistent with "no resize" requirement |
| Keep resize | REJECTED | Contradicts requirement |

### 3. Scope
| Option | Decision | Rationale |
|--------|----------|-----------|
| All pages | **SELECTED** | Consistent UX across app |
| Specific pages only | SKIP | No reason to differentiate |

## Implementation Plan

### Apply to All 8 DataGrid Files
```tsx
// Add to each DataGrid:
<Paper sx={{ height: 500 }}>
  <DataGrid
    // ... existing props
    disableColumnResizing      // Disable column resize
    autosizeOnMount={false}   // Disable auto-resize on mount
  />
</Paper>
```

### Files to Modify
1. `client/src/pages/units/Units.tsx`
2. `client/src/pages/plasmas/Plasmas.tsx`
3. `client/src/pages/cycles/Cycles.tsx`
4. `client/src/pages/feed/FeedStock.tsx`
5. `client/src/pages/reports/StockResume.tsx`
6. `client/src/pages/admin/Users.tsx`
7. `client/src/pages/admin/AuditLog.tsx`
8. `client/src/pages/rbac/RbacManager.tsx`

## Gray Areas (Deferred)

- **Column reorder**: Not in scope, keep default alphabetical order
- **Custom styling**: Apply minimal theme override only (keep existing styling)
- **Pagination options**: Keep default [10, 25, 50]

## Next Steps

Execute Phase 2 by:
1. Add `disableColumnResizing` and `autosizeOnMount={false}` to all DataGrid components
2. Verify build passes
3. Update STATE.md

## Verification Checklist

- [ ] All 8 files updated
- [ ] Build passes: `bun run build`
- [ ] No TypeScript errors: `tsc -b`