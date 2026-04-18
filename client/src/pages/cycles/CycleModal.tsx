import { useState } from 'react'
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
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCycle } from '../../api/cycles'
import { listPlasmas, type Plasma } from '../../api/plasmas'
import { useQuery } from '@tanstack/react-query'

const cycleSchema = z.object({
  plasmaId: z.number().min(1, 'Plasma wajib dipilih'),
  cycleNumber: z.string().min(1, 'Nomor siklus wajib diisi'),
  docType: z.string().min(1, 'Jenis DOC wajib diisi'),
  chickInDate: z.string().min(1, 'Tanggal Chick In wajib diisi'),
  initialPopulation: z.number().min(1, 'Populasi awal wajib diisi'),
})

type CycleFormData = z.infer<typeof cycleSchema>

interface CycleModalProps {
  open: boolean
  onClose: () => void
}

export function CycleModal({ open, onClose }: CycleModalProps) {
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: plasmasData } = useQuery({
    queryKey: ['plasmas'],
    queryFn: () => listPlasmas(),
  })

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CycleFormData>({
    resolver: zodResolver(cycleSchema),
    defaultValues: {
      plasmaId: 0,
      cycleNumber: '',
      docType: '',
      chickInDate: new Date().toISOString().split('T')[0],
      initialPopulation: 0,
    },
  })

  const createMutation = useMutation({
    mutationFn: createCycle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] })
      reset()
      onClose()
    },
  })

  const onSubmit = async (data: CycleFormData) => {
    setIsSubmitting(true)
    setError(null)
    try {
      await createMutation.mutateAsync(data)
    } catch (err) {
      setError('Gagal menyimpan siklus')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: '20px', fontWeight: 600 }}>
        Tambah Siklus
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <Controller
              name="cycleNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nomor Siklus"
                  fullWidth
                  error={!!errors.cycleNumber}
                  helperText={errors.cycleNumber?.message}
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
                    {plasmasData?.plasmas.map((plasma: Plasma) => (
                      <MenuItem key={plasma.id} value={plasma.id}>{plasma.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name="docType"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.docType}>
                  <InputLabel>Jenis DOC</InputLabel>
                  <Select {...field} label="Jenis DOC" value={field.value || ''}>
                    <MenuItem value="CP">CP</MenuItem>
                    <MenuItem value="Cobb">Cobb</MenuItem>
                    <MenuItem value="Ross">Ross</MenuItem>
                    <MenuItem value="Patriot">Patriot</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name="chickInDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Tanggal Chick In"
                  type="date"
                  fullWidth
                  error={!!errors.chickInDate}
                  helperText={errors.chickInDate?.message}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
            <Controller
              name="initialPopulation"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Populasi Awal"
                  type="number"
                  fullWidth
                  error={!!errors.initialPopulation}
                  helperText={errors.initialPopulation?.message}
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
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}