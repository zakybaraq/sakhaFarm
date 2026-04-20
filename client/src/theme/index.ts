import { createTheme } from '@mui/material/styles';

/**
 * Minimalist MUI theme for SakhaFarm.
 *
 * Uses a green accent palette (#2E7D32) reflecting the farm/agriculture domain,
 * with neutral slate grays for the base UI. Clean, modern aesthetic with
 * subtle shadows and rounded corners.
 *
 * MUI v7 note: Use drawerClasses from @mui/material/Drawer for Drawer
 * CSS overrides — NOT the v5 .MuiDrawer-paperAnchorLeft pattern.
 */
export const theme = createTheme({
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.2 },
    h2: { fontWeight: 600 },
    h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontWeight: 500 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
  },
  palette: {
    primary: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    secondary: {
      main: '#1976D2',
      light: '#42A5F5',
      dark: '#1565C0',
    },
    error: {
      main: '#D32F2F',
    },
    warning: {
      main: '#ED6C02',
    },
    success: {
      main: '#2E7D32',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f8fafc',
          '& .MuiTableCell-head': {
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            color: '#64748b',
            fontWeight: 600,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#f8fafc',
          },
        },
      },
    },
  },
});

/** Layout constants used across Layout, Sidebar, Navbar, Footer */
export const DRAWER_WIDTH = 240;
export const DRAWER_WIDTH_COLLAPSED = 72;
export const APPBAR_HEIGHT = 64;
export const FOOTER_HEIGHT = 40;
