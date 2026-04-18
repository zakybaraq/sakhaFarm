# Phase 08 Research — Modern Responsive Table UI

Phase objective: investigate patterns to implement a modern, responsive TanStack Table-based UI to replace MUI DataGrid across 9 pages with a mobile-first approach.

1) Standard Stack
- TanStack Table v8 (@tanstack/react-table) as the headless core. Official docs: https://tanstack.com/table/v8/docs/overview.md; API: https://tanstack.com/table/v8/docs/api/core/table
- TypeScript-driven: use generic TData and createColumnHelper for safe column definitions.
- UI wrapper: ResponsiveTable.tsx using flexRender for headers/cells; mobile tweaks like horizontal scroll and priority columns.
- Optional virtualization for large datasets: TanStack Virtual (react-virtual) with examples for React tables. Docs: https://tanstack.com/virtual/v3/docs/framework/react/examples/table
- Migration guidance: Migrating to V8 (API changes) in docs. https://tanstack.com/table/v8/docs/guide/migrating

2) Architecture Patterns
- Architecture Pattern: headless core with a small wrapper UI layer
- Use useReactTable / getCoreRowModel / getPaginationRowModel; render via flexRender
- Breakpoint-driven column visibility to implement mobile priority columns
- Horizontal scroll container with sticky first column to preserve quick data context
- Consider TanStack Virtual for large datasets; expose a data loading strategy (server-side vs client-side)

3) Don’t Hand-Roll
- Do not build custom DOM tables, virtualization, or grid internals. Rely on TanStack Table core + TanStack Virtual (if needed).
- Use flexRender and built-in features (sorting, filtering, pagination) rather than custom implementations.

4) Common Pitfalls
- API changes from MUI DataGrid to TanStack Table v8: adjust from DataGrid props to Table columnDefs, use flexRender, and update header/cell render patterns. See Migrating to V8 guide: https://tanstack.com/table/v8/docs/guide/migrating
- React 19 compatibility: some teams report re-render issues; workaround include using "use no memo" directive for table components or disabling React Compiler for that module. See issues: https://github.com/TanStack/table/issues/5567 and https://github.com/TanStack/table/issues/6117
- Typing: prefer createColumnHelper and ColumnDef generics to avoid type drift; see docs and dynamic column examples: https://tanstack.com/table/latest/docs/guide/custom-features and https://zenn.dev/machikita/articles/b52b21e9dd3f0c7
- Performance: enable pagination, use virtualization for large datasets; see virtualization examples: https://tanstack.com/virtual/v3/docs/framework/react/examples/table and column resizing discussions: https://tanstack.com/table/v8/docs/examples/column-resizing-performant

5) Code Examples
5) Code Examples
- Example skeleton using useReactTable and flexRender (see official docs for full pattern).
