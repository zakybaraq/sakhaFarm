import { useState } from 'react'
import { Box, Typography, Button, Paper, Chip } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listUsers, deactivateUser, activateUser, type User } from '../../api/users'
import { useAuth } from '../../contexts/AuthContext'
import { UserModal } from './UserModal'

export function UsersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(),
    enabled: !!user,
  })

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setSelectedId(null)
    },
  })

  const activateMutation = useMutation({
    mutationFn: activateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setSelectedId(null)
    },
  })

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Nama', flex: 1, minWidth: 200 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    { field: 'roleId', headerName: 'Role ID', width: 100 },
    { field: 'tenantId', headerName: 'Tenant ID', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        if (params.value === 'active') {
          return <Chip label="Aktif" color="success" size="small" />
        }
        return <Chip label="Nonaktif" color="default" size="small" />
      },
    },
  ]

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '24px' }}>
          Manajemen Pengguna
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
          sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
        >
          Tambah Pengguna
        </Button>
      </Box>

      <Paper sx={{ height: 500 }}>
        <DataGrid
          rows={data?.users ?? []}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          disableColumnResize
          autosizeOnMount={false}
          getRowId={(row) => row.id}
          onRowSelectionModelChange={(newSelection: unknown) => {
            const selected = newSelection as string[]
            setSelectedId(selected[0] ?? null)
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', fontWeight: 600 },
          }}
        />
      </Paper>

      <UserModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Box>
  )
}