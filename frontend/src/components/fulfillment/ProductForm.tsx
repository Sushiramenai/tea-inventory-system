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
import { ProductCategory, ProductSizeFormat, ProductInventory } from '../../types';
import { CreateProductData, UpdateProductData } from '../../services/products.service';

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductData | UpdateProductData) => Promise<void>;
  product?: ProductInventory | null;
  loading?: boolean;
  error?: string | null;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  open,
  onClose,
  onSubmit,
  product,
  loading = false,
  error,
}) => {
  const isEdit = !!product;
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateProductData>({
    defaultValues: {
      teaName: '',
      category: ProductCategory.tea,
      sizeFormat: ProductSizeFormat.family,
      quantitySize: '',
      sku: '',
      barcode: '',
      physicalCount: 0,
      reorderThreshold: 0,
    },
  });

  React.useEffect(() => {
    if (product) {
      reset({
        teaName: product.teaName,
        category: product.category,
        sizeFormat: product.sizeFormat,
        quantitySize: product.quantitySize,
        sku: product.sku || '',
        barcode: product.barcode || '',
        physicalCount: Number(product.physicalCount),
        reorderThreshold: Number(product.reorderThreshold),
      });
    } else {
      reset({
        teaName: '',
        category: ProductCategory.tea,
        sizeFormat: ProductSizeFormat.family,
        quantitySize: '',
        sku: '',
        barcode: '',
        physicalCount: 0,
        reorderThreshold: 0,
      });
    }
  }, [product, reset]);

  const handleFormSubmit = async (data: CreateProductData) => {
    if (isEdit) {
      // For edit, exclude fields that can't be changed
      const { teaName, sizeFormat, quantitySize, ...updateData } = data;
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
        <DialogTitle>{isEdit ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller
                name="teaName"
                control={control}
                rules={{ required: 'Tea name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Tea Name"
                    fullWidth
                    disabled={isEdit}
                    error={!!errors.teaName}
                    helperText={errors.teaName?.message}
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
                    disabled={isEdit && product?.category === ProductCategory.tea}
                  >
                    {Object.values(ProductCategory).map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="sizeFormat"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Size Format"
                    fullWidth
                    disabled={isEdit}
                  >
                    {Object.values(ProductSizeFormat).map((format) => (
                      <MenuItem key={format} value={format}>
                        {format.charAt(0).toUpperCase() + format.slice(1)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="quantitySize"
                control={control}
                rules={{ required: 'Quantity size is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Quantity Size"
                    fullWidth
                    placeholder="e.g., 100g, 15 TB, 6 tins"
                    disabled={isEdit}
                    error={!!errors.quantitySize}
                    helperText={errors.quantitySize?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="sku"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="SKU (Optional)"
                    fullWidth
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="barcode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Barcode (Optional)"
                    fullWidth
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="physicalCount"
                control={control}
                rules={{ 
                  required: 'Physical count is required',
                  min: { value: 0, message: 'Count cannot be negative' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Physical Count"
                    fullWidth
                    error={!!errors.physicalCount}
                    helperText={errors.physicalCount?.message}
                  />
                )}
              />
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