import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { FOOTER_HEIGHT } from '../../theme'

export function Footer() {
  const theme = useTheme()

  return (
    <Box
      component="footer"
      sx={{
        height: FOOTER_HEIGHT,
        backgroundColor: theme.palette.background.default,
        borderTop: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        flexShrink: 0,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        © 2026 SakhaFarm
      </Typography>
      <Typography variant="caption" color="text.secondary">
        v1.0.0
      </Typography>
    </Box>
  )
}