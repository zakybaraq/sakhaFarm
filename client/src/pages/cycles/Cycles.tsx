import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  IconButton,
  Box as MuiBox,
  Alert,
  Snackbar,
} from '@mui/material';
import { ResponsiveTable } from '../../components/ui/ResponsiveTable';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listCycles, deleteCycle, updateCycle, type Cycle } from '../../api/cycles';
import { listPlasmas, type Plasma } from '../../api/plasmas';
import { useAuth } from '../../contexts/AuthContext';
import { CycleModal } from './CycleModal';
import { ColumnDef } from '../../types/table';

export function CyclesPage() {
  const { user } = useAuth();
  const isSuperadmin = user?.roleId === 1;
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const { data: plasmasData } = useQuery({
    queryKey: ['plasmas'],
    queryFn: () => listPlasmas(),
    enabled: !!user,
  });

  const { data } = useQuery({
    queryKey: ['cycles'],
    queryFn: listCycles,
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCycle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      setSnackbar({ open: true, message: 'Siklus berhasil dihapus', severity: 'success' });
    },
    onError: (error: Error) => {
      setSnackbar({ open: true, message: `Gagal menghapus: ${error.message}`, severity: 'error' });
    },
  });

  const handleEdit = (row: Cycle) => {
    setEditId(row.id);
    setModalOpen(true);
  };

  const columns: ColumnDef<Cycle>[] = [
    {
      accessorKey: 'cycleNumber',
      header: 'No. Siklus',
      size: 120,
    },
    {
      accessorKey: 'plasmaId',
      header: 'Plasma',
      size: 180,
      cell: ({ row }) => {
        const plasma = plasmasData?.plasmas.find((p: Plasma) => p.id === row.original.plasmaId);
        return plasma?.name ?? row.original.plasmaId;
      },
    },
    {
      accessorKey: 'docType',
      header: 'Jenis DOC',
      size: 120,
    },
    {
      accessorKey: 'chickInDate',
      header: 'Tgl. Chick In',
      size: 140,
    },
    {
      accessorKey: 'initialPopulation',
      header: 'Populasi Awal',
      size: 140,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 120,
      cell: ({ row }) => {
        const status = row.original.status;
        const statusLower = (status || '').toLowerCase();
        const colorMap: Record<string, 'success' | 'info' | 'error'> = {
          active: 'success',
          completed: 'info',
          failed: 'error',
        };
        const label = statusLower.charAt(0).toUpperCase() + statusLower.slice(1);
        return (
          <Chip
            label={label}
            color={colorMap[statusLower] || 'default'}
            size="small"
            sx={{ minWidth: 80 }}
          />
        );
      },
    },
    {
      accessorKey: 'actions',
      header: 'Aksi',
      size: 100,
      cell: ({ row }) => {
        const handleEditClick = () => {
          if (!isSuperadmin) {
            setSnackbar({ open: true, message: 'Hanya superadmin yang dapat mengedit', severity: 'error' });
            return;
          }
          handleEdit(row.original);
        };
        const handleDeleteClick = () => {
          if (!isSuperadmin) {
            setSnackbar({ open: true, message: 'Hanya superadmin yang dapat menghapus', severity: 'error' });
            return;
          }
          if (confirm('Apakah Anda yakin ingin menghapus siklus ini?')) {
            deleteMutation.mutate(row.original.id);
          }
        };
        return (
          <MuiBox
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
              disabled={!isSuperadmin}
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick();
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              disabled={!isSuperadmin}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick();
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </MuiBox>
        );
      },
    },
  ];

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

      <Paper>
        <ResponsiveTable
          columns={columns}
          data={data?.cycles ?? []}
          enableSorting
          enableFiltering
          enablePagination
          initialPageSize={10}
          className="w-full"
        />
      </Paper>

      <CycleModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditId(null);
        }}
        editId={editId}
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
