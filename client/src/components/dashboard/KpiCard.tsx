import { Card, CardContent, Typography, Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { SvgIconComponent } from '@mui/icons-material'

interface KpiCardProps {
  title: string
  value: string | number
  icon: SvgIconComponent
  color: string
  subtitle?: string
  loading?: boolean
}

export function KpiCard({ title, value, icon: Icon, color, subtitle, loading }: KpiCardProps) {
  const theme = useTheme()

  return (
    <Card
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: theme.shadows[1],
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 4px 12px rgba(22,163,74,0.1)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            {loading ? (
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                —
              </Typography>
            ) : (
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {value}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Icon sx={{ fontSize: 40, color }} />
        </Box>
      </CardContent>
    </Card>
  )
}