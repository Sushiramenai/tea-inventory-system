import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Chip,
  IconButton,
  Stack,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../components/common/DataTable';
import { UserForm } from '../components/users/UserForm';
import { User, UserRole } from '../types';
import { usersService, CreateUserData, UpdateUserData, UserFilters } from '../services/users.service';
import { useAuth } from '../contexts/AuthContext';

interface ExtendedUser extends User {
  isActive?: boolean;
  createdAt?: string;
}

export const Users: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ExtendedUser | null>(null);
  const [filters, setFilters] = useState<UserFilters>({});

  // Fetch users
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users', filters],
    queryFn: () => usersService.getUsers(filters),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateUserData) => usersService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setFormOpen(false);
      setSelectedUser(null);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      usersService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setFormOpen(false);
      setSelectedUser(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
  });

  const handleAdd = () => {
    setSelectedUser(null);
    setFormOpen(true);
  };

  const handleEdit = (user: ExtendedUser) => {
    setSelectedUser(user);
    setFormOpen(true);
  };

  const handleDelete = (user: ExtendedUser) => {
    if (user.id === currentUser?.id) {
      alert("You cannot delete your own account");
      return;
    }
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
  };

  const handleFormSubmit = async (data: CreateUserData | UpdateUserData) => {
    if (selectedUser) {
      await updateMutation.mutateAsync({ id: selectedUser.id, data: data as UpdateUserData });
    } else {
      await createMutation.mutateAsync(data as CreateUserData);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.admin:
        return 'error';
      case UserRole.production:
        return 'primary';
      case UserRole.fulfillment:
        return 'secondary';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'username',
      headerName: 'Username',
      width: 150,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value.charAt(0).toUpperCase() + params.value.slice(1)}
          color={getRoleColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value !== false ? 'Active' : 'Inactive'}
          color={params.value !== false ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString() : '-',
    },
  ];

  const users = data?.users || [];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">User Management</Typography>
        <Stack direction="row" spacing={2}>
          <IconButton onClick={() => refetch()} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add User
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2}>
          <TextField
            select
            label="Role"
            size="small"
            value={filters.role || ''}
            onChange={(e) => setFilters({ ...filters, role: e.target.value as UserRole || undefined })}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Roles</MenuItem>
            {Object.values(UserRole).map((role) => (
              <MenuItem key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Status"
            size="small"
            value={filters.active === undefined ? '' : filters.active.toString()}
            onChange={(e) => setFilters({ 
              ...filters, 
              active: e.target.value === '' ? undefined : e.target.value === 'true' 
            })}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load users
        </Alert>
      )}

      <DataTable
        rows={users}
        columns={columns}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        height={600}
      />

      {/* User Form Dialog */}
      <UserForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleFormSubmit}
        user={selectedUser}
        loading={createMutation.isPending || updateMutation.isPending}
        error={createMutation.error?.message || updateMutation.error?.message}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user "{userToDelete?.username}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};