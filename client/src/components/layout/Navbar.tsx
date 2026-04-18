import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { APPBAR_HEIGHT } from '../../theme';

function SakhaFarmLogo({ collapsed }: { collapsed?: boolean }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1,
          bgcolor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AgricultureIcon sx={{ color: 'white', fontSize: 22 }} />
      </Box>
      {!collapsed && (
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              lineHeight: 1.2,
              fontSize: '1.1rem',
            }}
          >
            Sakha Farm
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              lineHeight: 1,
              fontSize: '0.65rem',
              letterSpacing: '0.5px',
            }}
          >
            LIVESTOCK MANAGEMENT
          </Typography>
        </Box>
      )}
    </Box>
  );
}

interface NavbarProps {
  onMenuClick: () => void;
  sidebarWidth: number;
  sidebarCollapsed: boolean;
}

function formatSegment(segment: string): string {
  return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Navbar({ onMenuClick, sidebarWidth, sidebarCollapsed }: NavbarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const pathSegments = location.pathname.split('/').filter(Boolean);

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        height: APPBAR_HEIGHT,
        borderBottom: '1px solid',
        borderColor: 'divider',
        ml: { md: `${sidebarWidth}px` },
        width: { md: `calc(100% - ${sidebarWidth}px)` },
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
      elevation={0}
    >
      <Toolbar sx={{ height: APPBAR_HEIGHT, gap: 1 }}>
        {isMobile && (
          <IconButton edge="start" onClick={onMenuClick} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
        )}

         <Breadcrumbs sx={{ display: { xs: 'none', sm: 'flex' } }}>
           {pathSegments.length === 0 ? (
             <Typography variant="body2" color="text.primary" fontWeight={500}>
               Dashboard
             </Typography>
           ) : (
             pathSegments.map((segment, index) => {
               const path = '/' + pathSegments.slice(0, index + 1).join('/');
               const isLast = index === pathSegments.length - 1;
               return isLast ? (
                 <Typography key={path} variant="body2" color="text.primary">
                   {formatSegment(segment)}
                 </Typography>
               ) : (
                 <Link
                   key={path}
                   variant="body2"
                   color="text.secondary"
                   sx={{ cursor: 'pointer', textDecoration: 'none' }}
                   onClick={() => navigate(path)}
                 >
                   {formatSegment(segment)}
                 </Link>
               );
             })
           )}
         </Breadcrumbs>

        <Box sx={{ flexGrow: 1 }} />

        <IconButton sx={{ color: 'text.secondary' }}>
          <Badge color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {user?.name?.charAt(0)?.toUpperCase() ?? <AccountCircleIcon />}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem disabled>
            <AccountCircleIcon sx={{ mr: 1 }} fontSize="small" />
            Profile
          </MenuItem>
          <MenuItem disabled>
            <SettingsIcon sx={{ mr: 1 }} fontSize="small" />
            Settings
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
