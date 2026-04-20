import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Grid,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPharmaceutical,
  updatePharmaceutical,
  type Pharmaceutical,
} from '../../api/pharmaceuticals';
import { useAuth } from '../../contexts/AuthContext';
import { listSuppliers, type Supplier } from '../../api/suppliers';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  editingItem: Pharmaceutical | null;
  items: Pharmaceutical[];
}

export function VitaminsMedicineModal({
  open,
  onClose,
  editingItem,
}: ModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    code: '',
    name: '',
    category: 'vitamin' as 'vitamin' | 'medicine',
    unitOfMeasure: '',
    manufacturer: '',
    strength: '',
    phone: '',
    supplierId: null as number | null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setForm({
        code: editingItem.code,
        name: editingItem.name,
        category: editingItem.category,
        unitOfMeasure: editingItem.unitOfMeasure,
        manufacturer: editingItem.manufacturer || '',
        strength: editingItem.strength || '',
        phone: editingItem.phone || '',
        supplierId: editingItem.supplierId,
      });
    } else {
      setForm({
        code: '',
        name: '',
        category: 'vitamin',
        unitOfMeasure: '',
        manufacturer: '',
        strength: '',
        phone: '',
        supplierId: null,
      });
    }
  }, [editingItem, open]);

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => listSuppliers({ tenantId: user?.tenantId ?? 1 }),
    enabled: !!user,
  });

  const suppliers = suppliersData?.suppliers?.filter(
    (s: Supplier) => s.category === 'feed' || s.category === 'vitamin' || s.category === 'medicine'
  ) || [];

  const createMut = useMutation({
    mutationFn: (data: typeof form) =>
      createPharmaceutical(user!.tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmaceuticals'] });
      onClose();
      setIsSubmitting(false);
    },
    onError: () => setIsSubmitting(false),
  });

  const updateMut = useMutation({
    mutationFn: (data: typeof form) =>
      updatePharmaceutical(editingItem!.id, user!.tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmaceuticals'] });
      onClose();
      setIsSubmitting(false);
    },
    onError: () => setIsSubmitting(false),
  });

  const handleSubmit = () => {
    if (!form.code || !form.name || !form.unitOfMeasure) {
      return;
    }
    setIsSubmitting(true);
    if (editingItem) {
      updateMut.mutate(form);
    } else {
      createMut.mutate(form);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingItem ? 'Edit Obat/Vitamin' : 'Tambah Obat/Vitamin'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Kode"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={form.category}
                  label="Kategori"
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as 'vitamin' | 'medicine' })
                  }
                >
                  <MenuItem value="vitamin">Vitamin</MenuItem>
                  <MenuItem value="medicine">Obat</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nama Obat/Vitamin"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Satuan"
                value={form.unitOfMeasure}
                onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })}
                required
                size="small"
                placeholder="ml, kapsul, tablet"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Kekuatan"
                value={form.strength}
                onChange={(e) => setForm({ ...form, strength: e.target.value })}
                size="small"
                placeholder="500mg, 5%"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Produsen"
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Telepon"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Supplier</InputLabel>
                <Select
                  value={form.supplierId || ''}
                  label="Supplier"
                  onChange={(e) =>
                    setForm({ ...form, supplierId: e.target.value ? Number(e.target.value) : null })
                  }
                >
                  <MenuItem value="">-</MenuItem>
                  {suppliers.map((s: Supplier) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Batal</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting}>
          Simpan
        </Button>
      </DialogActions>
    </Dialog>
  );
}