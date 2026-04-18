import { Grid, Box, Typography, Alert, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SpeedIcon from '@mui/icons-material/Speed';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RefreshIcon from '@mui/icons-material/Refresh';
import { KpiCard } from '../components/dashboard/KpiCard';
import { useKpiData } from '../hooks/useKpiData';

export function DashboardPage() {
  const theme = useTheme();
  const { activeCycles, avgFcr, avgIp, lowStockAlerts, isLoading, error, refetch } = useKpiData();

  return (
    <Box>
      <Box
        component="h1"
        sx={{
          position: 'absolute',
          width: 1,
          height: 1,
          p: 0,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        Dashboard
      </Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Dashboard
      </Typography>
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button size="small" startIcon={<RefreshIcon />} onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load dashboard data. Please try again.
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Active Cycles"
            value={activeCycles}
            icon={AutorenewIcon}
            color={theme.palette.primary.main}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Avg FCR"
            value={avgFcr ?? '—'}
            icon={TrendingDownIcon}
            color={theme.palette.secondary.main}
            subtitle={avgFcr !== null ? 'Feed Conversion Ratio' : undefined}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Avg IP"
            value={avgIp ?? '—'}
            icon={SpeedIcon}
            color={theme.palette.primary.main}
            subtitle={avgIp !== null ? 'Income Over Feed Cost' : undefined}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title="Low Stock Alerts"
            value={lowStockAlerts}
            icon={WarningAmberIcon}
            color={lowStockAlerts > 0 ? theme.palette.warning.main : theme.palette.primary.main}
            subtitle={lowStockAlerts > 0 ? 'Items below threshold' : 'All stock levels OK'}
            loading={isLoading}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
