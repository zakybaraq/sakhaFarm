import { useState } from 'react'
import { Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'

const mockCycles = [
  { id: 1, cycleNumber: 'C001', docType: 'CP' },
  { id: 2, cycleNumber: 'C002', docType: 'CP' },
  { id: 3, cycleNumber: 'C003', docType: 'Patriot' },
]

const mockBWData = [
  { day: 1, actual: 45, standard: 45 },
  { day: 7, actual: 120, standard: 115 },
  { day: 14, actual: 380, standard: 370 },
  { day: 21, actual: 720, standard: 710 },
  { day: 28, actual: 1150, standard: 1140 },
  { day: 35, actual: 1650, standard: 1640 },
]

const mockFCRData = [
  { day: 1, fcr: 1.8 },
  { day: 7, fcr: 1.65 },
  { day: 14, fcr: 1.55 },
  { day: 21, fcr: 1.48 },
  { day: 28, fcr: 1.42 },
  { day: 35, fcr: 1.38 },
]

export function Performance() {
  const [selectedCycle, setSelectedCycle] = useState<number>(1)

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '24px', mb: 3 }}>
        Laporan Performa Harian
      </Typography>

      <FormControl sx={{ minWidth: 200, mb: 3 }}>
        <InputLabel>Pilih Siklus</InputLabel>
        <Select
          value={selectedCycle}
          label="Pilih Siklus"
          onChange={(e) => setSelectedCycle(e.target.value as number)}
        >
          {mockCycles.map((cycle) => (
            <MenuItem key={cycle.id} value={cycle.id}>
              {cycle.cycleNumber} - {cycle.docType}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Kurva Pertumbuhan BB (Body Weight)
        </Typography>
        <Box sx={{ height: 300 }}>
          <LineChart
            dataset={mockBWData}
            xAxis={[{ dataKey: 'day', label: 'Hari' }]}
            yAxis={[{ label: 'Berat (gram)' }]}
            series={[
              { dataKey: 'actual', label: 'Actual BW', color: '#2E7D32' },
              { dataKey: 'standard', label: 'Standard BW', color: '#9E9E9E' },
            ]}
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
            dataset={mockFCRData}
            xAxis={[{ dataKey: 'day', label: 'Hari' }]}
            yAxis={[{ label: 'FCR' }]}
            series={[
              { dataKey: 'fcr', label: 'FCR', color: '#2E7D32' },
            ]}
            grid={{ vertical: true, horizontal: true }}
            height={280}
          />
        </Box>
      </Paper>
    </Box>
  )
}
