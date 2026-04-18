import { useState } from 'react'
import { Box, Typography, Button, Paper, Chip, Switch, IconButton, Box as MuiBox } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listCycles, deleteCycle, updateCycle, type Cycle } from '../../api/cycles'
import { listPlasmas, type Plasma } from '../../api/plasmas'
import { useAuth } from '../../contexts/AuthContext'
import { CycleModal } from './CycleModal'

export function CyclesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  const { data: plasmasData } = useQuery({
    queryKey: ['plasmas'],
    queryFn: () => listPlasmas(),
    enabled: !!user,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['cycles'],
    queryFn: listCycles,
    enabled: !!user,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCycle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] })
      setSelectedId(null)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      const cycle = data?.cycles.find((c: Cycle) => c.id === id)
      if (!cycle) return
      const newStatus = cycle.status === 'Active' ? 'Completed' : 'Active'
      return updateCycle(id, { status: newStatus })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cycles'] }),
  })

  const handleToggle = (id: number) => {
    toggleMutation.mutate(id)
  }

  const handleDelete = () => {
    if (selectedId && confirm('Apakah Anda yakin ingin menghapus siklus ini?')) {
      deleteMutation.mutate(selectedId)
    }
  }

  const handleSelectionChange = (newSelection: unknown) => {
    const selected = newSelection as number[]
    setSelectedId(selected[0] ?? null)
  }

  const handleEdit = (row: Cycle) => {
    setEditId(row.id)
    setModalOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'success'
      case 'Completed':
        return 'info'
      case 'Failed':
        return 'error'
      default:
        return 'default'
    }
  }

  const columns: GridColDef[] = [
    { field: 'cycleNumber', headerName: 'No. Siklus', width: 120 },
    { 
      field: 'plasmaId', 
      headerName: 'Plasma', 
      width: 180,
      valueGetter: (value, row) => {
        const plasma = plasmasData?.plasmas.find((p: Plasma) => p.id === value)
        return plasma?.name ?? value
      }
    },
    { field: 'docType', headerName: 'Jenis DOC', width: 120 },
    { field: 'chickInDate', headerName: 'Tgl. Chick In', width: 140 },
    { field: 'initialPopulation', headerName: 'Populasi Awal', width: 140 },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.row.status === 'Active' ? 'Aktif' : 'Selesai'} 
          color={getStatusColor(params.row.status)} 
          size="small" 
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Aksi',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <MuiBox sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
          <Switch
            size="small"
            checked={params.row.status === 'Active'}
            onChange={(e) => {
              e.stopPropagation()
              handleToggle(params.row.id)
            }}
          />
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              handleEdit(params.row)
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </MuiBox>
      ),
    },
  ]

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '24px' }}>
          Manajemen Siklus
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
          sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
        >
          Tambah Siklus
        </Button>
      </Box>

      <Paper sx={{ height: 500 }}>
        <DataGrid
          rows={data?.cycles ?? []}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          disableColumnResize
          autosizeOnMount={false}
          onRowSelectionModelChange={handleSelectionChange}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', fontWeight: 600 },
          }}
        />
      </Paper>

      <CycleModal 
        open={modalOpen} 
        onClose={() => { setModalOpen(false); setEditId(null); }} 
        editId={editId}
      />
    </Box>
  )
}