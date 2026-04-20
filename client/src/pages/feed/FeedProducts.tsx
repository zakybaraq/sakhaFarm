import { useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ResponsiveTable } from '../../components/ui/ResponsiveTable';
import AddIcon from '@mui/icons-material/Add';
import Switch from '@mui/material/Switch';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listFeedProducts,
  deleteFeedProduct,
  toggleFeedProduct,
  type FeedProduct,
} from '../../api/feed';
import { useAuth } from '../../contexts/AuthContext';
import { FeedProductModal } from './FeedProductModal';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { ColumnDef } from '../../types/table';

export function FeedProductsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const { data } = useQuery({
    queryKey: ['feed-products'],
    queryFn: listFeedProducts,
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFeedProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-products'] });
      setSelectedId(null);
      setSnackbar({
        open: true,
        message: 'Produk pakan berhasil dihapus',
        severity: 'success',
      });
    },
    onError: (error: Error) => {
      setSnackbar({
        open: true,
        message: `Gagal menghapus: ${error.message}`,
        severity: 'error',
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleFeedProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-products'] });
    },
    onError: (error: Error) => {
      setSnackbar({
        open: true,
        message: `Gagal toggle: ${error.message}`,
        severity: 'error',
      });
    },
  });

  const handleToggle = (id: number) => {
    toggleMutation.mutate(id);
  };

  const handleEdit = (row: FeedProduct) => {
    setSelectedId(row.id);
    setModalOpen(true);
  };

  const columns: ColumnDef<FeedProduct>[] = [
    {
      accessorKey: 'code',
      header: 'Kode',
      size: 120,
    },
    {
      accessorKey: 'name',
      header: 'Nama Produk',
      size: 200,
    },
    {
      accessorKey: 'typeName',
      header: 'Jenis',
      size: 120,
      cell: ({ row }) => row.original.typeName ?? '-',
    },
    {
      accessorKey: 'brandName',
      header: 'Merek',
      size: 150,
      cell: ({ row }) => row.original.brandName ?? '-',
    },
    {
      accessorKey: 'zakKgConversion',
      header: 'Zak/Kg',
      size: 100,
      cell: ({ row }) => row.original.zakKgConversion ?? '-',
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      size: 100,
      cell: ({ row }) => (
        <Switch
          size="small"
          checked={!!row.original.isActive}
          onChange={(e) => {
            e.stopPropagation();
            handleToggle(row.original.id);
          }}
        />
      ),
    },
    {
      accessorKey: 'actions',
      header: 'Aksi',
      size: 100,
      cell: ({ row }) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row.original);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Apakah Anda yakin ingin menghapus produk pakan ini?')) {
                deleteMutation.mutate(row.original.id);
              }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

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
          Manajemen Produk Pakan
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
          sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
        >
          Tambah Produk Pakan
        </Button>
      </Box>

      <Paper>
        <ResponsiveTable
          columns={columns}
          data={data?.products ?? []}
          enableSorting
          enableFiltering
          enablePagination
          initialPageSize={10}
          className="w-full"
        />
      </Paper>

      <FeedProductModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedId(null);
        }}
        selectedId={selectedId}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
