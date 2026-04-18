import { useState, useCallback, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ErrorBoundary } from '../ErrorBoundary';
import { useAuth } from '../../contexts/AuthContext';
import { DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED, APPBAR_HEIGHT, FOOTER_HEIGHT } from '../../theme';

function getInitialCollapsed(): boolean {
  try {
    const stored = localStorage.getItem('sakha_sidebar_collapsed');
    return stored === 'true';
  } catch {
    return false;
  }
}

export function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const { permissions } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);

  const handleMobileToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const handleMobileClose = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sakha_sidebar_collapsed', String(next));
      } catch {
        // localStorage unavailable (private mode, quota exceeded, etc.)
      }
      return next;
    });
  }, []);

  const effectiveCollapsed = isTablet ? true : collapsed;
  const sidebarWidth = isMobile ? 0 : effectiveCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <Navbar
        onMenuClick={handleMobileToggle}
        sidebarWidth={sidebarWidth}
        sidebarCollapsed={effectiveCollapsed}
      />
      <Box sx={{ display: 'flex', flex: 1 }}>
        <Sidebar
          open={mobileOpen}
          onClose={handleMobileClose}
          collapsed={effectiveCollapsed}
          onToggleCollapse={handleToggleCollapse}
          userPermissions={permissions}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            ml: isMobile ? 0 : `${sidebarWidth}px`,
            mt: `${APPBAR_HEIGHT}px`,
            minHeight: `calc(100vh - ${APPBAR_HEIGHT}px - ${FOOTER_HEIGHT}px)`,
            p: 3,
            transition: theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          <ErrorBoundary>
            <Suspense
              fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              }
            >
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </Box>
      </Box>
      <Box
        sx={{
          ml: isMobile ? 0 : `${sidebarWidth}px`,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Footer />
      </Box>
    </Box>
  );
}
