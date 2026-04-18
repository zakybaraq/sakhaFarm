import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { Controller, type UseFormHandleSubmit } from 'react-hook-form';
import SaveIcon from '@mui/icons-material/Save';
import type { Control, FieldErrors } from 'react-hook-form';
import type { RecordingFormData } from '../../types/recording';

/**
 * Props for RecordingForm component.
 * Simplified interface - passes through react-hook-form control and errors.
 */
interface RecordingFormProps {
  control: Control<RecordingFormData>;
  errors: FieldErrors<RecordingFormData>;
  handleSubmit: UseFormHandleSubmit<RecordingFormData>;
  onSubmit: (data: RecordingFormData) => Promise<void>;
  isSubmitting: boolean;
  submitSuccess: boolean;
  cyclesLoading: boolean;
  cycles: {
    id: number;
    cycleNumber: number;
    docType: string;
    chickInDate: string;
  }[];
}

/**
 * Recording form with all input fields for daily data entry.
 * Uses MUI components for form controls - existing pattern per D-05.
 */
export function RecordingForm({
  control,
  errors,
  handleSubmit,
  onSubmit,
  isSubmitting,
  submitSuccess,
  cyclesLoading,
  cycles,
}: RecordingFormProps) {
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Recording berhasil disimpan!
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Date and Cycle selection row */}
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
                slotProps={{
                  htmlInput: { max: new Date().toISOString().split('T')[0] },
                }}
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
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  {cyclesLoading ? (
                    <MenuItem disabled value="">
                      Loading cycles...
                    </MenuItem>
                  ) : cycles.length > 0 ? (
                    cycles.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        Cycle {c.cycleNumber} ({c.docType})
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled value="">
                      No active cycles
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            )}
          />
        </Box>

        {/* Population and weight inputs row */}
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
  );
}
