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
  Autocomplete,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  createFeedProduct,
  updateFeedProduct,
  listFeedProducts,
  listFeedTypes,
  listFeedBrands,
  type FeedProduct,
  type FeedType,
  type FeedBrand,
} from '../../api/feed';

const feedProductSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  code: z.string().min(1, 'Kode produk wajib diisi'),
  typeId: z.number().nullable(),
  brandId: z.number().nullable(),
  zakKgConversion: z.string().optional(),
});

type FeedProductFormData = z.infer<typeof feedProductSchema>;

interface FeedProductModalProps {
  open: boolean;
  onClose: () => void;
  selectedId?: number | null;
}

export function FeedProductModal({ open, onClose, selectedId }: FeedProductModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!selectedId;

  const { data: productsData } = useQuery({
    queryKey: ['feed-products'],
    queryFn: listFeedProducts,
    enabled: open && isEditMode,
  });

  const { data: typesData } = useQuery({
    queryKey: ['feed-types'],
    queryFn: listFeedTypes,
    enabled: open,
  });

  const { data: brandsData } = useQuery({
    queryKey: ['feed-brands'],
    queryFn: listFeedBrands,
    enabled: open,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeedProductFormData>({
    resolver: zodResolver(feedProductSchema),
    defaultValues: {
      name: '',
      code: '',
      typeId: null,
      brandId: null,
      zakKgConversion: '50',
    },
  });

  useEffect(() => {
    if (selectedId && productsData?.products) {
      const item = productsData.products.find((p: FeedProduct) => p.id === selectedId);
      if (item) {
        reset({
          name: item.name,
          code: item.code,
          typeId: item.typeId,
          brandId: item.brandId,
          zakKgConversion: item.zakKgConversion ?? '50',
        });
      }
    } else {
      reset({ name: '', code: '', typeId: null, brandId: null, zakKgConversion: '50' });
    }
  }, [selectedId, productsData, reset]);

  const saveMutation = useMutation({
    mutationFn: isEditMode
      ? (formData: FeedProductFormData) =>
          updateFeedProduct(selectedId!, {
            ...formData,
            typeId: formData.typeId ?? null,
            brandId: formData.brandId ?? null,
          })
      : (formData: FeedProductFormData) =>
          createFeedProduct({
            ...formData,
            typeId: formData.typeId ?? null,
            brandId: formData.brandId ?? null,
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-products'] });
      reset();
      onClose();
    },
  });

  const onSubmit = async (formData: FeedProductFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await saveMutation.mutateAsync(formData);
    } catch (_err) {
      setError('Gagal menyimpan produk pakan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allTypes = typesData?.types ?? [];
  const allBrands = brandsData?.brands ?? [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: '20px', fontWeight: 600 }}>
        {isEditMode ? 'Edit Produk Pakan' : 'Tambah Produk Pakan'}
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
                  label="Kode Produk"
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
                  label="Nama Produk"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
            <Controller
              name="typeId"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={allTypes}
                  getOptionLabel={(option: FeedType) => option.name}
                  value={
                    allTypes.find((t: FeedType) => t.id === field.value) ?? null
                  }
                  onChange={(_e, newValue) => {
                    field.onChange(newValue?.id ?? null);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Jenis Pakan"
                      error={!!errors.typeId}
                      helperText={errors.typeId?.message}
                    />
                  )}
                />
              )}
            />
            <Controller
              name="brandId"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={allBrands}
                  getOptionLabel={(option: FeedBrand) => option.name}
                  value={
                    allBrands.find((b: FeedBrand) => b.id === field.value) ?? null
                  }
                  onChange={(_e, newValue) => {
                    field.onChange(newValue?.id ?? null);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Merek Pakan"
                      error={!!errors.brandId}
                      helperText={errors.brandId?.message}
                    />
                  )}
                />
              )}
            />
            <Controller
              name="zakKgConversion"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Konversi Zak/Kg"
                  fullWidth
                  error={!!errors.zakKgConversion}
                  helperText={errors.zakKgConversion?.message}
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
