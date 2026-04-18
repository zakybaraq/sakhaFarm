import { useState, useEffect } from 'react';
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
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createPlasma, updatePlasma, listPlasmas, type Plasma } from '../../api/plasmas';
import { listUnits, type Unit } from '../../api/units';

const plasmaSchema = z.object({
  name: z.string().min(1, 'Nama plasma wajib diisi'),
  unitId: z.number().min(1, 'Unit wajib dipilih'),
  farmerName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  capacity: z.number().optional(),
});

type PlasmaFormData = z.infer<typeof plasmaSchema>;

interface PlasmaModalProps {
  open: boolean;
  onClose: () => void;
  selectedId?: number | undefined;
}

export function PlasmaModal({ open, onClose, selectedId }: PlasmaModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!selectedId;

  const { data: unitsData } = useQuery({
    queryKey: ['units'],
    queryFn: listUnits,
    enabled: open,
  });

  const { data: plasmasResponse } = useQuery({
    queryKey: ['plasmas'],
    queryFn: () => listPlasmas(),
    enabled: open && isEditMode,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlasmaFormData>({
    resolver: zodResolver(plasmaSchema),
    defaultValues: {
      name: '',
      unitId: 0,
      farmerName: '',
      address: '',
      phone: '',
      capacity: undefined,
    },
  });

  useEffect(() => {
    if (selectedId && plasmasResponse?.plasmas) {
      const plasma = plasmasResponse.plasmas.find((p: Plasma) => p.id === selectedId);
      if (plasma) {
        reset({
          name: plasma.name,
          unitId: plasma.unitId,
          farmerName: plasma.farmerName ?? '',
          address: plasma.address ?? '',
          phone: plasma.phone ?? '',
          capacity: plasma.capacity ?? undefined,
        });
      }
    } else {
      reset({ name: '', unitId: 0, farmerName: '', address: '', phone: '', capacity: undefined });
    }
  }, [selectedId, plasmasResponse, reset]);

  const saveMutation = useMutation({
    mutationFn: isEditMode
      ? (formData: PlasmaFormData) => updatePlasma(selectedId!, formData)
      : createPlasma,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plasmas'] });
      reset();
      onClose();
    },
  });

  const onSubmit = async (data: PlasmaFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await saveMutation.mutateAsync(data);
    } catch (err) {
      setError('Gagal menyimpan plasma');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: '20px', fontWeight: 600 }}>
        {isEditMode ? 'Edit Plasma' : 'Tambah Plasma'}
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
                  label="Nama Plasma"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
            <Controller
              name="unitId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.unitId}>
                  <InputLabel>Unit</InputLabel>
                  <Select {...field} label="Unit" value={field.value || ''}>
                    {unitsData?.units.map((unit: Unit) => (
                      <MenuItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name="farmerName"
              control={control}
              render={({ field }) => <TextField {...field} label="Nama Peternak" fullWidth />}
            />
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Alamat" fullWidth multiline rows={2} />
              )}
            />
            <Controller
              name="phone"
              control={control}
              render={({ field }) => <TextField {...field} label="Telepon" fullWidth />}
            />
            <Controller
              name="capacity"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Kapasitas (Ekor)"
                  type="number"
                  fullWidth
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(Number(e.target.value))}
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
