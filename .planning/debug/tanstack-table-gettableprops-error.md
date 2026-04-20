---
status: investigating
trigger: masih error Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
Plasmas.tsx:181 TypeError: getTableProps is not a function
    at ResponsiveTable (ResponsiveTable.tsx:52:13)
    at Object.react_stack_bottom_frame (react-dom_client.js?v=c6a551bf:18509:20)
    at renderWithHooks (react-dom_client.js?v=c6a551bf:5654:24)
    at updateFunctionComponent (react-dom_client.js?v=c6a551bf:7475:21)
    at beginWork (react-dom_client.js?v=c6a551bf:8525:20)
    at runWithFiberInDEV (react-dom_client.js?v=c6a551bf:997:72)
    at performUnitOfWork (react-dom_client.js?v=c6a551bf:12561:98)
    at workLoopSync (react-dom_client.js?v=c6a551bf:12424:43)
    at renderRootSync (react-dom_client.js?v=c6a551bf:12408:13)
    at performWorkOnRoot (react-dom_client.js?v=c6a551bf:11827:37)
setelah ganti datagrid dari mui ke tanstack
symptoms:
  expected: Should display plasmas table with data
  actual: TypeError: getTableProps is not a function
  error_messages: TypeError: getTableProps is not a function
  timeline: setelah ganti datagrid dari mui ke tanstack
---

# Debug Session: tanstack-table-gettableprops-error

## Current Focus
- **Status**: investigating
- **Hypothesis**: The `useResponsiveTable` hook is not returning the expected `getTableProps` function, likely due to incorrect table instance setup or missing TanStack Table v8 integration
- **Test**: Verify that `useResponsiveTable` returns a valid table object with `getTableProps` method
- **Expecting**: `getTableProps` should be a function that returns table props for the `<table>` element
- **Next Action**: Examine the `useResponsiveTable` hook implementation and verify it correctly uses `@tanstack/react-table`
- **Reasoning Checkpoint**: 
- **TDD Checkpoint**:

## Evidence
- [timestamp: 2026-04-18T16:37:00+07:00] Error occurs at ResponsiveTable.tsx:52:13 where `{...getTableProps()}` is called
- [timestamp: 2026-04-18T16:37:00+07:00] The error indicates `getTableProps` is not a function, suggesting it's undefined or null
- [timestamp: 2026-04-18T16:37:00+07:00] User mentioned issue started after changing datagrid from MUI to TanStack
- [timestamp: 2026-04-18T16:37:00+07:00] Plasmas.tsx line 181 shows `<ResponsiveTable>` component usage
- [timestamp: 2026-04-18T16:37:00+07:00] ResponsiveTable.tsx uses `useResponsiveTable` hook from '@/hooks/useResponsiveTable'
- [timestamp: 2026-04-18T16:37:00+07:00] useResponsiveTable.ts imports from "@tanstack/react-table" and attempts to create table instance

## Eliminated
- [hypothesis]: Missing TanStack Table v8 installation - unlikely as other parts of the app seem to use it
- [hypothesis]: Incorrect import path for useResponsiveTable - the import `@/hooks/useResponsiveTable` appears correct based on file structure

## Resolution
(root_cause, fix, verification, files_changed will be populated as investigation progresses)
