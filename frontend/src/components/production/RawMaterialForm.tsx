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
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateRawMaterialData>({
    defaultValues: {
      name: '',
      sku: '',
      category: MaterialCategory.tea,
      stockQuantity: 0,
      unit: MaterialUnit.kg,
      unitCost: 0,
      reorderLevel: 0,
      reorderQuantity: 0,
      supplier: '',
      notes: '',
    },
  });

  React.useEffect(() => {
    if (material) {
      reset({
        name: material.name,
        sku: material.sku,
        category: material.category,
        stockQuantity: Number(material.stockQuantity),
        unit: material.unit,
        unitCost: Number(material.unitCost),
        reorderLevel: Number(material.reorderLevel),
        reorderQuantity: Number(material.reorderQuantity),
        supplier: material.supplier || '',
        notes: material.notes || '',
      });
    } else {
      reset({
        name: '',
        sku: '',
        category: MaterialCategory.tea,
        stockQuantity: 0,
        unit: MaterialUnit.kg,
        unitCost: 0,
        reorderLevel: 0,
        reorderQuantity: 0,
        supplier: '',
        notes: '',
      });
    }
  }, [material, reset]);

  const handleFormSubmit = async (data: CreateRawMaterialData) => {
    // Convert string values to numbers
    const processedData = {
      ...data,
      stockQuantity: Number(data.stockQuantity),
      unitCost: Number(data.unitCost),
      reorderLevel: Number(data.reorderLevel),
      reorderQuantity: Number(data.reorderQuantity),
    };

    if (isEdit) {
      // For edit, exclude fields that can't be changed
      const { name, sku, ...updateData } = processedData;
      await onSubmit(updateData);
    } else {
      await onSubmit(processedData);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>{isEdit ? 'Edit Raw Material' : 'Add New Raw Material'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Material name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Material Name"
                    fullWidth
                    disabled={isEdit}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="sku"
                control={control}
                rules={{ required: 'SKU is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="SKU"
                    fullWidth
                    disabled={isEdit}
                    error={!!errors.sku}
                    helperText={errors.sku?.message || 'Unique identifier'}
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
                name="stockQuantity"
                control={control}
                rules={{ 
                  required: 'Stock quantity is required',
                  min: { value: 0, message: 'Stock quantity cannot be negative' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Stock Quantity"
                    fullWidth
                    error={!!errors.stockQuantity}
                    helperText={errors.stockQuantity?.message}
                    inputProps={{ step: 0.01 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="unitCost"
                control={control}
                rules={{ 
                  required: 'Unit cost is required',
                  min: { value: 0, message: 'Unit cost cannot be negative' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Unit Cost ($)"
                    fullWidth
                    error={!!errors.unitCost}
                    helperText={errors.unitCost?.message}
                    inputProps={{ step: 0.01 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="reorderLevel"
                control={control}
                rules={{ 
                  required: 'Reorder level is required',
                  min: { value: 0, message: 'Reorder level cannot be negative' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Reorder Level"
                    fullWidth
                    error={!!errors.reorderLevel}
                    helperText={errors.reorderLevel?.message || 'Minimum stock before reorder'}
                    inputProps={{ step: 0.01 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="reorderQuantity"
                control={control}
                rules={{ 
                  required: 'Reorder quantity is required',
                  min: { value: 0, message: 'Reorder quantity cannot be negative' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Reorder Quantity"
                    fullWidth
                    error={!!errors.reorderQuantity}
                    helperText={errors.reorderQuantity?.message || 'Amount to order'}
                    inputProps={{ step: 0.01 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="supplier"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Supplier (Optional)"
                    fullWidth
                    placeholder="e.g., Tea Farm Co."
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