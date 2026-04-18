import { Box, Card, CardContent, Typography } from '@mui/material';

interface CalculationCardProps {
  title: string;
  value: string | number;
  color: string;
  borderColor: string;
  bgColor: string;
  subtitle?: string;
}

/**
 * Displays a single calculation metric in a styled card.
 * Used in DailyRecording to show mortality, survival rate, BW deviation, and projected IP.
 */
export function CalculationCard({
  title,
  value,
  color,
  borderColor,
  bgColor,
  subtitle,
}: CalculationCardProps) {
  return (
    <Card
      sx={{
        flex: '1 1 200px',
        bgcolor: bgColor,
        border: `1px solid ${borderColor}`,
      }}
    >
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 600, color }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

interface RecordingCalculationsDisplayProps {
  mortalityPct: string;
  survivalRate: string;
  bwDeviation: number;
  projectedIP: number;
  standardBW: number;
}

/**
 * Grid of calculation cards showing all recording metrics.
 * Displayed after the recording form to give immediate feedback on entered data.
 */
export function RecordingCalculationsDisplay({
  mortalityPct,
  survivalRate,
  bwDeviation,
  projectedIP,
  standardBW,
}: RecordingCalculationsDisplayProps) {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <CalculationCard
        title="Mortalitas Kumulatif"
        value={`${mortalityPct}%`}
        color="#E65100"
        borderColor="#FFB74D"
        bgColor="#FFF3E0"
      />
      <CalculationCard
        title="Survival Rate (SR)"
        value={`${survivalRate}%`}
        color="#2E7D32"
        borderColor="#81C784"
        bgColor="#E8F5E9"
      />
      <CalculationCard
        title={`Deviasi BW (Standar: ${standardBW}g)`}
        value={`${bwDeviation >= 0 ? '+' : ''}${bwDeviation}g`}
        color={bwDeviation >= 0 ? '#2E7D32' : '#D32F2F'}
        borderColor="#64B5F6"
        bgColor="#E3F2FD"
      />
      <CalculationCard
        title="Projected IP"
        value={projectedIP}
        color="#7B1FA2"
        borderColor="#BA68C8"
        bgColor="#F3E5F5"
      />
    </Box>
  );
}
