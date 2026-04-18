import { useState } from 'react';
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
  Autocomplete,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import DownloadIcon from '@mui/icons-material/Download';
import { exportToXlsx } from '../../utils/exportXlsx';

const mockStockResume = [
  {
    id: 1,
    unitName: 'Unit Kuningan',
    plasmaName: 'PlasmaUD Jaya',
    feedProductName: 'BR 10',
    totalZak: 45,
    totalKg: 2250,
  },
  {
    id: 2,
    unitName: 'Unit Kuningan',
    plasmaName: 'PlasmaUD Jaya',
    feedProductName: 'BR 11',
    totalZak: 15,
    totalKg: 750,
  },
  {
    id: 3,
    unitName: 'Unit Bojonegoro',
    plasmaName: 'PlasmaMakmur',
    feedProductName: 'BSP',
    totalZak: 8,
    totalKg: 400,
  },
  {
    id: 4,
    unitName: 'Unit Bojonegoro',
    plasmaName: 'PlasmaSentosa',
    feedProductName: 'BR 10',
    totalZak: 60,
    totalKg: 3000,
  },
];

const columns: GridColDef[] = [
  { field: 'unitName', headerName: 'Unit', flex: 1, minWidth: 120 },
  { field: 'plasmaName', headerName: 'Plasma', flex: 1, minWidth: 150 },
  { field: 'feedProductName', headerName: 'Jenis Pakan', flex: 1, minWidth: 120 },
  { field: 'totalZak', headerName: 'Total Zak', width: 120, align: 'right', headerAlign: 'right' },
  {
    field: 'totalKg',
    headerName: 'Total Kg',
    width: 120,
    align: 'right',
    headerAlign: 'right',
    valueFormatter: (v: number) => `${v.toLocaleString('id-ID')} kg`,
  },
];

export function StockResume() {
  const [unitFilter, setUnitFilter] = useState<string | null>(null);
  const [plasmaFilter, setPlasmaFilter] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<string | null>(null);

  const handleExport = () => {
    exportToXlsx(mockStockResume, 'Stock_Resume', 'Stock Resume Report');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '24px', mb: 3 }}>
        Laporan Stok Pakan
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Autocomplete
            options={['Unit Kuningan', 'Unit Bojonegoro']}
            value={unitFilter}
            onChange={(_, v) => setUnitFilter(v)}
            sx={{ minWidth: 200 }}
            renderInput={(params) => <TextField {...params} label="Pilih Unit" size="small" />}
          />
          <Autocomplete
            options={['PlasmaUD Jaya', 'PlasmaMakmur', 'PlasmaSentosa']}
            value={plasmaFilter}
            onChange={(_, v) => setPlasmaFilter(v)}
            sx={{ minWidth: 200 }}
            renderInput={(params) => <TextField {...params} label="Pilih Plasma" size="small" />}
          />
          <Autocomplete
            options={['BR 10', 'BR 11', 'BSP']}
            value={feedFilter}
            onChange={(_, v) => setFeedFilter(v)}
            sx={{ minWidth: 200 }}
            renderInput={(params) => <TextField {...params} label="Jenis Pakan" size="small" />}
          />
          <TextField
            label="Tanggal Mulai"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
          <TextField
            label="Tanggal Akhir"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
          >
            Export Excel
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 500 }}>
        <DataGrid
          rows={mockStockResume}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', fontWeight: 600 },
          }}
        />
      </Paper>
    </Box>
  );
}
