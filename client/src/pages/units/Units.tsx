import { useState } from 'react'
import { Box, Typography, Button, Paper } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import Switch from '@mui/material/Switch'
import EditIcon from '@mui/icons-material/Edit'
import IconButton from '@mui/material/IconButton'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listUnits, deleteUnit, updateUnit, type Unit } from '../../api/units'
import { useAuth } from '../../contexts/AuthContext'
import { UnitModal } from './UnitModal'

export function UnitsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['units'],
    queryFn: listUnits,
    enabled: !!user,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      setSelectedId(null)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      const unit = data?.units.find(u => u.id === id)
      if (!unit) return
      return updateUnit(id, { isDeleted: !unit.isDeleted })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
    },
  })

  const handleToggle = (id: number) => {
    toggleMutation.mutate(id)
  }

  const handleEdit = (row: Unit) => {
    setSelectedId(row.id)
    setModalOpen(true)
  }

  const handleDelete = () => {
    if (selectedId && confirm('Apakah Anda yakin ingin menghapus unit ini?')) {
      deleteMutation.mutate(selectedId)
    }
  }

  const handleSelectionChange = (newSelection: unknown) => {
    const selected = newSelection as number[]
    setSelectedId(selected[0] ?? null)
  }

  const columns: GridColDef[] = [
    { field: 'code', headerName: 'Kode Unit', width: 120 },
    { field: 'name', headerName: 'Nama Unit', flex: 1, minWidth: 200 },
    { field: 'location', headerName: 'Lokasi', flex: 1, minWidth: 200 },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Switch
          checked={!params.row.isDeleted}
          onChange={(e) => {
            e.stopPropagation()
            handleToggle(params.row.id)
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
  ]

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '24px' }}>
          Manajemen Unit
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
          sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
        >
          Tambah Unit
        </Button>
      </Box>

      <Paper sx={{ height: 500 }}>
        <DataGrid
          rows={data?.units ?? []}
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

      <UnitModal 
        open={modalOpen} 
        onClose={() => { setModalOpen(false); setSelectedId(null); }} 
        selectedId={selectedId}
      />
    </Box>
  )
}