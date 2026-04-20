import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Paper, TextField, Button, Autocomplete, CircularProgress } from '@mui/material';
import { ResponsiveTable } from '../../components/ui/ResponsiveTable';
import DownloadIcon from '@mui/icons-material/Download';
import { exportToXlsx } from '../../utils/exportXlsx';
import { ColumnDef } from '../../types/table';
import { getStockResume, StockResumeItem } from '../../api/reporting';
import { listUnits, type Unit } from '../../api/units';
import { listPlasmas, type PlasmasResponse, type Plasma } from '../../api/plasmas';
import { listFeedProducts, type FeedProduct } from '../../api/feed';
import { useAuth } from '../../contexts/AuthContext';

const columns: ColumnDef<StockResumeItem>[] = [
  {
    accessorKey: 'unitName',
    header: 'Unit',
    size: 120,
  },
  {
    accessorKey: 'plasmaName',
    header: 'Plasma',
    size: 150,
  },
  {
    accessorKey: 'feedProductName',
    header: 'Jenis Pakan',
    size: 120,
  },
  {
    accessorKey: 'totalZak',
    header: 'Total Zak',
    size: 120,
    align: 'right',
    headerAlign: 'right',
  },
  {
    accessorKey: 'totalKg',
    header: 'Total Kg',
    size: 120,
    align: 'right',
    headerAlign: 'right',
    cell: ({ row }) => {
      const value = row.original.totalKg;
      return `${value.toLocaleString('id-ID')} kg`;
    },
  },
];

export function StockResume() {
  const { user } = useAuth();
  const [unitId, setUnitId] = useState<number | null>(null);
  const [plasmaId, setPlasmaId] = useState<number | null>(null);
  const [feedProductId, setFeedProductId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: listUnits,
  });

  const { data: plasmasData } = useQuery<PlasmasResponse>({
    queryKey: ['plasmas'],
    queryFn: () => listPlasmas(),
  });

  const { data: feedProductsData } = useQuery({
    queryKey: ['feed-products'],
    queryFn: listFeedProducts,
  });

  const { data: stockResumeData, isLoading } = useQuery({
    queryKey: ['stock-resume', unitId, plasmaId, feedProductId, dateFrom, dateTo],
    queryFn: () =>
      getStockResume(user?.tenantId ?? 1, {
        unitId: unitId ?? undefined,
        plasmaId: plasmaId ?? undefined,
        feedProductId: feedProductId ?? undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
    enabled: !!user,
  });

  const units = useMemo<Unit[]>(() => unitsData?.units ?? [], [unitsData]);
  const plasmas = useMemo<Plasma[]>(() => plasmasData?.plasmas ?? [], [plasmasData]);
  const feedProducts = useMemo<FeedProduct[]>(() => feedProductsData?.products ?? [], [feedProductsData]);
  const rows = useMemo(() => stockResumeData?.data ?? [], [stockResumeData]);

  const handleExport = () => {
    exportToXlsx(rows as any[], 'Stock_Resume', 'Stock Resume Report');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '24px', mb: 3 }}>
        Laporan Stok Pakan
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Autocomplete
            options={units}
            getOptionLabel={(option) => option.name}
            value={units.find((u) => u.id === unitId) ?? null}
            onChange={(_, v) => setUnitId(v?.id ?? null)}
            sx={{ minWidth: 200 }}
            renderInput={(params) => <TextField {...params} label="Pilih Unit" size="small" />}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
          <Autocomplete
            options={plasmas}
            getOptionLabel={(option) => option.name}
            value={plasmas.find((p) => p.id === plasmaId) ?? null}
            onChange={(_, v) => setPlasmaId(v?.id ?? null)}
            sx={{ minWidth: 200 }}
            renderInput={(params) => <TextField {...params} label="Pilih Plasma" size="small" />}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
          <Autocomplete
            options={feedProducts}
            getOptionLabel={(option) => option.name}
            value={feedProducts.find((fp) => fp.id === feedProductId) ?? null}
            onChange={(_, v) => setFeedProductId(v?.id ?? null)}
            sx={{ minWidth: 200 }}
            renderInput={(params) => <TextField {...params} label="Jenis Pakan" size="small" />}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
          <TextField
            label="Tanggal Mulai"
            type="date"
            size="small"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
          <TextField
            label="Tanggal Akhir"
            type="date"
            size="small"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
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

      <Paper>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <ResponsiveTable
            columns={columns}
            data={rows}
            enableSorting
            enableFiltering
            enablePagination
            initialPageSize={10}
            className="w-full"
          />
        )}
      </Paper>
    </Box>
  );
}