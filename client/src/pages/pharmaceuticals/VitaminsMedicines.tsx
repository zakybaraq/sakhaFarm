import { useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Switch from '@mui/material/Switch';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listPharmaceuticals,
  deletePharmaceutical,
  togglePharmaceutical,
  type Pharmaceutical,
} from '../../api/pharmaceuticals';
import { useAuth } from '../../contexts/AuthContext';
import { VitaminsMedicineModal } from './VitaminsMedicineModal';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { ResponsiveTable } from '../../components/ui/ResponsiveTable';
import { ColumnDef, CellContext } from '../../types/table';
import Chip from '@mui/material/Chip';

const columns: ColumnDef<Pharmaceutical>[] = [
  { accessorKey: 'code', header: 'Kode', width: 100 },
  { accessorKey: 'name', header: 'Nama', width: 180 },
  {
    accessorKey: 'category',
    header: 'Kategori',
    width: 100,
    cell: ({ row }: CellContext<Pharmaceutical>) => (
      <Chip
        label={row.original.category === 'vitamin' ? 'Vitamin' : 'Obat'}
        color={row.original.category === 'vitamin' ? 'info' : 'warning'}
        size="small"
      />
    ),
  },
  { accessorKey: 'unitOfMeasure', header: 'Satuan', width: 80 },
  { accessorKey: 'manufacturer', header: 'Produsen', width: 120 },
  {
    accessorKey: 'isActive',
    header: 'Aktif',
    width: 80,
    cell: ({ row }: CellContext<Pharmaceutical>) => (
      <Switch
        checked={row.original.isActive === 1}
        onChange={() => toggleMutation.mutate(row.original.id)}
        size="small"
      />
    ),
  },
  {
    accessorKey: 'actions',
    header: 'Aksi',
    width: 100,
    cell: ({ row }: CellContext<Pharmaceutical>) => (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <IconButton size="small" onClick={() => handleEdit(row.original)}>
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => handleDelete(row.original.id)} color="error">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    ),
  },
];

export function VitaminsMedicinesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Pharmaceutical | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const { data, isLoading } = useQuery({
    queryKey: ['pharmaceuticals', user?.tenantId],
    queryFn: () => listPharmaceuticals({ tenantId: user?.tenantId ?? 1 }),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePharmaceutical(id, user!.tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmaceuticals'] });
      setSnackbar({
        open: true,
        message: 'Obat/Vitamin berhasil dihapus',
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
    mutationFn: (id: number) => togglePharmaceutical(id, user!.tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmaceuticals'] });
    },
    onError: (error: Error) => {
      setSnackbar({
        open: true,
        message: `Gagal toggle: ${error.message}`,
        severity: 'error',
      });
    },
  });

  const handleEdit = (item: Pharmaceutical) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Hapus obat/vitamin ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const items = data?.items || [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Obat & Vitamin</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
        >
          Tambah
        </Button>
      </Box>

      <Paper>
        <ResponsiveTable columns={columns} data={items} loading={isLoading} />
      </Paper>

      <VitaminsMedicineModal
        open={modalOpen}
        onClose={handleClose}
        editingItem={editingItem}
        items={items}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}