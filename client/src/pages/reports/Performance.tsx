import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { getPerformance, type PerformanceRecord } from '../../api/reporting';
import { listCycles } from '../../api/cycles';
import { useAuth } from '../../contexts/AuthContext';

export function Performance() {
  const { user } = useAuth();
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);

  const { data: cyclesData, isLoading: cyclesLoading } = useQuery({
    queryKey: ['cycles'],
    queryFn: listCycles,
  });

  const cycles = cyclesData?.cycles ?? [];

  useEffect(() => {
    if (cycles.length > 0 && selectedCycleId === null) {
      setSelectedCycleId(cycles[0].id);
    }
  }, [cycles, selectedCycleId]);

  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['performance', selectedCycleId],
    queryFn: () => getPerformance(user?.tenantId ?? 1, { cycleId: selectedCycleId! }),
    enabled: !!selectedCycleId && !!user,
  });

  const selectedCycle = cycles.find((c) => c.id === selectedCycleId);

  const records: PerformanceRecord[] = performanceData?.data ?? [];

  const bwData = records.map((r) => {
    const day = selectedCycle
      ? Math.floor(
          (new Date(r.date).getTime() - new Date(selectedCycle.chickInDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1
      : 1;
    return { day, actual: r.bodyWeight };
  });

  const fcrData = records.map((r) => {
    const day = selectedCycle
      ? Math.floor(
          (new Date(r.date).getTime() - new Date(selectedCycle.chickInDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1
      : 1;
    return { day, fcr: r.fcr };
  });

  const ipData = records
    .map((r) => {
      const day = selectedCycle
        ? Math.floor(
            (new Date(r.date).getTime() - new Date(selectedCycle.chickInDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1
        : 1;
      return { day, ip: r.ip };
    })
    .filter((d) => d.ip !== null);

  if (cyclesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '24px', mb: 3 }}>
        Laporan Performa Harian
      </Typography>

      <FormControl sx={{ minWidth: 200, mb: 3 }}>
        <InputLabel>Pilih Siklus</InputLabel>
        <Select
          value={selectedCycleId ?? ''}
          label="Pilih Siklus"
          onChange={(e) => setSelectedCycleId(e.target.value as number)}
        >
          {cycles.map((cycle) => (
            <MenuItem key={cycle.id} value={cycle.id}>
              {cycle.cycleNumber} - {cycle.docType}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {performanceLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : records.length === 0 ? (
        <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
          Belum ada data recording
        </Typography>
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Kurva Pertumbuhan BB (Body Weight)
            </Typography>
            <Box sx={{ height: 300 }}>
              <LineChart
                dataset={bwData}
                xAxis={[{ dataKey: 'day', label: 'Hari' }]}
                yAxis={[{ label: 'Berat (gram)' }]}
                series={[{ dataKey: 'actual', label: 'Actual BW', color: '#2E7D32' }]}
                grid={{ vertical: true, horizontal: true }}
                height={280}
              />
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Trend FCR (Feed Conversion Ratio)
            </Typography>
            <Box sx={{ height: 300 }}>
              <LineChart
                dataset={fcrData}
                xAxis={[{ dataKey: 'day', label: 'Hari' }]}
                yAxis={[{ label: 'FCR' }]}
                series={[{ dataKey: 'fcr', label: 'FCR', color: '#2E7D32' }]}
                grid={{ vertical: true, horizontal: true }}
                height={280}
              />
            </Box>
          </Paper>

          {ipData.length === 0 ? (
            <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary', mt: 3 }}>
              Data IP belum tersedia
            </Typography>
          ) : (
            <Paper sx={{ p: 2, mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Trend IP (Index Performa)
              </Typography>
              <Box sx={{ height: 300 }}>
                <LineChart
                  dataset={ipData}
                  xAxis={[{ dataKey: 'day', label: 'Hari' }]}
                  yAxis={[{ label: 'IP' }]}
                  series={[{ dataKey: 'ip', label: 'IP', color: '#2E7D32' }]}
                  grid={{ vertical: true, horizontal: true }}
                  height={280}
                />
              </Box>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}
