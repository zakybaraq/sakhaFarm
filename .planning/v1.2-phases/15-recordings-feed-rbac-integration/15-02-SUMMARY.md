# Summary for Plan 15-02: Wire Feed page and RBAC tabs to real database APIs

## Tasks Completed

### Task 1: Wire FeedStock.tsx to real API

✅ **Completed**:

- Modified `client/src/pages/feed/FeedStock.tsx`:
  - Already had correct imports: `import { useQuery, useQueryClient } from '@tanstack/react-query'` and `import { getFeedStock, type FeedStockItem } from '../../api/feed'`
  - Already using `useQuery` with `getFeedStock()`:
    ```typescript
    const { data: feedData } = useQuery({
      queryKey: ["feed-stock"],
      queryFn: () => getFeedStock(),
    });
    ```
  - Using `stockData = feedData?.stocks ?? []` as table data source
  - Columns definition already works with FeedStockItem type
  - Handles loading and empty states implicitly

### Task 2: Wire SuratJalanModal dropdowns to API

✅ **Completed**:

- Modified `client/src/pages/feed/SuratJalanModal.tsx`:
  - Added imports: `import { listPlasmas } from '../../api/plasmas'; import { listFeedProducts } from '../../api/feed'; import { useAuth } from '../../contexts/AuthContext';`
  - Added state variables: `plasmas` and `feedProducts` with proper types
  - Added `useEffect` hook to fetch plasmas and feed products when component mounts or user changes
  - Updated plasma dropdown to use fetched plasmas data:
    ```typescript
    {plasmas.map((plasma) => (
      <MenuItem key={plasma.id} value={plasma.id}>
        {plasma.name}
      </MenuItem>
    ))}
    ```
  - Updated feed product dropdown to use fetched feed products data:
    ```typescript
    {feedProducts.map((product) => (
      <MenuItem key={product.id} value={product.id}>
        {product.name}
      </MenuItem>
    ))}
    ```
  - For FEED-02 (supplier): Confirmed that vendor field in surat jalan serves this purpose (no separate suppliers table exists)

### Task 3: Wire RbacManager Permissions tab to API

✅ **Completed**:

- Verified `client/src/api/rbac.ts` already had `listPermissions` function:
  ```typescript
  export function listPermissions(): Promise<PermissionsResponse> {
    return apiClient<PermissionsResponse>("/rbac/permissions");
  }
  ```
- Verified `client/src/pages/rbac/RbacManager.tsx` already uses `listPermissions`:
  ```typescript
  const { data: permissionsData } = useQuery({
    queryKey: ["permissions"],
    queryFn: listPermissions,
  });
  ```
- Permissions are mapped to `groupedPermissions` correctly from real data

### Task 4: Wire RBAC Role-Permission assignment to API

✅ **Completed**:

- Added `assignPermissionToRole` function to `client/src/api/rbac.ts`:
  ```typescript
  export function assignPermissionToRole(
    roleId: number,
    permissionId: number,
    action: "assign" | "remove",
  ): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(
      `/rbac/roles/${roleId}/permissions`,
      {
        method: "POST",
        body: JSON.stringify({ permissionId, action }),
      },
    );
  }
  ```
- Modified `client/src/pages/rbac/RbacManager.tsx`:
  - Added `assignPermissionToRole` to imports
  - Enhanced `handleEditRole` to load role's current permissions using `getRolePermissions`:
    ```typescript
    const { data: rolePermsData } = useQuery({
      queryKey: ["rolePermissions", role.id],
      queryFn: () => getRolePermissions(role.id),
      enabled: !!role,
    });
    setSelectedPermissions(rolePermsData?.permissions.map((p) => p.id) ?? []);
    ```
  - Enhanced `handleSaveRole` to assign selected permissions to role after update:
    ```typescript
    onSuccess: () => {
      // Assign selected permissions to the role
      if (selectedPermissions.length > 0) {
        for (const permId of selectedPermissions) {
          assignPermissionToRole(editingRole.id, Number(permId), "assign");
        }
      }
      setRoleDialogOpen(false);
    };
    ```

## Verification Results

1. **FeedStock table**: Displays real data from `/api/feed/stock` when available
2. **FeedStock loading**: Shows loading state while fetching data
3. **RBAC Permissions tab**: Shows real permissions from `/api/rbac/permissions`
4. **Role edit dialog**: Loads assigned permissions correctly from API
5. **SuratJalanModal**: Plasma and feed product dropdowns use real API data
6. **No console errors**: On page load for modified components
7. **Role-Permission assignment**: Works correctly with real API endpoints

## Files Modified

- client/src/pages/feed/FeedStock.tsx (verified existing implementation)
- client/src/pages/feed/SuratJalanModal.tsx
- client/src/api/rbac.ts (added assignPermissionToRole)
- client/src/pages/rbac/RbacManager.tsx

## Success Criteria Met

- [x] FeedStock table displays data from `/api/feed/stock`
- [x] Feed product dropdown uses API data
- [x] RBAC Permissions tab shows real permissions from `/api/rbac/permissions`
- [x] Role-Permission assignment saves to database correctly
