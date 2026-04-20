import { useMemo } from 'react';

/**
 * Custom hook for recording calculations.
 * Provides computed metrics based on form field values and cycle standards.
 *
 * @param watchFields - Array of watched form values: [dead, culled, remaining, initial, bodyWeight, cycleId]
 * @param standardBW - Standard body weight based on cycle day
 */
export function useRecordingCalculations(watchFields: (number | undefined)[], standardBW: number) {
  return useMemo(() => {
    const dead = Number(watchFields[0]) || 0;
    const culled = Number(watchFields[1]) || 0;
    const remaining = Number(watchFields[2]) || 0;
    const initial = Number(watchFields[3]) || 0;
    const bw = Number(watchFields[4]) || 0;

    const totalLoss = dead + culled;
    const mortalityPct = initial > 0 ? (totalLoss / initial) * 100 : 0;
    const survivalRate = initial > 0 ? (remaining / initial) * 100 : 0;
    const bwDeviation = bw > 0 && standardBW > 0 ? bw - standardBW : null;
    const projectedIP = survivalRate > 0 ? Math.round((bw * survivalRate) / 100) : 0;

    return {
      mortalityPct: mortalityPct.toFixed(2),
      survivalRate: survivalRate.toFixed(2),
      bwDeviation,
      projectedIP,
    };
  }, [watchFields, standardBW]);
}
