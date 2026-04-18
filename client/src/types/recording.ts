import { z } from 'zod';

/**
 * Zod schema for daily recording form validation.
 * Validates all required fields for recording data entry.
 */
export const recordingSchema = z.object({
  date: z.string().min(1, 'Tanggal wajib diisi'),
  cycleId: z.number().min(1, 'Siklus wajib dipilih'),
  initialPopulation: z.number().min(1, 'Populasi awal wajib diisi'),
  dead: z.number().min(0, 'Jumlah mati tidak boleh negatif'),
  culled: z.number().min(0, 'Jumlah culling tidak boleh negatif'),
  remainingPopulation: z.number().min(0, 'Sisa populasi wajib diisi'),
  bodyWeight: z.number().min(1, 'Berat badan wajib diisi'),
});

/** TypeScript type inferred from recording schema */
export type RecordingFormData = z.infer<typeof recordingSchema>;

/** Body weight standards by document type and week (grams) */
export const mockStandards: Record<string, number[]> = {
  CP: [45, 120, 380, 720, 1150, 1650],
  Patriot: [42, 115, 365, 695, 1100, 1580],
};
