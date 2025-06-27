import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Autocomplete,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
} from '@mui/material';
import { CheckCircle as CheckIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { ProductInventory } from '../../types';
import { productsService } from '../../services/products.service';
import { CreateProductionRequestData, MaterialCheck } from '../../services/production-requests.service';

interface ProductionRequestFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductionRequestData) => Promise<{ materialsCheck: { allAvailable: boolean; materials: MaterialCheck[] } }>;
  loading?: boolean;
  error?: string | null;
}

export const ProductionRequestForm: React.FC<ProductionRequestFormProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  error,
}) => {
  const [materialsCheck, setMaterialsCheck] = useState<MaterialCheck[] | null>(null);
  const [allMaterialsAvailable, setAllMaterialsAvailable] = useState(true);
  
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<CreateProductionRequestData>({
    defaultValues: {
      productId: '',
      quantityRequested: 1,
      notes: '',
    },
  });

  const selectedProductId = watch('productId');
  const quantityRequested = watch('quantityRequested');

  // Fetch all products for selection
  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => productsService.getProducts({ limit: 1000 }),
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      reset();
      setMaterialsCheck(null);
      setAllMaterialsAvailable(true);
    }
  }, [open, reset]);

  const handleFormSubmit = async (data: CreateProductionRequestData) => {
    try {
      const result = await onSubmit(data);
      if (result?.materialsCheck) {
        setMaterialsCheck(result.materialsCheck.materials);
        setAllMaterialsAvailable(result.materialsCheck.allAvailable);
      }
    } catch (error) {
      // Error is handled by parent component
      setMaterialsCheck(null);
    }
  };

  const handleClose = () => {
    reset();
    setMaterialsCheck(null);
    onClose();
  };

  const products = productsData?.products || [];
  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>Create Production Request</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ mt: 2, mb: 3 }}>
            <Controller
              name="productId"
              control={control}
              rules={{ required: 'Product is required' }}
              render={({ field: { onChange, value } }) => (
                <Autocomplete
                  options={products}
                  getOptionLabel={(option) => `${option.name} - ${option.size}`}
                  value={products.find(p => p.id === value) || null}
                  onChange={(_, newValue) => onChange(newValue?.id || '')}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="body1">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.size} • SKU: {option.sku || 'N/A'} • Stock: {option.stockQuantity}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Product"
                      error={!!errors.productId}
                      helperText={errors.productId?.message}
                    />
                  )}
                />
              )}
            />
          </Box>

          {selectedProduct && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Current Stock: {selectedProduct.stockQuantity} units
              </Typography>
              {selectedProduct.reorderLevel > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Reorder level: {selectedProduct.reorderLevel} units
                </Typography>
              )}
            </Box>
          )}

          <Controller
            name="quantityRequested"
            control={control}
            rules={{ 
              required: 'Quantity is required',
              min: { value: 1, message: 'Quantity must be at least 1' }
            }}
            render={({ field }) => (
              <TextField
                {...field}
                type="number"
                label="Quantity to Produce"
                fullWidth
                sx={{ mb: 3 }}
                error={!!errors.quantityRequested}
                helperText={errors.quantityRequested?.message}
                inputProps={{ min: 1 }}
              />
            )}
          />

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
                sx={{ mb: 3 }}
              />
            )}
          />

          {materialsCheck && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Required Materials
              </Typography>
              {!allMaterialsAvailable && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Some materials have insufficient stock. Production can still be requested but may need to wait for restocking.
                </Alert>
              )}
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Material</TableCell>
                      <TableCell align="right">Required</TableCell>
                      <TableCell align="right">Available</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {materialsCheck.map((material) => (
                      <TableRow key={material.rawMaterialId}>
                        <TableCell>{material.itemName}</TableCell>
                        <TableCell align="right">{material.required}</TableCell>
                        <TableCell align="right">{material.available}</TableCell>
                        <TableCell align="center">
                          {material.sufficient ? (
                            <Chip
                              icon={<CheckIcon />}
                              label="Available"
                              color="success"
                              size="small"
                            />
                          ) : (
                            <Chip
                              icon={<CancelIcon />}
                              label="Insufficient"
                              color="error"
                              size="small"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || !selectedProductId || quantityRequested < 1}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Request'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};