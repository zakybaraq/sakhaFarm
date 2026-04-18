import { useState, useMemo, useEffect } from 'react'
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
  CircularProgress,
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import SearchIcon from '@mui/icons-material/Search'
import { useQuery } from '@tanstack/react-query'
import { listAuditLogs, AuditLogEntry, AuditFilters } from '../../api/audit'

// Common action types for filtering (matching backend)
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

  // Build filters for API call - require at least one filter
  const apiFilters: AuditFilters = useMemo(() => {
    const filters: AuditFilters = {
      limit: 100,
      offset: 0,
    }
    if (actionFilter) filters.action = actionFilter
    if (userFilter) filters.userId = userFilter
    if (dateFrom) filters.startDate = dateFrom
    if (dateTo) filters.endDate = dateTo
    return filters
  }, [actionFilter, userFilter, dateFrom, dateTo])

  // Fetch audit logs from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', apiFilters],
    queryFn: () => listAuditLogs(apiFilters),
    // Require at least one filter to prevent full-table scan error
    enabled: !!(apiFilters.action || apiFilters.userId || apiFilters.startDate || apiFilters.endDate),
    staleTime: 30000, // 30 seconds
  })

  // Transform API data to display format
  const auditLogs: AuditLogEntry[] = data?.logs ?? []

  const filteredLogs = useMemo(() => {
    // If no API filters, apply client-side search
    const noApiFilters = !apiFilters.action && !apiFilters.userId && !apiFilters.startDate && !apiFilters.endDate
    
    return auditLogs.filter((log) => {
      // Always apply search filter client-side
      const matchesSearch = searchText === '' ||
        (log.userId?.toLowerCase().includes(searchText.toLowerCase()) ?? false) ||
        log.action.toLowerCase().includes(searchText.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchText.toLowerCase()) ||
        (log.details?.toLowerCase().includes(searchText.toLowerCase()) ?? false)

      // Apply action filter
      const matchesAction = !actionFilter || log.action === actionFilter
      
      // Apply user filter
      const matchesUser = !userFilter || log.userId === userFilter

      // Apply date filter (client-side if API filter not used)
      const logDate = log.createdAt?.split('T')[0] ?? ''
      const matchesDateFrom = !dateFrom || logDate >= dateFrom
      const matchesDateTo = !dateTo || logDate <= dateTo

      return matchesSearch && matchesAction && matchesUser && matchesDateFrom && matchesDateTo
    })
  }, [auditLogs, searchText, actionFilter, userFilter, dateFrom, dateTo, apiFilters])

  const columns: GridColDef[] = [
    { field: 'createdAt', headerName: 'Timestamp', width: 180, valueFormatter: (value) => {
      if (!value) return ''
      const date = new Date(value)
      return date.toLocaleString('id-ID', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }},
    { field: 'userId', headerName: 'User', width: 200 },
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
    { field: 'resource', headerName: 'Entity', width: 120 },
    { field: 'details', headerName: 'Details', flex: 1, minWidth: 250 },
  ]

  // Get unique users from real data
  const uniqueUsers = [...new Set(auditLogs.map((log) => log.userId).filter(Boolean))]

  // Show error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6">Error Loading Audit Logs</Typography>
          <Typography variant="body2">
            Failed to load audit logs: {(error as Error).message}
          </Typography>
        </Alert>
      </Box>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  // Check if filters are applied (backend requires at least one filter)
  const hasFilters = actionFilter || userFilter || dateFrom || dateTo
  
  if (!hasFilters) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '24px', mb: 3 }}>
          Log Audit
        </Typography>
        <Alert severity="info">
          <Typography variant="body1">Pilih filter untuk melihat log audit</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Backend requires at least one filter (Action, User, atau Tanggal) untuk prevent full-table scan.
          </Typography>
        </Alert>
      </Box>
    )
  }

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
