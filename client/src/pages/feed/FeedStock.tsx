import { useState } from 'react'
import { 
  Box, 
  Typography, 
  Button, 
  Paper,
  Chip,
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import WarningIcon from '@mui/icons-material/Warning'
import ErrorIcon from '@mui/icons-material/Error'
import { SuratJalanModal } from './SuratJalanModal'
import { LowStockAlert } from '../../components/feed/LowStockAlert'

const mockStockData = [
  { id: 1, plasmaName: 'PlasmaUD Jaya', feedProductName: 'BR 10', totalZak: 45, totalKg: 2250, isLow: false },
  { id: 2, plasmaName: 'PlasmaUD Jaya', feedProductName: 'BR 11', totalZak: 15, totalKg: 750, isLow: true },
  { id: 3, plasmaName: 'PlasmaMakmur', feedProductName: 'BSP', totalZak: 8, totalKg: 400, isLow: true },
  { id: 4, plasmaName: 'PlasmaMakmur', feedProductName: 'BR 10', totalZak: 60, totalKg: 3000, isLow: false },
  { id: 5, plasmaName: 'PlasmaSentosa', feedProductName: 'BR 11', totalZak: 25, totalKg: 1250, isLow: false },
]

const columns: GridColDef[] = [
  { field: 'plasmaName', headerName: 'Plasma', flex: 1, minWidth: 150 },
  { field: 'feedProductName', headerName: 'Jenis Pakan', flex: 1, minWidth: 120 },
  { 
    field: 'totalZak', 
    headerName: 'Total Zak', 
    width: 120,
    align: 'right',
    headerAlign: 'right',
  },
  { 
    field: 'totalKg', 
    headerName: 'Total Kg', 
    width: 120,
    align: 'right',
    headerAlign: 'right',
    valueFormatter: (value: number) => `${value.toLocaleString('id-ID')} kg`,
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: (params) => {
      if (params.row.isLow) {
        if (params.row.totalZak < 20) {
          return (
            <Chip 
              icon={<ErrorIcon sx={{ fontSize: 16 }} />}
              label="Kritis" 
              color="error" 
              size="small" 
              sx={{ fontWeight: 500 }}
            />
          )
        }
        return (
          <Chip 
            icon={<WarningIcon sx={{ fontSize: 16 }} />}
            label="Low Stock" 
            color="warning" 
            size="small" 
            sx={{ fontWeight: 500 }}
          />
        )
      }
      return (
        <Chip 
          label="Normal" 
          color="success" 
          size="small" 
          sx={{ fontWeight: 500 }}
        />
      )
    },
  },
]

export function FeedStock() {
  const [modalOpen, setModalOpen] = useState(false)
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '24px' }}>
          Stok Pakan
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
          sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
        >
          Tambah Surat Jalan
        </Button>
      </Box>
      
      <LowStockAlert />
      
      <Paper sx={{ mt: 3, height: 500 }}>
        <DataGrid
          rows={mockStockData}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
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
      
      <SuratJalanModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSuccess={() => {
          // Invalidate query and refetch - will be implemented with TanStack Query
          console.log('Surat Jalan created, refetching...')
        }}
      />
    </Box>
  )
}