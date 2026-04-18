import { useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { listActiveCycles } from '../../api/cycles';
import { useAuth } from '../../contexts/AuthContext';
import { recordingSchema, type RecordingFormData } from '../../types/recording';
import { RecordingForm } from '../../components/recordings/RecordingForm';
import { RecordingCalculationsDisplay } from '../../components/recordings/RecordingCards';
import { useRecordingCalculations } from '../../hooks/useRecordingCalculations';
import { mockStandards } from '../../types/recording';

/**
 * DailyRecording page for entering chicken growth data.
 *
 * Allows farmers to record daily metrics including mortality, culling,
 * remaining population, and body weight. Automatically calculates
 * mortality percentage, survival rate, body weight deviation from
 * standard, and projected IP (Index Performance).
 *
 * @requires authentication - Uses tenantId from AuthContext
 * @requires active cycle - Must have at least one active growing cycle
 */
export function DailyRecording() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch active cycles for selection
  const { data: cyclesData, isLoading: cyclesLoading } = useQuery({
    queryKey: ['cycles', 'active', user?.tenantId],
    queryFn: () =>
      user?.tenantId ? listActiveCycles(user.tenantId) : Promise.resolve({ cycles: [] }),
    enabled: !!user?.tenantId,
  });

  const { control, handleSubmit, watch, formState } = useForm<RecordingFormData>({
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
  });

  // Watch relevant fields for calculations
  const watchFields = watch([
    'dead',
    'culled',
    'remainingPopulation',
    'initialPopulation',
    'bodyWeight',
    'cycleId',
  ]);

  // Get cycle info for standards
  const cycle = cyclesData?.cycles.find((c) => c.id === watchFields[5]);
  const docType = cycle?.docType || 'CP';
  const standards = mockStandards[docType] || mockStandards['CP'];

  // Calculate current day and standard body weight
  const currentDay = cycle
    ? Math.floor(
        (new Date().getTime() - new Date(cycle.chickInDate).getTime()) / (1000 * 60 * 60 * 24),
      ) + 1
    : 1;
  const standardDayIndex = Math.min(Math.floor((currentDay - 1) / 7), standards.length - 1);
  const standardBW = standards[standardDayIndex] || 0;

  // Use custom hook for calculations
  const calculations = useRecordingCalculations(
    [watchFields[0], watchFields[1], watchFields[2], watchFields[3], watchFields[4]],
    standardBW,
  );

  const onSubmit = async (data: RecordingFormData) => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Recording submitted:', data);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to submit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cycles = cyclesData?.cycles || [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '24px', mb: 3 }}>
        Recording Harian
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <RecordingForm
          control={control}
          errors={formState.errors}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          submitSuccess={submitSuccess}
          cyclesLoading={cyclesLoading}
          cycles={cycles.map((c) => ({
            id: c.id,
            cycleNumber: c.cycleNumber,
            docType: c.docType,
            chickInDate: c.chickInDate,
          }))}
        />
      </Paper>

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Kalkulasi Langsung
      </Typography>

      <RecordingCalculationsDisplay
        mortalityPct={calculations.mortalityPct}
        survivalRate={calculations.survivalRate}
        bwDeviation={calculations.bwDeviation}
        projectedIP={calculations.projectedIP}
        standardBW={standardBW}
      />
    </Box>
  );
}
