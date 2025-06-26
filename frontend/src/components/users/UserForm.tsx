import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { User, UserRole } from '../../types';
import { CreateUserData, UpdateUserData } from '../../services/users.service';

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserData | UpdateUserData) => Promise<void>;
  user?: User | null;
  loading?: boolean;
  error?: string | null;
}

interface ExtendedUser extends User {
  isActive?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  open,
  onClose,
  onSubmit,
  user,
  loading = false,
  error,
}) => {
  const isEdit = !!user;
  const extendedUser = user as ExtendedUser | null;
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateUserData & { isActive: boolean }>({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      role: UserRole.fulfillment,
      isActive: true,
    },
  });

  React.useEffect(() => {
    if (extendedUser) {
      reset({
        username: extendedUser.username,
        email: extendedUser.email,
        password: '',
        role: extendedUser.role,
        isActive: extendedUser.isActive !== false,
      });
    } else {
      reset({
        username: '',
        email: '',
        password: '',
        role: UserRole.fulfillment,
        isActive: true,
      });
    }
  }, [extendedUser, reset]);

  const handleFormSubmit = async (data: CreateUserData & { isActive: boolean }) => {
    if (isEdit) {
      // For edit, exclude fields that can't be changed
      const { username, password, ...updateData } = data;
      await onSubmit(updateData);
    } else {
      // For create, exclude isActive as it's not needed
      const { isActive, ...createData } = data;
      await onSubmit(createData);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>{isEdit ? 'Edit User' : 'Create New User'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller
                name="username"
                control={control}
                rules={{ 
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Username must be at least 3 characters' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Username"
                    fullWidth
                    disabled={isEdit}
                    error={!!errors.username}
                    helperText={errors.username?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="email"
                control={control}
                rules={{ 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>

            {!isEdit && (
              <Grid item xs={12}>
                <Controller
                  name="password"
                  control={control}
                  rules={{ 
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Password"
                      type="password"
                      fullWidth
                      error={!!errors.password}
                      helperText={errors.password?.message || 'Minimum 6 characters'}
                    />
                  )}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Role"
                    fullWidth
                  >
                    {Object.values(UserRole).map((role) => (
                      <MenuItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {isEdit && (
              <Grid item xs={12}>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      }
                      label="Active"
                    />
                  )}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};