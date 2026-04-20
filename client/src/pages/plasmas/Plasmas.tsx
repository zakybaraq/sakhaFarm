import { useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ResponsiveTable } from '../../components/ui/ResponsiveTable';
import AddIcon from '@mui/icons-material/Add';
import Switch from '@mui/material/Switch';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listPlasmas, deletePlasma, updatePlasma, type Plasma } from '../../api/plasmas';
import { listUnits, type Unit } from '../../api/units';
import { useAuth } from '../../contexts/AuthContext';
import { PlasmaModal } from './PlasmaModal';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { ColumnDef } from '../../types/table';

export function PlasmasPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: listUnits,
    enabled: !!user,
  });

  const { data } = useQuery({
    queryKey: ['plasmas'],
    queryFn: () => listPlasmas(),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePlasma,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plasmas'] });
      setSelectedId(null);
      setSnackbar({ open: true, message: 'Plasma berhasil dihapus', severity: 'success' });
    },
    onError: (error: Error) => {
      setSnackbar({ open: true, message: `Gagal menghapus: ${error.message}`, severity: 'error' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      const plasma = data?.plasmas.find((p) => p.id === id);
      if (!plasma) return;
      return updatePlasma(id, { isActive: plasma.isActive ? 0 : 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plasmas'] });
    },
    onError: (error: Error) => {
      setSnackbar({ open: true, message: `Gagal toggle: ${error.message}`, severity: 'error' });
    },
  });

  const handleToggle = (id: number) => {
    toggleMutation.mutate(id);
  };

  const handleEdit = (row: Plasma) => {
    setSelectedId(row.id);
    setModalOpen(true);
  };

  const columns: ColumnDef<Plasma>[] = [
    {
      accessorKey: 'name',
      header: 'Nama Plasma',
      size: 200,
    },
    {
      accessorKey: 'unitId',
      header: 'Unit',
      size: 150,
      cell: ({ row }) => {
        const unit = unitsData?.units.find((u: Unit) => u.id === row.original.unitId);
        return unit?.name ?? row.original.unitId;
      },
    },
    {
      accessorKey: 'farmerName',
      header: 'Nama Peternak',
      size: 200,
    },
    {
      accessorKey: 'capacity',
      header: 'Kapasitas (Ekor)',
      size: 150,
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
              if (confirm('Apakah Anda yakin ingin menghapus plasma ini?')) {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '24px' }}>
          Manajemen Plasma
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
          sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
        >
          Tambah Plasma
        </Button>
      </Box>

      <Paper>
        <ResponsiveTable
          columns={columns}
          data={data?.plasmas ?? []}
          enableSorting
          enableFiltering
          enablePagination
          initialPageSize={10}
          className="w-full"
        />
      </Paper>

      <PlasmaModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedId(null);
        }}
        selectedId={selectedId ?? undefined}
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
