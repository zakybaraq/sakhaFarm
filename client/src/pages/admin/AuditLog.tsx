import { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import SearchIcon from '@mui/icons-material/Search'

interface AuditEntry {
  id: number
  timestamp: string
  user: string
  action: string
  entity: string
  details: string
}

const mockAuditLogs: AuditEntry[] = [
  { id: 1, timestamp: '2026-04-17 14:32:15', user: 'admin@sakha.com', action: 'CREATE', entity: 'User', details: 'Created user: operator@kuningan.com' },
  { id: 2, timestamp: '2026-04-17 13:45:00', user: 'admin@sakha.com', action: 'UPDATE', entity: 'Role', details: 'Updated role: Manager permissions' },
  { id: 3, timestamp: '2026-04-17 12:30:22', user: 'manager@kuningan.com', action: 'CREATE', entity: 'Recording', details: 'Daily recording for C001 day 14' },
  { id: 4, timestamp: '2026-04-17 11:15:08', user: 'admin@sakha.com', action: 'LOGIN', entity: 'Session', details: 'Successful login from 192.168.1.1' },
  { id: 5, timestamp: '2026-04-17 10:00:00', user: 'operator@kuningan.com', action: 'CREATE', entity: 'SuratJalan', details: 'Created SJ-2026-0017 for BR 10' },
  { id: 6, timestamp: '2026-04-16 16:45:33', user: 'admin@sakha.com', action: 'DELETE', entity: 'User', details: 'Deactivated user: former@operator.com' },
  { id: 7, timestamp: '2026-04-16 15:20:11', user: 'manager@kuningan.com', action: 'UPDATE', entity: 'Recording', details: 'Corrected BW for C002 day 7' },
  { id: 8, timestamp: '2026-04-16 14:00:00', user: 'admin@sakha.com', action: 'CREATE', entity: 'Plasma', details: 'Created plasma: PlasmaBaru for UnitXYZ' },
  { id: 9, timestamp: '2026-04-16 09:30:45', user: 'operator@bojonegoro.com', action: 'LOGIN_FAILED', entity: 'Session', details: 'Failed login attempt (wrong password) from 192.168.2.5' },
  { id: 10, timestamp: '2026-04-15 17:00:00', user: 'admin@sakha.com', action: 'UPDATE', entity: 'Role', details: 'Added permissions to Supervisor role' },
]

const actionTypes = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT']

interface AuditLogProps {
  isAdmin?: boolean
}

export function AuditLog({ isAdmin = true }: AuditLogProps) {
  const [searchText, setSearchText] = useState('')
  const [actionFilter, setActionFilter] = useState<string | null>(null)
  const [userFilter, setUserFilter] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filteredLogs = useMemo(() => {
    return mockAuditLogs.filter((log) => {
      const matchesSearch = searchText === '' ||
        log.user.toLowerCase().includes(searchText.toLowerCase()) ||
        log.action.toLowerCase().includes(searchText.toLowerCase()) ||
        log.entity.toLowerCase().includes(searchText.toLowerCase()) ||
        log.details.toLowerCase().includes(searchText.toLowerCase())

      const matchesAction = !actionFilter || log.action === actionFilter
      const matchesUser = !userFilter || log.user === userFilter

      const logDate = log.timestamp.split(' ')[0]
      const matchesDateFrom = !dateFrom || logDate >= dateFrom
      const matchesDateTo = !dateTo || logDate <= dateTo

      return matchesSearch && matchesAction && matchesUser && matchesDateFrom && matchesDateTo
    })
  }, [searchText, actionFilter, userFilter, dateFrom, dateTo])

  const columns: GridColDef[] = [
    { field: 'timestamp', headerName: 'Timestamp', width: 180 },
    { field: 'user', headerName: 'User', width: 200 },
    {
      field: 'action',
      headerName: 'Action',
      width: 130,
      renderCell: (params) => {
        const action = params.value as string
        let bgColor = '#9E9E9E'
        if (action === 'CREATE') bgColor = '#2E7D32'
        else if (action === 'UPDATE') bgColor = '#0288D1'
        else if (action === 'DELETE') bgColor = '#D32F2F'
        else if (action === 'LOGIN') bgColor = '#1976D2'
        else if (action === 'LOGIN_FAILED') bgColor = '#F57C00'

        return (
          <Typography
            variant="caption"
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: bgColor,
              color: 'white',
              fontWeight: 600,
            }}
          >
            {action}
          </Typography>
        )
      },
    },
    { field: 'entity', headerName: 'Entity', width: 120 },
    { field: 'details', headerName: 'Details', flex: 1, minWidth: 250 },
  ]

  const uniqueUsers = [...new Set(mockAuditLogs.map((log) => log.user))]

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6">Access Denied</Typography>
          <Typography variant="body2">
            Anda tidak memiliki izin untuk mengakses log audit. Hubungi administrator untuk permintaan akses.
          </Typography>
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '24px', mb: 3 }}>
        Log Audit
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Cari..."
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
            sx={{ minWidth: 250 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Action</InputLabel>
            <Select
              value={actionFilter || ''}
              label="Action"
              onChange={(e) => setActionFilter(e.target.value || null)}
            >
              <MenuItem value="">Semua</MenuItem>
              {actionTypes.map((action) => (
                <MenuItem key={action} value={action}>{action}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>User</InputLabel>
            <Select
              value={userFilter || ''}
              label="User"
              onChange={(e) => setUserFilter(e.target.value || null)}
            >
              <MenuItem value="">Semua</MenuItem>
              {uniqueUsers.map((user) => (
                <MenuItem key={user} value={user}>{user}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Dari Tanggal"
            type="date"
            size="small"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />

          <TextField
            label="Sampai Tanggal"
            type="date"
            size="small"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />

          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setSearchText('')
              setActionFilter(null)
              setUserFilter(null)
              setDateFrom('')
              setDateTo('')
            }}
          >
            Reset Filter
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 500 }}>
        <DataGrid
          rows={filteredLogs}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#f8fafc',
              fontWeight: 600,
            },
          }}
        />
      </Paper>
    </Box>
  )
}
