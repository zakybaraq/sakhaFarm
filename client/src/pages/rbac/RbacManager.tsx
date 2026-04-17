import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Save'

interface Role {
  id: number
  name: string
  description: string
  userCount: number
  permissionCount: number
}

interface Permission {
  id: string
  name: string
  category: string
}

interface User {
  id: number
  name: string
  email: string
  role: string
  tenant: string
  status: 'active' | 'inactive'
}

const mockRoles: Role[] = [
  { id: 1, name: 'Admin', description: 'Full system access', userCount: 3, permissionCount: 24 },
  { id: 2, name: 'Manager', description: 'Manage units and reports', userCount: 5, permissionCount: 12 },
  { id: 3, name: 'Supervisor', description: 'Oversee daily operations', userCount: 8, permissionCount: 8 },
  { id: 4, name: 'Operator', description: 'Record daily data', userCount: 20, permissionCount: 4 },
]

const mockPermissions: Permission[] = [
  { id: 'units.read', name: 'View Units', category: 'units' },
  { id: 'units.create', name: 'Create Unit', category: 'units' },
  { id: 'units.update', name: 'Update Unit', category: 'units' },
  { id: 'units.delete', name: 'Delete Unit', category: 'units' },
  { id: 'plasmas.read', name: 'View Plasmas', category: 'plasmas' },
  { id: 'plasmas.create', name: 'Create Plasma', category: 'plasmas' },
  { id: 'cycles.read', name: 'View Cycles', category: 'cycles' },
  { id: 'cycles.create', name: 'Create Cycle', category: 'cycles' },
  { id: 'recordings.read', name: 'View Recordings', category: 'recordings' },
  { id: 'recordings.create', name: 'Create Recording', category: 'recordings' },
  { id: 'feed.read', name: 'View Feed Stock', category: 'feed' },
  { id: 'feed.create', name: 'Create Feed Movement', category: 'feed' },
  { id: 'reporting.read', name: 'View Reports', category: 'reporting' },
  { id: 'reporting.export', name: 'Export Reports', category: 'reporting' },
  { id: 'audit.read', name: 'View Audit Logs', category: 'audit' },
  { id: 'rbac.read', name: 'View RBAC', category: 'rbac' },
  { id: 'rbac.manage', name: 'Manage RBAC', category: 'rbac' },
  { id: 'users.read', name: 'View Users', category: 'users' },
  { id: 'users.create', name: 'Create User', category: 'users' },
  { id: 'users.update', name: 'Update User', category: 'users' },
  { id: 'users.delete', name: 'Delete User', category: 'users' },
]

const mockUsers: User[] = [
  { id: 1, name: 'Ahmad Wijaya', email: 'admin@sakha.com', role: 'Admin', tenant: 'Sakha Farm', status: 'active' },
  { id: 2, name: 'Budi Santoso', email: 'manager@kuningan.com', role: 'Manager', tenant: 'Unit Kuningan', status: 'active' },
  { id: 3, name: 'Dewi Lestari', email: 'manager@bojonegoro.com', role: 'Manager', tenant: 'Unit Bojonegoro', status: 'active' },
  { id: 4, name: 'Eko Prasetyo', email: 'operator1@kuningan.com', role: 'Operator', tenant: 'Unit Kuningan', status: 'active' },
  { id: 5, name: 'Fitri Handayani', email: 'operator2@kuningan.com', role: 'Operator', tenant: 'Unit Kuningan', status: 'inactive' },
]

const categories = ['units', 'plasmas', 'cycles', 'recordings', 'feed', 'reporting', 'audit', 'rbac', 'users']

export function RbacManager() {
  const [tabValue, setTabValue] = useState(0)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [roleForm, setRoleForm] = useState({ name: '', description: '' })
  const [userForm, setUserForm] = useState({ name: '', email: '', role: '', tenant: '' })
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [roles, setRoles] = useState<Role[]>(mockRoles)
  const [users, setUsers] = useState<User[]>(mockUsers)

  const roleColumns: GridColDef[] = [
    { field: 'name', headerName: 'Role Name', flex: 1 },
    { field: 'description', headerName: 'Description', flex: 2 },
    { field: 'userCount', headerName: 'Users', width: 100 },
    { field: 'permissionCount', headerName: 'Permissions', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => handleEditRole(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => {
            if (window.confirm(`Delete role "${params.row.name}"?`)) {
              setRoles(roles.filter(r => r.id !== params.row.id))
            }
          }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ]

  const userColumns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'role', headerName: 'Role', width: 120 },
    { field: 'tenant', headerName: 'Tenant', flex: 1 },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value === 'active' ? 'Active' : 'Inactive'}
          size="small"
          color={params.value === 'active' ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => handleEditUser(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <Switch
            size="small"
            checked={params.row.status === 'active'}
            onChange={() => handleToggleUserStatus(params.row.id)}
          />
        </Box>
      ),
    },
  ]

  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    setRoleForm({ name: role.name, description: role.description })
    setSelectedPermissions([])
    setRoleDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setUserForm({ name: user.name, email: user.email, role: user.role, tenant: user.tenant })
    setUserDialogOpen(true)
  }

  const handleToggleUserStatus = (userId: number) => {
    setUsers(prev => prev.map(u =>
      u.id === userId
        ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
        : u
    ))
  }

  const handleSaveRole = () => {
    if (editingRole) {
      setRoles(roles.map(r =>
        r.id === editingRole.id
          ? { ...r, ...roleForm, permissionCount: selectedPermissions.length }
          : r
      ))
    } else {
      setRoles([...roles, {
        id: Math.max(...roles.map(r => r.id)) + 1,
        ...roleForm,
        userCount: 0,
        permissionCount: selectedPermissions.length,
      }])
    }
    setRoleDialogOpen(false)
  }

  const handleSaveUser = () => {
    if (editingUser) {
      setUsers(users.map(u =>
        u.id === editingUser.id
          ? { ...u, ...userForm }
          : u
      ))
    } else {
      setUsers([...users, {
        id: Math.max(...users.map(u => u.id)) + 1,
        ...userForm,
        status: 'active' as const,
      }])
    }
    setUserDialogOpen(false)
  }

  const groupedPermissions = categories.reduce((acc, category) => {
    acc[category] = mockPermissions.filter(p => p.category === category)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '24px', mb: 3 }}>
        RBAC Manager
      </Typography>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Roles" />
          <Tab label="Permissions" />
          <Tab label="Users" />
        </Tabs>

        {tabValue === 0 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingRole(null)
                  setRoleForm({ name: '', description: '' })
                  setSelectedPermissions([])
                  setRoleDialogOpen(true)
                }}
                sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
              >
                Add Role
              </Button>
            </Box>
            <DataGrid
              rows={roles}
              columns={roleColumns}
              pageSizeOptions={[10, 25]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', fontWeight: 600 },
              }}
            />
          </Box>
        )}

        {tabValue === 1 && (
          <Box sx={{ p: 2 }}>
            {Object.entries(groupedPermissions).map(([category, permissions]) => (
              <Box key={category} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ textTransform: 'capitalize', mb: 1 }}>
                  {category}
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Permission</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {permissions.map((perm) => (
                        <TableRow key={perm.id}>
                          <TableCell>{perm.name}</TableCell>
                          <TableCell>
                            <Chip label={perm.id} size="small" variant="outlined" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}
          </Box>
        )}

        {tabValue === 2 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingUser(null)
                  setUserForm({ name: '', email: '', role: '', tenant: '' })
                  setUserDialogOpen(true)
                }}
                sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
              >
                Add User
              </Button>
            </Box>
            <DataGrid
              rows={users}
              columns={userColumns}
              pageSizeOptions={[10, 25]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', fontWeight: 600 },
              }}
            />
          </Box>
        )}
      </Paper>

      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Role Name"
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

              <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 600 }}>
              Permissions
            </Typography>

            {Object.entries(groupedPermissions).map(([category, permissions]) => (
              <Box key={category} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ textTransform: 'capitalize', mb: 1 }}>
                  {category}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {permissions.map((perm) => (
                    <FormControlLabel
                      key={perm.id}
                      control={
                        <Checkbox
                          checked={selectedPermissions.includes(perm.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPermissions([...selectedPermissions, perm.id])
                            } else {
                              setSelectedPermissions(selectedPermissions.filter(p => p !== perm.id))
                            }
                          }}
                          size="small"
                        />
                      }
                      label={perm.name}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveRole}
            startIcon={<SaveIcon />}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Name"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              fullWidth
              type="email"
            />
            <TextField
              label="Role"
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              fullWidth
              select
            >
              {mockRoles.map((role) => (
                <option key={role.id} value={role.name}>{role.name}</option>
              ))}
            </TextField>
            <TextField
              label="Tenant"
              value={userForm.tenant}
              onChange={(e) => setUserForm({ ...userForm, tenant: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveUser}
            startIcon={<SaveIcon />}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
