import { useState } from 'react';
import { Box, Typography, Button, Paper, Chip } from '@mui/material';
import { ResponsiveTable } from '../../components/ui/ResponsiveTable';
import AddIcon from '@mui/icons-material/Add';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { SuratJalanModal } from './SuratJalanModal';
import { LowStockAlert } from '../../components/feed/LowStockAlert';
import { ColumnDef } from '../../types/table';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getFeedStock, type FeedStockItem } from '../../api/feed';

const columns: ColumnDef<FeedStockItem>[] = [
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
      const value = row.original.totalKg ?? 0;
      return `${value.toLocaleString('id-ID')} kg`;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    cell: ({ row }) => {
      const isLow = row.original.isLow;
      const totalZak = row.original.totalZak;

      if (isLow) {
        if (totalZak < 20) {
          return (
            <Chip
              icon={<ErrorIcon sx={{ fontSize: 16 }} />}
              label="Kritis"
              color="error"
              size="small"
              sx={{ fontWeight: 500 }}
            />
          );
        }
        return (
          <Chip
            icon={<WarningIcon sx={{ fontSize: 16 }} />}
            label="Low Stock"
            color="warning"
            size="small"
            sx={{ fontWeight: 500 }}
          />
        );
      }
      return <Chip label="Normal" color="success" size="small" sx={{ fontWeight: 500 }} />;
    },
  },
];

export function FeedStock() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: feedData } = useQuery({
    queryKey: ['feed-stock'],
    queryFn: () => getFeedStock(),
  });

  const stockData = feedData?.stocks ?? [];

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
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

      <Paper sx={{ mt: 3 }}>
        <ResponsiveTable
          columns={columns}
          data={stockData}
          enableSorting
          enableFiltering
          enablePagination
          initialPageSize={10}
          className="w-full"
        />
      </Paper>

      <SuratJalanModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['feed-stock'] });
        }}
      />
    </Box>
  );
}
