import { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import SaveIcon from '@mui/icons-material/Save'

const recordingSchema = z.object({
  date: z.string().min(1, 'Tanggal wajib diisi'),
  cycleId: z.number().min(1, 'Siklus wajib dipilih'),
  initialPopulation: z.number().min(1, 'Populasi awal wajib diisi'),
  dead: z.number().min(0, 'Jumlah mati tidak boleh negatif'),
  culled: z.number().min(0, 'Jumlah culling tidak boleh negatif'),
  remainingPopulation: z.number().min(0, 'Sisa populasi wajib diisi'),
  bodyWeight: z.number().min(1, 'Berat badan wajib diisi'),
})

type RecordingFormData = z.infer<typeof recordingSchema>

const mockCycles = [
  { id: 1, cycleNumber: 'C001', docType: 'CP', startDate: '2026-03-01' },
  { id: 2, cycleNumber: 'C002', docType: 'CP', startDate: '2026-03-15' },
  { id: 3, cycleNumber: 'C003', docType: 'Patriot', startDate: '2026-04-01' },
]

const mockStandards: Record<string, number[]> = {
  CP: [45, 120, 380, 720, 1150, 1650],
  Patriot: [42, 115, 365, 695, 1100, 1580],
}

export function DailyRecording() {
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const { control, handleSubmit, watch, formState: { errors } } = useForm<RecordingFormData>({
    resolver: zodResolver(recordingSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      cycleId: 0,
      initialPopulation: 0,
      dead: 0,
      culled: 0,
      remainingPopulation: 0,
      bodyWeight: 0,
    },
  })

  const watchFields = watch(['dead', 'culled', 'remainingPopulation', 'initialPopulation', 'bodyWeight', 'cycleId'])

  const cycle = mockCycles.find(c => c.id === watchFields[5])
  const docType = cycle?.docType || 'CP'
  const standards = mockStandards[docType] || mockStandards['CP']
  const currentDay = cycle ? Math.floor((new Date().getTime() - new Date(cycle.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1
  const standardDayIndex = Math.min(Math.floor((currentDay - 1) / 7), standards.length - 1)
  const standardBW = standards[standardDayIndex] || 0

  const calculations = useMemo(() => {
    const dead = Number(watchFields[0]) || 0
    const culled = Number(watchFields[1]) || 0
    const remaining = Number(watchFields[2]) || 0
    const initial = Number(watchFields[3]) || 0
    const bw = Number(watchFields[4]) || 0

    const totalLoss = dead + culled
    const mortalityPct = initial > 0 ? (totalLoss / initial) * 100 : 0
    const survivalRate = initial > 0 ? (remaining / initial) * 100 : 0
    const bwDeviation = bw - standardBW
    const projectedIP = survivalRate > 0 ? Math.round((bw * survivalRate) / 100) : 0

    return {
      mortalityPct: mortalityPct.toFixed(2),
      survivalRate: survivalRate.toFixed(2),
      bwDeviation: bwDeviation,
      projectedIP,
    }
  }, [watchFields, standardBW])

  const onSubmit = async (data: RecordingFormData) => {
    setIsSubmitting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Recording submitted:', data)
      setSubmitSuccess(true)
      setTimeout(() => setSubmitSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to submit:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '24px', mb: 3 }}>
        Recording Harian
      </Typography>

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Recording berhasil disimpan!
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Tanggal Recording"
                    type="date"
                    sx={{ minWidth: 200 }}
                    error={!!errors.date}
                    helperText={errors.date?.message}
                    InputLabelProps={{ shrink: true }}
                    slotProps={{ htmlInput: { max: new Date().toISOString().split('T')[0] } }}
                  />
                )}
              />

              <Controller
                name="cycleId"
                control={control}
                render={({ field }) => (
                  <FormControl sx={{ minWidth: 200 }} error={!!errors.cycleId}>
                    <InputLabel>Siklus</InputLabel>
                    <Select
                      {...field}
                      label="Siklus"
                      value={field.value || ''}
                      onChange={(e) => {
                        field.onChange(e.target.value)
                        setSelectedCycle(e.target.value as number)
                      }}
                    >
                      {mockCycles.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.cycleNumber} - {c.docType}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Controller
                name="initialPopulation"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Populasi Awal (Ekor)"
                    type="number"
                    sx={{ minWidth: 200 }}
                    error={!!errors.initialPopulation}
                    helperText={errors.initialPopulation?.message}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />

              <Controller
                name="remainingPopulation"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Sisa Populasi (Ekor)"
                    type="number"
                    sx={{ minWidth: 200 }}
                    error={!!errors.remainingPopulation}
                    helperText={errors.remainingPopulation?.message}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />

              <Controller
                name="dead"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Mati (Ekor)"
                    type="number"
                    sx={{ minWidth: 150 }}
                    error={!!errors.dead}
                    helperText={errors.dead?.message}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />

              <Controller
                name="culled"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Culling (Ekor)"
                    type="number"
                    sx={{ minWidth: 150 }}
                    error={!!errors.culled}
                    helperText={errors.culled?.message}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />

              <Controller
                name="bodyWeight"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Berat Badan (gram)"
                    type="number"
                    sx={{ minWidth: 200 }}
                    error={!!errors.bodyWeight}
                    helperText={errors.bodyWeight?.message}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
            </Box>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" type="button">
              Batal
            </Button>
            <Button
              variant="contained"
              type="submit"
              startIcon={<SaveIcon />}
              disabled={isSubmitting}
              sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Recording'}
            </Button>
          </Box>
        </form>
      </Paper>

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Kalkulasi Langsung
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Card sx={{ flex: '1 1 200px', bgcolor: '#FFF3E0', border: '1px solid #FFB74D' }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">
              Mortalitas Kumulatif
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#E65100' }}>
              {calculations.mortalityPct}%
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 200px', bgcolor: '#E8F5E9', border: '1px solid #81C784' }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">
              Survival Rate (SR)
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#2E7D32' }}>
              {calculations.survivalRate}%
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 200px', bgcolor: '#E3F2FD', border: '1px solid #64B5F6' }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">
              Deviasi BW (Standar: {standardBW}g)
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: calculations.bwDeviation >= 0 ? '#2E7D32' : '#D32F2F',
              }}
            >
              {calculations.bwDeviation >= 0 ? '+' : ''}{calculations.bwDeviation}g
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 200px', bgcolor: '#F3E5F5', border: '1px solid #BA68C8' }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">
              Projected IP
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#7B1FA2' }}>
              {calculations.projectedIP}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
