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
import {
  createFeedBrand,
  updateFeedBrand,
  listFeedBrands,
  type FeedBrand,
} from '../../api/feed';

const feedBrandSchema = z.object({
  name: z.string().min(1, 'Nama merek wajib diisi'),
  code: z.string().min(1, 'Kode merek wajib diisi'),
  phone: z.string().optional(),
});

type FeedBrandFormData = z.infer<typeof feedBrandSchema>;

interface FeedBrandModalProps {
  open: boolean;
  onClose: () => void;
  selectedId?: number | null;
}

export function FeedBrandModal({ open, onClose, selectedId }: FeedBrandModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!selectedId;

  const { data } = useQuery({
    queryKey: ['feed-brands'],
    queryFn: listFeedBrands,
    enabled: open,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeedBrandFormData>({
    resolver: zodResolver(feedBrandSchema),
    defaultValues: {
      name: '',
      code: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (selectedId && data?.brands) {
      const item = data.brands.find((b: FeedBrand) => b.id === selectedId);
      if (item) {
        reset({
          name: item.name,
          code: item.code,
          phone: item.phone ?? '',
        });
      }
    } else {
      reset({ name: '', code: '', phone: '' });
    }
  }, [selectedId, data, reset]);

  const saveMutation = useMutation({
    mutationFn: isEditMode
      ? (formData: FeedBrandFormData) => updateFeedBrand(selectedId!, formData)
      : createFeedBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-brands'] });
      reset();
      onClose();
    },
  });

  const onSubmit = async (formData: FeedBrandFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await saveMutation.mutateAsync(formData);
    } catch (_err) {
      setError('Gagal menyimpan merek pakan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: '20px', fontWeight: 600 }}>
        {isEditMode ? 'Edit Merek Pakan' : 'Tambah Merek Pakan'}
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
                  label="Kode Merek"
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
                  label="Nama Merek"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Telepon"
                  fullWidth
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  onKeyDown={(e) => {
                    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'];
                    if (allowedKeys.includes(e.key)) return;
                    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;
                    if (!/^\d$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    field.onChange(cleaned);
                  }}
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
