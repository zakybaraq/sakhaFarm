import { useState } from 'react';
import { Box, Typography, Button, Paper, IconButton, Switch } from '@mui/material';
import { ResponsiveTable } from '../../components/ui/ResponsiveTable';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listUsers, deactivateUser, activateUser, type User } from '../../api/users';
import { useAuth } from '../../contexts/AuthContext';
import { UserModal } from './UserModal';
import { ColumnDef } from '../../types/table';

export function UsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(),
    enabled: !!user,
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: activateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleEdit = (row: User) => {
    setEditId(row.id);
    setModalOpen(true);
  };

  const handleDeactivate = (id: string) => {
    deactivateMutation.mutate(id);
  };

  const handleActivate = (id: string) => {
    activateMutation.mutate(id);
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Nama',
      size: 200,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      size: 200,
    },
    {
      accessorKey: 'roleId',
      header: 'Role ID',
      size: 100,
    },
    {
      accessorKey: 'tenantId',
      header: 'Tenant ID',
      size: 100,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 100,
      cell: ({ row }) => {
        const isActive = row.original.status === 'active';
        return (
          <Switch
            size="small"
            checked={isActive}
            onChange={(e) => {
              e.stopPropagation();
              if (isActive) {
                handleDeactivate(row.original.id);
              } else {
                handleActivate(row.original.id);
              }
            }}
          />
        );
      },
    },
    {
      accessorKey: 'actions',
      header: 'Aksi',
      size: 60,
      cell: ({ row }) => (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(row.original);
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '24px' }}>
          Manajemen Pengguna
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
          sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
        >
          Tambah Pengguna
        </Button>
      </Box>

      <Paper>
        <ResponsiveTable
          columns={columns}
          data={data?.users ?? []}
          enableSorting
          enableFiltering
          enablePagination
          initialPageSize={10}
          className="w-full"
        />
      </Paper>

      <UserModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditId(null);
        }}
        editId={editId}
      />
    </Box>
  );
}
