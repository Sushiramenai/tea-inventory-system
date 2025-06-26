import React, { useEffect } from 'react';
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
  Typography,
  Box,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { MaterialCategory, MaterialUnit, RawMaterial } from '../../types';
import { CreateRawMaterialData, UpdateRawMaterialData } from '../../services/raw-materials.service';

interface RawMaterialFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRawMaterialData | UpdateRawMaterialData) => Promise<void>;
  material?: RawMaterial | null;
  loading?: boolean;
  error?: string | null;
}

export const RawMaterialForm: React.FC<RawMaterialFormProps> = ({
  open,
  onClose,
  onSubmit,
  material,
  loading = false,
  error,
}) => {
  const isEdit = !!material;
  
  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateRawMaterialData>({
    defaultValues: {
      itemName: '',
      category: MaterialCategory.tea,
      count: 0,
      unit: MaterialUnit.kg,
      quantityPerUnit: undefined,
      reorderThreshold: 0,
      notes: '',
    },
  });

  const watchCount = watch('count');
  const watchQuantityPerUnit = watch('quantityPerUnit');
  const watchUnit = watch('unit');

  // Calculate total quantity
  const calculateTotal = React.useMemo(() => {
    const count = Number(watchCount) || 0;
    const perUnit = Number(watchQuantityPerUnit);
    
    if (perUnit && perUnit > 0) {
      return count * perUnit;
    }
    return count;
  }, [watchCount, watchQuantityPerUnit]);

  // Check if quantity per unit should be shown
  const showQuantityPerUnit = ![MaterialUnit.pcs].includes(watchUnit as MaterialUnit);

  React.useEffect(() => {
    if (material) {
      reset({
        itemName: material.itemName,
        category: material.category,
        count: Number(material.count),
        unit: material.unit,
        quantityPerUnit: material.quantityPerUnit ? Number(material.quantityPerUnit) : undefined,
        reorderThreshold: Number(material.reorderThreshold),
        notes: material.notes || '',
      });
    } else {
      reset({
        itemName: '',
        category: MaterialCategory.tea,
        count: 0,
        unit: MaterialUnit.kg,
        quantityPerUnit: undefined,
        reorderThreshold: 0,
        notes: '',
      });
    }
  }, [material, reset]);

  // Reset quantity per unit when unit changes to pcs
  useEffect(() => {
    if (!showQuantityPerUnit) {
      setValue('quantityPerUnit', undefined);
    }
  }, [showQuantityPerUnit, setValue]);

  const handleFormSubmit = async (data: CreateRawMaterialData) => {
    if (isEdit) {
      // For edit, exclude fields that can't be changed
      const { itemName, category, ...updateData } = data;
      await onSubmit(updateData);
    } else {
      await onSubmit(data);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>{isEdit ? 'Edit Raw Material' : 'Add New Raw Material'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller
                name="itemName"
                control={control}
                rules={{ required: 'Item name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Item Name"
                    fullWidth
                    disabled={isEdit}
                    error={!!errors.itemName}
                    helperText={errors.itemName?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Category"
                    fullWidth
                    disabled={isEdit}
                  >
                    {Object.values(MaterialCategory).map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Unit"
                    fullWidth
                  >
                    {Object.values(MaterialUnit).map((unit) => (
                      <MenuItem key={unit} value={unit}>
                        {unit}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="count"
                control={control}
                rules={{ 
                  required: 'Count is required',
                  min: { value: 0, message: 'Count cannot be negative' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Count"
                    fullWidth
                    error={!!errors.count}
                    helperText={errors.count?.message}
                    inputProps={{ step: 0.01 }}
                  />
                )}
              />
            </Grid>

            {showQuantityPerUnit && (
              <Grid item xs={12} sm={6}>
                <Controller
                  name="quantityPerUnit"
                  control={control}
                  rules={{ 
                    min: { value: 0, message: 'Quantity cannot be negative' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="Quantity per Unit"
                      fullWidth
                      error={!!errors.quantityPerUnit}
                      helperText={errors.quantityPerUnit?.message || 'Leave empty if not applicable'}
                      inputProps={{ step: "any", min: 0 }}
                    />
                  )}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Quantity
                </Typography>
                <Typography variant="h5">
                  {calculateTotal.toLocaleString()} {watchUnit}
                </Typography>
                {watchQuantityPerUnit && (
                  <Typography variant="caption" color="text.secondary">
                    {watchCount} × {watchQuantityPerUnit} = {calculateTotal}
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="reorderThreshold"
                control={control}
                rules={{ 
                  required: 'Reorder threshold is required',
                  min: { value: 0, message: 'Threshold cannot be negative' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Reorder Threshold"
                    fullWidth
                    error={!!errors.reorderThreshold}
                    helperText={errors.reorderThreshold?.message}
                    inputProps={{ step: 0.01 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Notes (Optional)"
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="e.g., Japanese name, special instructions"
                  />
                )}
              />
            </Grid>
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