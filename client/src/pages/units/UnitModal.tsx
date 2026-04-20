import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createUnit, updateUnit, listUnits } from '../../api/units';

const unitSchema = z.object({
  name: z.string().min(1, 'Nama unit wajib diisi'),
  code: z.string().min(1, 'Kode unit wajib diisi'),
  location: z.string().optional(),
});

type UnitFormData = z.infer<typeof unitSchema>;

interface UnitModalProps {
  open: boolean;
  onClose: () => void;
  selectedId?: number | null;
}

export function UnitModal({ open, onClose, selectedId }: UnitModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!selectedId;

  const { data } = useQuery({
    queryKey: ['units'],
    queryFn: listUnits,
    enabled: open,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: '',
      code: '',
      location: '',
    },
  });

  useEffect(() => {
    if (selectedId && data?.units) {
      const unit = data.units.find((u) => u.id === selectedId);
      if (unit) {
        reset({
          name: unit.name,
          code: unit.code,
          location: unit.location ?? '',
        });
      }
    } else {
      reset({ name: '', code: '', location: '' });
    }
  }, [selectedId, data, reset]);

  const createMutation = useMutation({
    mutationFn: isEditMode
      ? (formData: UnitFormData) => updateUnit(selectedId!, formData)
      : createUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      reset();
      onClose();
    },
  });

  const onSubmit = async (data: UnitFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await createMutation.mutateAsync(data);
    } catch (_err) {
      setError('Gagal menyimpan unit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: '20px', fontWeight: 600 }}>
        {isEditMode ? 'Edit Unit' : 'Tambah Unit'}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Kode Unit"
                  fullWidth
                  error={!!errors.code}
                  helperText={errors.code?.message}
                />
              )}
            />
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nama Unit"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Lokasi"
                  fullWidth
                  error={!!errors.location}
                  helperText={errors.location?.message}
                />
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
            {isEditMode
              ? isSubmitting
                ? 'Menyimpan...'
                : 'Perbarui'
              : isSubmitting
                ? 'Menyimpan...'
                : 'Simpan'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
