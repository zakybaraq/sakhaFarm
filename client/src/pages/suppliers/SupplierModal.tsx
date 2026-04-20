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
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSupplier,
  updateSupplier,
  type Supplier,
} from '../../api/suppliers';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIES = ['feed', 'vitamin', 'medicine', 'other'] as const;

interface SupplierModalProps {
  open: boolean;
  onClose: () => void;
  supplierId: number | null;
  suppliers: Supplier[];
}

export function SupplierModal({
  open,
  onClose,
  supplierId,
  suppliers,
}: SupplierModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const existing = supplierId
    ? suppliers.find((s) => s.id === supplierId)
    : null;

  const [form, setForm] = useState({
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    address: '',
    category: 'feed' as typeof CATEGORIES[number],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setForm({
        code: existing.code,
        name: existing.name,
        contactPerson: existing.contactPerson || '',
        phone: existing.phone,
        address: existing.address || '',
        category: existing.category,
      });
    } else {
      setForm({
        code: '',
        name: '',
        contactPerson: '',
        phone: '',
        address: '',
        category: 'feed',
      });
    }
  }, [existing, open]);

  const createMut = useMutation({
    mutationFn: (data: typeof form) => createSupplier(user!.tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      onClose();
      setIsSubmitting(false);
    },
    onError: (err: Error) => {
      setError(err.message);
      setIsSubmitting(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: (data: typeof form) => updateSupplier(user!.tenantId, supplierId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      onClose();
      setIsSubmitting(false);
    },
    onError: (err: Error) => {
      setError(err.message);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = () => {
    if (!form.code || !form.name || !form.phone) {
      setError('Kode, nama, dan telepon wajib diisi');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    if (supplierId) {
      updateMut.mutate(form);
    } else {
      createMut.mutate({
        ...form,
        contactPerson: form.contactPerson || undefined,
        address: form.address || undefined,
      });
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [field]: e.target.value });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {supplierId ? 'Edit' : 'Tambah'} Supplier
      </DialogTitle>
      <DialogContent>
        <TextField
          label="Kode"
          value={form.code}
          onChange={handleChange('code')}
          fullWidth
          margin="normal"
          required
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Kategori</InputLabel>
          <Select
            value={form.category}
            label="Kategori"
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORIES.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Nama Supplier"
          value={form.name}
          onChange={handleChange('name')}
          fullWidth
          margin="normal"
          required
        />

        <TextField
          label="Contact Person"
          value={form.contactPerson}
          onChange={handleChange('contactPerson')}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Telepon"
          value={form.phone}
          onChange={handleChange('phone')}
          fullWidth
          margin="normal"
          required
        />

        <TextField
          label="Alamat"
          value={form.address}
          onChange={handleChange('address')}
          fullWidth
          margin="normal"
          multiline
          rows={2}
        />

        {error && (
          <TextField
            error
            fullWidth
            margin="normal"
            value={error}
            InputProps={{ readOnly: true }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Batal</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting || !form.code || !form.name || !form.phone}
        >
          {supplierId ? 'Update' : 'Simpan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}