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
import { ProductCategory, ProductInventory } from '../../types';
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
      name: '',
      category: ProductCategory.tea,
      size: '',
      price: 0,
      sku: '',
      barcode: '',
      stockQuantity: 0,
      reorderLevel: 0,
      reorderQuantity: 0,
    },
  });

  React.useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        category: product.category,
        size: product.size,
        price: product.price,
        sku: product.sku || '',
        barcode: product.barcode || '',
        stockQuantity: product.stockQuantity,
        reorderLevel: product.reorderLevel,
        reorderQuantity: product.reorderQuantity,
      });
    } else {
      reset({
        name: '',
        category: ProductCategory.tea,
        size: '',
        price: 0,
        sku: '',
        barcode: '',
        stockQuantity: 0,
        reorderLevel: 0,
        reorderQuantity: 0,
      });
    }
  }, [product, reset]);

  const handleFormSubmit = async (data: CreateProductData) => {
    if (isEdit) {
      // For edit, exclude fields that can't be changed (SKU is immutable)
      const { sku, ...updateData } = data;
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
                name="name"
                control={control}
                rules={{ required: 'Product name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Product Name"
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
                name="size"
                control={control}
                rules={{ required: 'Size is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Size"
                    fullWidth
                    placeholder="e.g., 100g, 20 bags, 250ml"
                    error={!!errors.size}
                    helperText={errors.size?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="price"
                control={control}
                rules={{ 
                  required: 'Price is required',
                  min: { value: 0, message: 'Price cannot be negative' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Price"
                    fullWidth
                    InputProps={{
                      startAdornment: '$',
                    }}
                    error={!!errors.price}
                    helperText={errors.price?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="sku"
                control={control}
                rules={{ required: !isEdit ? 'SKU is required' : undefined }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="SKU"
                    fullWidth
                    disabled={isEdit}
                    required={!isEdit}
                    error={!!errors.sku}
                    helperText={errors.sku?.message || (isEdit ? 'Cannot change SKU' : '')}
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
                name="stockQuantity"
                control={control}
                rules={{ 
                  required: 'Stock quantity is required',
                  min: { value: 0, message: 'Stock cannot be negative' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Stock Quantity"
                    fullWidth
                    error={!!errors.stockQuantity}
                    helperText={errors.stockQuantity?.message}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                    helperText={errors.reorderLevel?.message}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="reorderQuantity"
                control={control}
                rules={{ 
                  min: { value: 0, message: 'Reorder quantity cannot be negative' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Reorder Quantity"
                    fullWidth
                    error={!!errors.reorderQuantity}
                    helperText={errors.reorderQuantity?.message}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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