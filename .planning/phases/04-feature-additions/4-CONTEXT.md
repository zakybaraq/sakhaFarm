# Phase 4: Feature Additions — CONTEXT.md

## Prior Context

**From PROJECT.md**:
- Toggle for active/deactivate user
- Edit data functionality
- Dropdown relations for foreign keys

**From ROADMAP.md** (Phase 4):
- Toggle for active/deactivate
- Edit data functionality
- Dropdown relations

## Implementation Decisions Made

### 1. Toggle Active/Deactivate (Q1)
| Option | Decision | Rationale |
|--------|----------|-----------|
| Chip status only | REJECTED | No interactivity |
| Switch in row | **SELECTED** | Direct toggle, clear UX |
| Toolbar toggle | SKIP | Less direct |

**Implementation**:
- MUI Switch in status column
- Click to toggle isActive status
- Requires API endpoint: PATCH /api/{resource}/{id}/toggle

### 2. Edit Button (Q2)
| Option | Decision | Rationale |
|--------|----------|-----------|
| Modal existing | NOT ENOUGH | No edit button in grid |
| Edit icon in row | **SELECTED** | Direct access |
| Double-click | SKIP | Not discoverable |

**Implementation**:
- EditIcon button in actions column
- Opens modal with existing data for editing
- All CRUD pages: Units, Plasmas, Cycles, Users, RBAC

### 3. Dropdown Relations (Q3)
| Option | Decision | Rationale |
|--------|----------|-----------|
| Standard MUI Select | **SELECTED** | Simple, familiar |
| Autocomplete | SKIP | Later phase |
| Skip | REJECTED | Required |

**Implementation**:
- MUI Select in modals for foreign keys
- PlasmaModal: select Unit
- CycleModal: select Plasma
- RecordingModal: select Cycle

## Files to Modify

### Units
- Add Switch in status column
- Add Edit button in actions column

### Plasmas
- Add Switch in status column
- Add Edit button in actions column
- Add Unit Select in PlasmaModal

### Cycles
- Add Switch in status column
- Add Edit button in actions column
- Add Plasma Select in CycleModal

### Users
- Add Switch in status column
- Add Edit button in actions column

### RBAC (Roles)
- Add Switch in status column
- Add Edit button in actions column

### RBAC (Users)
- Add Switch in status column
- Add Edit button in actions column

## Gray Areas (Deferred)

- Autocomplete for large lists: Later phase
- Bulk toggle: Later phase
- Undo functionality: Later phase

## Next Steps

Execute Phase 4:
1. Add toggle switch to all status columns
2. Add edit button to all DataGrid action columns
3. Add Select dropdowns to modals
4. Test and verify