import { Alert, Box, Typography, Chip } from '@mui/material'
import WarningIcon from '@mui/icons-material/Warning'
import ErrorIcon from '@mui/icons-material/Error'

interface LowStockItem {
  id: number
  plasmaName: string
  feedProductName: string
  totalZak: number
}

interface LowStockAlertProps {
  items?: LowStockItem[]
}

export function LowStockAlert({ items = [] }: LowStockAlertProps) {
  const mockLowStock: LowStockItem[] = items.length > 0 ? items : [
    { id: 2, plasmaName: 'PlasmaUD Jaya', feedProductName: 'BR 11', totalZak: 15 },
    { id: 3, plasmaName: 'PlasmaMakmur', feedProductName: 'BSP', totalZak: 8 },
  ]

  if (mockLowStock.length === 0) {
    return null
  }

  const sortedBySeverity = [...mockLowStock].sort((a, b) => a.totalZak - b.totalZak)

  return (
    <Box sx={{ mb: 2 }}>
      <Alert 
        severity="warning"
        icon={<WarningIcon />}
        sx={{ mb: 1, bgcolor: '#FFF3E0', border: '1px solid #FFB74D' }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Peringatan Stok Rendah
        </Typography>
        {sortedBySeverity.map((item) => (
          <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            {item.totalZak < 20 ? (
              <ErrorIcon sx={{ fontSize: 16, color: '#D32F2F' }} />
            ) : (
              <WarningIcon sx={{ fontSize: 16, color: '#F57C00' }} />
            )}
            <Typography variant="body2">
              <strong>{item.plasmaName}</strong> - {item.feedProductName}: 
              <Chip 
                label={`${item.totalZak} zak`} 
                size="small" 
                color={item.totalZak < 20 ? 'error' : 'warning'}
                sx={{ ml: 1, height: 20, fontSize: '12px' }}
              />
            </Typography>
          </Box>
        ))}
      </Alert>
    </Box>
  )
}