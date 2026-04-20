import { useState, useMemo } from 'react';
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
} from '@mui/material';
import { ResponsiveTable } from '../../components/ui/ResponsiveTable';
import SearchIcon from '@mui/icons-material/Search';
import { useQuery } from '@tanstack/react-query';
import { listAuditLogs, AuditLogEntry, AuditFilters } from '../../api/audit';
import { listUsers } from '../../api/users';
import { ColumnDef } from '../../types/table';

// Common action types for filtering (matching backend - lowercase stored in DB)
const actionTypes = [
  { value: 'create', label: 'CREATE' },
  { value: 'update', label: 'UPDATE' },
  { value: 'delete', label: 'DELETE' },
  { value: 'login', label: 'LOGIN' },
  { value: 'login_failed', label: 'LOGIN_FAILED' },
  { value: 'logout', label: 'LOGOUT' },
];

interface AuditLogProps {
  isAdmin?: boolean;
}

export function AuditLog({ isAdmin = true }: AuditLogProps) {
  const [searchText, setSearchText] = useState('');
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Build filters for API call - require at least one filter
  const apiFilters: AuditFilters = useMemo(() => {
    const filters: AuditFilters = {
      limit: 100,
      offset: 0,
    };
    if (actionFilter) filters.action = actionFilter;
    if (userFilter) filters.userId = userFilter;
    if (dateFrom) filters.startDate = dateFrom;
    if (dateTo) filters.endDate = dateTo;
    return filters;
  }, [actionFilter, userFilter, dateFrom, dateTo]);

  // Fetch audit logs from API
  const { data, error, isLoading } = useQuery({
    queryKey: ['audit-logs', actionFilter, userFilter, dateFrom, dateTo],
    queryFn: () => listAuditLogs(apiFilters),
    // Require at least one filter to prevent full-table scan error
    enabled: !!(
      actionFilter ||
      userFilter ||
      dateFrom ||
      dateTo
    ),
    staleTime: 30000, // 30 seconds
  });

  // Fetch users separately to populate dropdown with emails
  const { data: usersData } = useQuery({
    queryKey: ['audit-users'],
    queryFn: () => listUsers(),
    staleTime: 300000, // 5 minutes
  });

  // Build userId → email map
  const userMap = useMemo(() => {
    const map: Record<string, string> = {};
    usersData?.users?.forEach((u: { id: string; email: string }) => {
      map[u.id] = u.email;
    });
    return map;
  }, [usersData]);

  const auditLogs = useMemo<AuditLogEntry[]>(() => data?.logs ?? [], [data]);

  // Enrich audit logs with user email
  const enrichedLogs = useMemo(() => {
    return auditLogs.map((log) => ({
      ...log,
      userEmail: userMap[log.userId] || log.userId,
    }));
  }, [auditLogs, userMap]);

  // Get unique users from real data
  const uniqueUsers = useMemo(() => {
    const userIds = [...new Set(auditLogs.map((log) => log.userId).filter(Boolean))];
    return userIds.map((id) => ({ id, email: userMap[id] || id }));
  }, [auditLogs, userMap]);

  const filteredLogs = useMemo(() => {
    return enrichedLogs.filter((log) => {
      // Always apply search filter client-side
      const matchesSearch =
        searchText === '' ||
        (log.userEmail?.toLowerCase().includes(searchText.toLowerCase()) ?? false) ||
        (log.userId?.toLowerCase().includes(searchText.toLowerCase()) ?? false) ||
        log.action.toLowerCase().includes(searchText.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchText.toLowerCase()) ||
        (log.details?.toLowerCase().includes(searchText.toLowerCase()) ?? false);

      // Apply action filter
      const matchesAction = !actionFilter || log.action === actionFilter;

      // Apply user filter (compare by userId since dropdown stores userId)
      const matchesUser = !userFilter || log.userId === userFilter;

      // Apply date filter (client-side if API filter not used)
      const logDate = log.createdAt?.split('T')[0] ?? '';
      const matchesDateFrom = !dateFrom || logDate >= dateFrom;
      const matchesDateTo = !dateTo || logDate <= dateTo;

      return matchesSearch && matchesAction && matchesUser && matchesDateFrom && matchesDateTo;
    });
  }, [enrichedLogs, searchText, actionFilter, userFilter, dateFrom, dateTo]);

  const columns: ColumnDef<AuditLogEntry>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Timestamp',
      size: 180,
      cell: ({ row }) => {
        const value = row.original.createdAt;
        if (!value) return '';
        const date = new Date(value);
        return date.toLocaleString('id-ID', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      },
    },
    {
      accessorKey: 'userEmail',
      header: 'User',
      size: 200,
      cell: ({ row }) => row.original.userEmail ?? row.original.userId ?? '-',
    },
    {
      accessorKey: 'action',
      header: 'Action',
      size: 130,
      cell: ({ row }) => {
        const action = row.original.action as string;
        let bgColor = '#9E9E9E';
        if (action === 'CREATE') bgColor = '#2E7D32';
        else if (action === 'UPDATE') bgColor = '#0288D1';
        else if (action === 'DELETE') bgColor = '#D32F2F';
        else if (action === 'LOGIN') bgColor = '#1976D2';
        else if (action === 'LOGIN_FAILED') bgColor = '#F57C00';

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
        );
      },
    },
    {
      accessorKey: 'resource',
      header: 'Entity',
      size: 120,
    },
    {
      accessorKey: 'details',
      header: 'Details',
      size: 250,
    },
  ];

  // Show error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6">Error Loading Audit Logs</Typography>
          <Typography variant="body2">Failed to load audit logs: {error.message}</Typography>
        </Alert>
      </Box>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Check if filters are applied (backend requires at least one filter)
  const _hasFilters = actionFilter || userFilter || dateFrom || dateTo;

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6">Access Denied</Typography>
          <Typography variant="body2">
            Anda tidak memiliki izin untuk mengakses log audit. Hubungi administrator untuk
            permintaan akses.
          </Typography>
        </Alert>
      </Box>
    );
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
                <MenuItem key={action.value} value={action.value}>
                  {action.label}
                </MenuItem>
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
              {uniqueUsers.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.email}
                </MenuItem>
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
              setSearchText('');
              setActionFilter(null);
              setUserFilter(null);
              setDateFrom('');
              setDateTo('');
            }}
          >
            Reset Filter
          </Button>
        </Box>
      </Paper>

      <Paper>
        <ResponsiveTable
          columns={columns}
          data={filteredLogs}
          enableSorting
          enableFiltering
          enablePagination
          initialPageSize={10}
          className="w-full"
        />
      </Paper>
    </Box>
  );
}
