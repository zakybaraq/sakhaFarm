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
  createFeedType,
  updateFeedType,
  listFeedTypes,
  type FeedType,
} from '../../api/feed';

const feedTypeSchema = z.object({
  name: z.string().min(1, 'Nama jenis wajib diisi'),
  code: z.string().min(1, 'Kode jenis wajib diisi'),
});

type FeedTypeFormData = z.infer<typeof feedTypeSchema>;

interface FeedTypeModalProps {
  open: boolean;
  onClose: () => void;
  selectedId?: number | null;
}

export function FeedTypeModal({ open, onClose, selectedId }: FeedTypeModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!selectedId;

  const { data } = useQuery({
    queryKey: ['feed-types'],
    queryFn: listFeedTypes,
    enabled: open,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeedTypeFormData>({
    resolver: zodResolver(feedTypeSchema),
    defaultValues: {
      name: '',
      code: '',
    },
  });

  useEffect(() => {
    if (selectedId && data?.types) {
      const item = data.types.find((t: FeedType) => t.id === selectedId);
      if (item) {
        reset({
          name: item.name,
          code: item.code,
        });
      }
    } else {
      reset({ name: '', code: '' });
    }
  }, [selectedId, data, reset]);

  const saveMutation = useMutation({
    mutationFn: isEditMode
      ? (formData: FeedTypeFormData) => updateFeedType(selectedId!, formData)
      : createFeedType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-types'] });
      reset();
      onClose();
    },
  });

  const onSubmit = async (formData: FeedTypeFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await saveMutation.mutateAsync(formData);
    } catch (_err) {
      setError('Gagal menyimpan jenis pakan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: '20px', fontWeight: 600 }}>
        {isEditMode ? 'Edit Jenis Pakan' : 'Tambah Jenis Pakan'}
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
                  label="Kode Jenis"
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
                  label="Nama Jenis"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
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
