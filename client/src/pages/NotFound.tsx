import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <Typography variant="h1" sx={{ fontWeight: 700, color: 'text.secondary' }}>
        404
      </Typography>
      <Typography variant="h5" color="text.secondary">
        Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary">
        The page you are looking for does not exist or has been moved.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
        Back to Dashboard
      </Button>
    </Box>
  );
}
