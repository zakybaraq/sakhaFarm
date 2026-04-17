import { useState } from 'react'
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
  Typography,
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const suratJalanSchema = z.object({
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  nomorSJ: z.string().min(1, 'Nomor SJ wajib diisi'),
  plasmaId: z.number().min(1, 'Plasma wajib dipilih'),
  feedProductId: z.number().min(1, 'Jenis pakan wajib dipilih'),
  jumlahZak: z.number().min(1, 'Jumlah zak wajib diisi'),
  supplier: z.string().min(1, 'Supplier wajib diisi'),
})

type SuratJalanFormData = z.infer<typeof suratJalanSchema>

interface SuratJalanModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function SuratJalanModal({ open, onClose, onSuccess }: SuratJalanModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<SuratJalanFormData>({
    resolver: zodResolver(suratJalanSchema),
    defaultValues: {
      tanggal: new Date().toISOString().split('T')[0],
      nomorSJ: '',
      plasmaId: 0,
      feedProductId: 0,
      jumlahZak: 0,
      supplier: '',
    },
  })

  const onSubmit = async (data: SuratJalanFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/feed/suratjalan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (response.ok) {
        reset()
        onSuccess?.()
        onClose()
      } else {
        const error = await response.json()
        alert(error.message || 'Gagal menyimpan Surat Jalan')
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menyimpan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: '20px', fontWeight: 600 }}>
        Tambah Surat Jalan
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Controller
              name="tanggal"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Tanggal"
                  type="date"
                  fullWidth
                  error={!!errors.tanggal}
                  helperText={errors.tanggal?.message}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
            
            <Controller
              name="nomorSJ"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nomor Surat Jalan"
                  fullWidth
                  error={!!errors.nomorSJ}
                  helperText={errors.nomorSJ?.message}
                />
              )}
            />
            
            <Controller
              name="plasmaId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.plasmaId}>
                  <InputLabel>Plasma</InputLabel>
                  <Select {...field} label="Plasma" value={field.value || ''}>
                    <MenuItem value={1}>Plasma 1</MenuItem>
                    <MenuItem value={2}>Plasma 2</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            
            <Controller
              name="feedProductId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.feedProductId}>
                  <InputLabel>Jenis Pakan</InputLabel>
                  <Select {...field} label="Jenis Pakan" value={field.value || ''}>
                    <MenuItem value={1}>BR 10</MenuItem>
                    <MenuItem value={2}>BR 11</MenuItem>
                    <MenuItem value={3}>BSP</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            
            <Controller
              name="jumlahZak"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Jumlah Zak"
                  type="number"
                  fullWidth
                  error={!!errors.jumlahZak}
                  helperText={errors.jumlahZak?.message}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
            
            <Controller
              name="supplier"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Supplier"
                  fullWidth
                  error={!!errors.supplier}
                  helperText={errors.supplier?.message}
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
            {isSubmitting ? 'Menyimpan...' : 'Simpan Surat Jalan'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}