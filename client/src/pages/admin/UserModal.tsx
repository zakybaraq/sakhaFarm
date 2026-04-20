import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUser, updateUser } from '../../api/users';
import { listUnits } from '../../api/units';
import { useQuery } from '@tanstack/react-query';

const userSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().optional(),
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  roleId: z.number().min(1, 'Role wajib dipilih'),
  tenantId: z.number().min(1, 'Tenant wajib dipilih'),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  editId?: string | null;
}

export function UserModal({ open, onClose, editId }: UserModalProps) {
  const isEditMode = !!editId;
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: listUnits,
  });

  const {
    control,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      roleId: 0,
      tenantId: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: (formData: UserFormData) => {
      if (isEditMode) {
        const updateData: { name: string; email: string; roleId: number; password?: string } = {
          name: formData.name,
          email: formData.email,
          roleId: formData.roleId,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        return updateUser(editId!, updateData);
      }
      const createData = { ...formData, password: formData.password || '' };
      return createUser(createData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      resetForm();
      onClose();
    },
  });

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await mutation.mutateAsync(data);
    } catch (_err) {
      setError('Gagal menyimpan pengguna');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: '20px', fontWeight: 600 }}>
        {isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna'}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nama"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email"
                  type="email"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Password"
                  type="password"
                  fullWidth
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
              )}
            />
            <Controller
              name="roleId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.roleId}>
                  <InputLabel>Role</InputLabel>
                  <Select {...field} label="Role" value={field.value || ''}>
                    <MenuItem value={1}>Super Admin</MenuItem>
                    <MenuItem value={2}>Admin Unit</MenuItem>
                    <MenuItem value={3}>Admin Plasma</MenuItem>
                    <MenuItem value={4}>Viewer</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name="tenantId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.tenantId}>
                  <InputLabel>Tenant</InputLabel>
                  <Select {...field} label="Tenant" value={field.value || ''}>
                    {unitsData?.units.map((unit) => (
                      <MenuItem key={unit.id} value={unit.tenantId}>
                        {unit.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            variant="contained"
            type="submit"
            disabled={isSubmitting}
            sx={{ bgcolor: '#2E7D32' }}
          >
            {isEditMode ? 'Perbarui' : isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
