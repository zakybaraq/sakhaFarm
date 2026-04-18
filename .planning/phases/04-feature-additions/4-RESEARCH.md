# Phase 4: Feature Additions — RESEARCH.md

## Phase Description

Add interactive features to DataGrid tables:
- Toggle switch for activate/deactivate
- Edit button in each row
- Select dropdowns for foreign key relations

## Standard Stack

| Feature | Library | Notes |
|---------|---------|-------|
| Toggle | MUI Switch | Already in use in codebase |
| Edit button | MUI IconButton + EditIcon | Standard pattern |
| Select dropdown | MUI FormControl + Select | Already in use |

## Architecture Patterns

### Toggle Switch Pattern (DataGrid)
```tsx
{
  field: 'isActive',
  headerName: 'Status',
  width: 100,
  renderCell: (params) => (
    <Switch
      checked={params.value}
      onChange={() => handleToggle(params.row.id)}
      size="small"
    />
  ),
}
```

### Edit Button Pattern (DataGrid Actions Column)
```tsx
{
  field: 'actions',
  headerName: 'Aksi',
  width: 80,
  sortable: false,
  renderCell: (params) => (
    <IconButton size="small" onClick={() => handleEdit(params.row)}>
      <EditIcon fontSize="small" />
    </IconButton>
  ),
}
```

### Select Dropdown Pattern (Modal)
```tsx
<FormControl fullWidth>
  <InputLabel>Unit</InputLabel>
  <Select
    value={formData.unitId}
    label="Unit"
    onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
  >
    {units.map((unit) => (
      <MenuItem key={unit.id} value={unit.id}>
        {unit.name}
      </MenuItem>
    ))}
  </Select>
</FormControl>
```

## Don't Hand-Roll

- Custom toggle components — use MUI Switch
- Custom edit modal — extend existing modals (UnitModal, PlasmaModal, etc.)
- Custom dropdown — use MUI Select

## Common Pitfalls

1. **Switch in DataGrid**: Must prevent event propagation to avoid row selection
2. **Edit button click**: Must call `e.stopPropagation()` to prevent row selection
3. **Select in modal**: Must handle `null` value for empty state
4. **API toggle**: Backend must have toggle endpoint (defer to Phase 5)

## Code Examples

### Units.tsx Toggle
```tsx
import Switch from '@mui/material/Switch'
import EditIcon from '@mui/icons-material/Edit'

// In columns array:
{
  field: 'isActive',
  headerName: 'Aktif',
  width: 80,
  renderCell: (params) => (
    <Switch
      checked={!params.row.isDeleted}
      onChange={(e) => {
        e.stopPropagation()
        handleToggle(params.row.id, params.row.isDeleted)
      }}
      size="small"
    />
  ),
},
{
  field: 'actions',
  headerName: '',
  width: 60,
  sortable: false,
  renderCell: (params) => (
    <IconButton
      size="small"
      onClick={(e) => {
        e.stopPropagation()
        handleEdit(params.row)
      }}
    >
      <EditIcon fontSize="small" />
    </IconButton>
  ),
},
```

### Modal with Select
```tsx
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'

<FormControl fullWidth margin="normal">
  <InputLabel>Unit</InputLabel>
  <Select
    value={form.unitId ?? ''}
    label="Unit"
    onChange={(e) => setForm({ ...form, unitId: e.target.value })}
  >
    {unitsData?.units.map((unit) => (
      <MenuItem key={unit.id} value={unit.id}>
        {unit.name}
      </MenuItem>
    ))}
  </Select>
</FormControl>
```

## Confidence Level

| Feature | Confidence | Notes |
|---------|------------|-------|
| Toggle Switch | HIGH | Standard MUI, existing pattern in codebase |
| Edit Button | HIGH | Standard MUI, existing pattern |
| Select Dropdown | HIGH | MUI Select, already used elsewhere |

## Files Needing Changes

1. `client/src/pages/units/Units.tsx` — toggle + edit
2. `client/src/pages/units/UnitModal.tsx` — already exists
3. `client/src/pages/plasmas/Plasmas.tsx` — toggle + edit
4. `client/src/pages/plasmas/PlasmaModal.tsx` — add unit select
5. `client/src/pages/cycles/Cycles.tsx` — toggle + edit
6. `client/src/pages/cycles/CycleModal.tsx` — add plasma select
7. `client/src/pages/admin/Users.tsx` — toggle + edit
8. `client/src/pages/rbac/RbacManager.tsx` — toggle + edit (both tabs)

## Verification Steps

- [ ] Toggle switches render and are clickable
- [ ] Edit buttons open modal with correct data
- [ ] Select dropdowns show options
- [ ] No console errors
- [ ] Build passes