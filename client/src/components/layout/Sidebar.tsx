import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Collapse from "@mui/material/Collapse";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ExpandLess from "@mui/icons-material/ExpandLess";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BusinessIcon from "@mui/icons-material/Business";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import EditNoteIcon from "@mui/icons-material/EditNote";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { drawerClasses } from "@mui/material/Drawer";
import {
  DRAWER_WIDTH,
  DRAWER_WIDTH_COLLAPSED,
  APPBAR_HEIGHT,
} from "../../theme";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  userPermissions: string[];
}

interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  permission: string | null;
}

interface MenuSection {
  id: string;
  title: string;
  defaultExpanded: boolean;
  items: MenuItem[];
}

const menuStructure: MenuSection[] = [
  {
    id: "master",
    title: "MASTER DATA",
    defaultExpanded: true,
    items: [
      { text: "Unit", icon: <BusinessIcon />, path: "/units", permission: "unit.read" },
      { text: "Plasma", icon: <AgricultureIcon />, path: "/plasmas", permission: "plasma.read" },
      { text: "Jenis Pakan", icon: <Inventory2Icon />, path: "/feed/types", permission: "feed.read" },
      { text: "Merek Pakan", icon: <Inventory2Icon />, path: "/feed/brands", permission: "feed.read" },
      { text: "Produk Pakan", icon: <Inventory2Icon />, path: "/feed/products", permission: "feed.read" },
      { text: "Supplier", icon: <LocalShippingIcon />, path: "/suppliers", permission: "supplier.read" },
      { text: "Obat & Vitamin", icon: <MedicalServicesIcon />, path: "/pharmaceuticals", permission: "pharmaceuticals.read" },
    ],
  },
  {
    id: "operations",
    title: "OPERATIONS",
    defaultExpanded: true,
    items: [
      { text: "Cycle", icon: <AutorenewIcon />, path: "/cycles", permission: "cycle.read" },
      { text: "Recording", icon: <EditNoteIcon />, path: "/recordings", permission: "recording.read" },
      { text: "Feed", icon: <Inventory2Icon />, path: "/feed", permission: "feed.read" },
    ],
  },
  {
    id: "reports",
    title: "REPORTS",
    defaultExpanded: false,
    items: [
      { text: "Performance", icon: <AssessmentIcon />, path: "/reports/performance", permission: "inventory.read" },
      { text: "Stock Resume", icon: <AssessmentIcon />, path: "/reports/stock-resume", permission: "inventory.read" },
      { text: "Audit Log", icon: <AssessmentIcon />, path: "/reports/audit", permission: "audit.read" },
    ],
  },
  {
    id: "settings",
    title: "SETTINGS",
    defaultExpanded: false,
    items: [
      { text: "RBAC", icon: <AdminPanelSettingsIcon />, path: "/rbac", permission: "rbac.read" },
    ],
  },
];

function SidebarContent({
  collapsed,
  onToggleCollapse,
  userPermissions,
}: Pick<SidebarProps, "collapsed" | "onToggleCollapse" | "userPermissions">) {
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize expand state from menuStructure defaults
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    menuStructure.forEach((section) => {
      initial[section.id] = section.defaultExpanded;
    });
    return initial;
  });

  const handleToggle = (sectionId: string) => {
    setExpanded((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const drawerWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  return (
    <Box
      sx={{
        width: drawerWidth,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo header - stays fixed */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          px: collapsed ? 0 : 2,
          height: APPBAR_HEIGHT,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AgricultureIcon sx={{ color: "white", fontSize: 22 }} />
        </Box>
        {!collapsed && (
          <Box sx={{ ml: 1.5 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "primary.main",
                lineHeight: 1.2,
                fontSize: "1rem",
              }}
            >
              Sakha Farm
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                lineHeight: 1,
                fontSize: "0.6rem",
                letterSpacing: "0.5px",
              }}
            >
              LIVESTOCK
            </Typography>
          </Box>
        )}
      </Box>
      <Divider />
      <List
        sx={{
          flex: 1,
          pt: 1,
          overflow: "auto",
          minHeight: 0,
        }}
      >
        {menuStructure.map((section) => {
          // Filter visible items by permission
          const visibleItems = section.items.filter(
            (item) =>
              item.permission === null || userPermissions.includes(item.permission),
          );

          if (visibleItems.length === 0) return null;

          const isExpanded = expanded[section.id];

          return (
            <Box key={section.id}>
              {/* Section header with toggle */}
              <ListItemButton
                onClick={() => handleToggle(section.id)}
                sx={{
                  minHeight: 48,
                  fontWeight: 700,
                }}
              >
                <ListItemText
                  primary={section.title}
                  primaryTypographyProps={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "text.secondary",
                    textTransform: "uppercase",
                  }}
                />
                <ListItemIcon sx={{ minWidth: 36, color: "text.secondary" }}>
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </ListItemIcon>
              </ListItemButton>

              {/* Collapsible menu items */}
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <List disablePadding>
                  {visibleItems.map((item) => {
                    const isActive =
                      location.pathname === item.path ||
                      (item.path !== "/" && location.pathname.startsWith(item.path));

                    const listItemButton = (
                      <ListItemButton
                        onClick={() => navigate(item.path)}
                        aria-label={item.text}
                        aria-current={isActive ? "page" : undefined}
                        sx={{
                          borderRadius: 1,
                          mx: 1,
                          mb: 0.5,
                          ...(isActive && {
                            backgroundColor: "primary.main",
                            color: "white",
                            borderLeft: "3px solid",
                            borderColor: "primary.dark",
                            "&:hover": { backgroundColor: "primary.dark" },
                          }),
                          ...(!isActive && {
                            "&:hover": { backgroundColor: "action.hover" },
                          }),
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: collapsed ? 0 : 40,
                            color: isActive ? "white" : "text.secondary",
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        {!collapsed && (
                          <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{ fontSize: "0.875rem" }}
                          />
                        )}
                      </ListItemButton>
                    );

                    return (
                      <ListItem
                        key={item.text}
                        disablePadding
                        sx={{ display: "block" }}
                      >
                        {collapsed ? (
                          <Tooltip title={item.text} placement="right">
                            {listItemButton}
                          </Tooltip>
                        ) : (
                          listItemButton
                        )}
                      </ListItem>
                    );
                  })}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ py: 1, display: "flex", justifyContent: "center" }}>
        <IconButton onClick={onToggleCollapse} size="small">
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
    </Box>
  );
}

export function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
  userPermissions,
}: SidebarProps) {
  const theme = useTheme();

  return (
    <>
      {/* Mobile drawer — temporary, with backdrop */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          [`& .${drawerClasses.paper}`]: {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
          },
        }}
      >
        <SidebarContent
          collapsed={false}
          onToggleCollapse={onToggleCollapse}
          userPermissions={userPermissions}
        />
      </Drawer>

      {/* Desktop drawer — permanent */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          [`& .${drawerClasses.paper}`]: {
            boxSizing: "border-box",
            width: collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
            height: "100%",
            maxHeight: "100vh",
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          userPermissions={userPermissions}
        />
      </Drawer>
    </>
  );
}
