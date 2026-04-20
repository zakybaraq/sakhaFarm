import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
} from "@mui/material";
import { ResponsiveTable } from "../../components/ui/ResponsiveTable";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  listPermissions,
  getRolePermissions,
  assignPermissionToRole,
} from "../../api/rbac";
import {
  listUsers,
  type UsersResponse,
  deleteUser,
  activateUser,
  deactivateUser,
} from "../../api/users";
import { useAuth } from "../../contexts/AuthContext";
import { ColumnDef } from "../../types/table";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant: string;
  status: "active" | "inactive";
}

interface RoleDisplay {
  id: number;
  name: string;
  description: string;
  userCount: number;
  permissionCount: number;
}

const categories = [
  "unit",
  "plasma",
  "cycle",
  "recording",
  "feed",
  "inventory",
  "audit",
  "rbac",
  "user",
];

export function RbacManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDisplay | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleForm, setRoleForm] = useState({ name: "", description: "" });
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "",
    tenant: "",
  });
  const [selectedPermissions, setSelectedPermissions] = useState<
    (string | number)[]
  >([]);

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", user?.tenantId],
    queryFn: () => {
      const tenantId = user?.tenantId;
      if (!tenantId) {
        console.warn("RBAC: No tenantId available, using default 1");
        return listRoles(1);
      }
      return listRoles(tenantId);
    },
    enabled: !!user,
  });

  const { data: permissionsData } = useQuery({
    queryKey: ["permissions"],
    queryFn: listPermissions,
  });

  const permissions = permissionsData?.permissions ?? [];

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => listUsers(),
    enabled: !!user,
  });

  const { data: rolePermsData } = useQuery({
    queryKey: ["rolePermissions", editingRole?.id],
    queryFn: () =>
      editingRole?.id
        ? getRolePermissions(editingRole.id)
        : Promise.resolve({ permissions: [] }),
    enabled: !!editingRole?.id,
  });

  const [roles, setRoles] = useState<RoleDisplay[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (rolesData?.roles) {
      const userCounts: Record<number, number> = {};
      if (usersData?.users) {
        usersData.users.forEach((u) => {
          const roleId = u.roleId;
          if (roleId) {
            userCounts[roleId] = (userCounts[roleId] || 0) + 1;
          }
        });
      }

      setRoles(
        rolesData.roles.map((r) => ({
          ...r,
          userCount: userCounts[r.id] || 0,
          permissionCount: 0,
        })),
      );

      // Fetch permission counts for each role
      rolesData.roles.forEach(async (role) => {
        try {
          const result = await getRolePermissions(role.id);
          setRoles((prev) =>
            prev.map((r) =>
              r.id === role.id
                ? { ...r, permissionCount: result.permissions.length }
                : r,
            ),
          );
        } catch {
          // Silently ignore permission fetch errors
        }
      });
    }
  }, [rolesData, usersData]);

  useEffect(() => {
    if (usersData) {
      setUsers(
        usersData.users.map((u: UsersResponse["users"][number]) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: String(u.roleId ?? 0),
          tenant: String(u.tenantId ?? 0),
          status: u.status,
        })),
      );
    }
  }, [usersData]);

  const createRoleMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { name?: string; description?: string; permissions?: number[] };
    }) => updateRole(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });

  const roleColumns: ColumnDef<RoleDisplay>[] = [
    {
      accessorKey: "name",
      header: "Role Name",
      size: 180,
    },
    {
      accessorKey: "description",
      header: "Description",
      size: 250,
    },
    {
      accessorKey: "userCount",
      header: "Users",
      size: 100,
    },
    {
      accessorKey: "permissionCount",
      header: "Permissions",
      size: 120,
    },
    {
      accessorKey: "actions",
      header: "Actions",
      size: 120,
      cell: ({ row }) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleEditRole(row.original);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Delete role "${row.original.name}"?`)) {
                deleteRoleMutation.mutate(row.original.id);
              }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const userColumns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
      size: 180,
    },
    {
      accessorKey: "email",
      header: "Email",
      size: 180,
    },
    {
      accessorKey: "role",
      header: "Role",
      size: 120,
    },
    {
      accessorKey: "tenant",
      header: "Tenant",
      size: 180,
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 120,
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Switch
            size="small"
            checked={status === "active"}
            onChange={(e) => {
              e.stopPropagation();
              handleToggleUserStatus(row.original.id);
            }}
            inputProps={{ "aria-label": "user status toggle" }}
          />
        );
      },
    },
    {
      accessorKey: "actions",
      header: "Actions",
      size: 120,
      cell: ({ row }) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleEditUser(row.original);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteUser(row.original);
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const handleEditRole = (role: RoleDisplay) => {
    setEditingRole(role);
    setRoleForm({ name: role.name, description: role.description });
    // Load role's current permissions
    const { data: rolePermsData } = useQuery({
      queryKey: ["rolePermissions", role.id],
      queryFn: () => getRolePermissions(role.id),
      enabled: !!role,
    });
    setSelectedPermissions(rolePermsData?.permissions.map((p) => p.id) ?? []);
    setRoleDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      tenant: user.tenant,
    });
    setUserDialogOpen(true);
  };

  const handleToggleUserStatus = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    try {
      if (user.status === "active") {
        await deactivateUser(userId);
      } else {
        await activateUser(userId);
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, status: u.status === "active" ? "inactive" : "active" }
            : u,
        ),
      );
    } catch (err) {
      alert("Failed to update user status");
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) {
      try {
        const result = await deleteUser(String(user.id));
        console.log("Delete result:", result);
        if (result.success) {
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
        } else {
          alert("Failed to delete user");
        }
      } catch (err: any) {
        console.error("Delete error:", err);
        alert(
          "Failed to delete user: " +
            (err.message || err?.error || "Unknown error"),
        );
      }
    }
  };

  const handleSaveRole = () => {
    if (editingRole) {
      updateRoleMutation.mutate(
        { id: editingRole.id, data: roleForm },
        {
          onSuccess: () => {
            // Assign selected permissions to the role
            if (selectedPermissions.length > 0) {
              for (const permId of selectedPermissions) {
                assignPermissionToRole(
                  editingRole.id,
                  Number(permId),
                  "assign",
                );
              }
            }
            setRoleDialogOpen(false);
          },
        },
      );
    } else {
      createRoleMutation.mutate(
        { name: roleForm.name, description: roleForm.description },
        {
          onSuccess: () => {
            // Note: For new roles, permissions would need to be assigned after creation
            // This would require getting the created role ID first
            setRoleDialogOpen(false);
          },
        },
      );
    }
  };

  const handleSaveUser = () => {
    if (editingUser) {
      setUsers(
        users.map((u) => (u.id === editingUser.id ? { ...u, ...userForm } : u)),
      );
    } else {
      setUsers([
        ...users,
        {
          id: "temp-" + Date.now(),
          ...userForm,
          status: "active" as const,
        },
      ]);
    }
    setUserDialogOpen(false);
  };

  const groupedPermissions = categories.reduce(
    (acc, category) => {
      acc[category] = permissions.filter(
        (p: { category: string }) => p.category === category,
      );
      return acc;
    },
    {} as Record<string, typeof permissions>,
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, fontSize: "24px" }}>
          RBAC Manager
        </Typography>
        {tabValue === 0 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingRole(null);
              setRoleForm({ name: "", description: "" });
              setSelectedPermissions([]);
              setRoleDialogOpen(true);
            }}
            sx={{ bgcolor: "#2E7D32", "&:hover": { bgcolor: "#1B5E20" } }}
          >
            Add Role
          </Button>
        )}
        {tabValue === 2 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingUser(null);
              setUserForm({ name: "", email: "", role: "", tenant: "" });
              setUserDialogOpen(true);
            }}
            sx={{ bgcolor: "#2E7D32", "&:hover": { bgcolor: "#1B5E20" } }}
          >
            Add User
          </Button>
        )}
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Roles" />
          <Tab label="Permissions" />
          <Tab label="Users" />
        </Tabs>

        {tabValue === 0 && (
          <Box sx={{ p: 2 }}>
            <ResponsiveTable
              columns={roleColumns}
              data={roles}
              enableSorting
              enableFiltering
              enablePagination
              initialPageSize={10}
              className="w-full"
              loading={rolesLoading}
            />
          </Box>
        )}

        {tabValue === 1 && (
          <Box sx={{ p: 2 }}>
            {Object.entries(groupedPermissions).map(
              ([category, permissions]) => (
                <Box key={category} sx={{ mb: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{ textTransform: "capitalize", mb: 1 }}
                  >
                    {category}
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "#f8fafc" }}>
                          <TableCell sx={{ fontWeight: 600 }}>
                            Permission
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {permissions.map((perm) => (
                          <TableRow key={perm.id}>
                            <TableCell>{perm.name}</TableCell>
                            <TableCell>
                              <Chip
                                label={perm.id}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ),
            )}
          </Box>
        )}

        {tabValue === 2 && (
          <Box sx={{ p: 2 }}>
            <ResponsiveTable
              columns={userColumns}
              data={users}
              enableSorting
              enableFiltering
              enablePagination
              initialPageSize={10}
              className="w-full"
              loading={usersLoading}
            />
          </Box>
        )}
      </Paper>

      <Dialog
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editingRole ? "Edit Role" : "Create Role"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <TextField
              label="Role Name"
              value={roleForm.name}
              onChange={(e) =>
                setRoleForm({ ...roleForm, name: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Description"
              value={roleForm.description}
              onChange={(e) =>
                setRoleForm({ ...roleForm, description: e.target.value })
              }
              fullWidth
              multiline
              rows={2}
            />

            <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 600 }}>
              Permissions
            </Typography>

            {Object.entries(groupedPermissions).map(
              ([category, permissions]) => (
                <Box key={category} sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ textTransform: "capitalize", mb: 1 }}
                  >
                    {category}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {permissions.map((perm) => (
                      <FormControlLabel
                        key={perm.id}
                        control={
                          <Checkbox
                            checked={selectedPermissions.includes(perm.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPermissions([
                                  ...selectedPermissions,
                                  perm.id,
                                ]);
                              } else {
                                setSelectedPermissions(
                                  selectedPermissions.filter(
                                    (p) => p !== perm.id,
                                  ),
                                );
                              }
                            }}
                            size="small"
                          />
                        }
                        label={perm.name}
                      />
                    ))}
                  </Box>
                </Box>
              ),
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveRole}
            startIcon={<SaveIcon />}
            sx={{ bgcolor: "#2E7D32", "&:hover": { bgcolor: "#1B5E20" } }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingUser ? "Edit User" : "Create User"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <TextField
              label="Name"
              value={userForm.name}
              onChange={(e) =>
                setUserForm({ ...userForm, name: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Email"
              value={userForm.email}
              onChange={(e) =>
                setUserForm({ ...userForm, email: e.target.value })
              }
              fullWidth
              type="email"
            />
            <TextField
              label="Role"
              value={userForm.role}
              onChange={(e) =>
                setUserForm({ ...userForm, role: e.target.value })
              }
              fullWidth
              select
            >
              {roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </TextField>
            <TextField
              label="Tenant"
              value={userForm.tenant}
              onChange={(e) =>
                setUserForm({ ...userForm, tenant: e.target.value })
              }
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveUser}
            startIcon={<SaveIcon />}
            sx={{ bgcolor: "#2E7D32", "&:hover": { bgcolor: "#1B5E20" } }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
