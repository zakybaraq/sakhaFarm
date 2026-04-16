import { Routes, Route } from 'react-router-dom'
import { Container, Typography, Box } from '@mui/material'

export function App() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Routes>
        <Route path="/" element={
          <Box>
            <Typography variant="h4" gutterBottom>
              SakhaFarm
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Poultry Plasma Farm Management System
            </Typography>
          </Box>
        } />
      </Routes>
    </Container>
  )
}
