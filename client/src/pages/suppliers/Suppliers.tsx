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
  listSuppliers,
  deleteSupplier,
  toggleSupplier,
  type Supplier,
} from '../../api/suppliers';
import { useAuth } from '../../contexts/AuthContext';
import { SupplierModal } from './SupplierModal';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { ColumnDef, CellContext } from '../../types/table';

const columns: ColumnDef<Supplier>[] = [
  { accessorKey: 'code', header: 'Kode', width: 100 },
  { accessorKey: 'name', header: 'Nama', width: 150 },
  { accessorKey: 'contactPerson', header: 'Contact', width: 120 },
  { accessorKey: 'phone', header: 'Telepon', width: 120 },
  { accessorKey: 'category', header: 'Kategori', width: 100 },
];

export function SuppliersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', user?.tenantId],
    queryFn: () => listSuppliers({ tenantId: user?.tenantId ?? 1 }),
    enabled: !!user,
  });

  const suppliers = data?.suppliers || [];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSupplier(user!.tenantId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setSelectedId(null);
      setSnackbar({
        open: true,
        message: 'Supplier berhasil dihapus',
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
    mutationFn: async (id: number) => {
      return toggleSupplier(user!.tenantId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
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

  const handleEdit = (id: number) => {
    setSelectedId(id);
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Hapus supplier ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAdd = () => {
    setSelectedId(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedId(null);
  };

  const customColumns: ColumnDef<Supplier>[] = [
    ...columns,
    {
      accessorKey: 'isActive',
      header: 'Status',
      width: 80,
      cell: (info: CellContext<Supplier>) => (
        <Switch
          checked={info.row.original.isActive === 1}
          onChange={() => handleToggle(info.row.original.id)}
          size="small"
        />
      ),
    },
    {
      accessorKey: 'actions',
      header: 'Aksi',
      width: 100,
      cell: (info: CellContext<Supplier>) => (
        <>
          <IconButton
            size="small"
            onClick={() => handleEdit(info.row.original.id)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(info.row.original.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box p={3}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '24px' }}>
          Manajemen Supplier
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
        >
          Tambah Supplier
        </Button>
      </Box>

      <Paper>
        <ResponsiveTable
          columns={customColumns}
          data={suppliers}
          enableSorting
          enableFiltering
          enablePagination
          initialPageSize={10}
          className="w-full"
        />
      </Paper>

      <SupplierModal
        open={modalOpen}
        onClose={handleCloseModal}
        supplierId={selectedId}
        suppliers={suppliers}
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}