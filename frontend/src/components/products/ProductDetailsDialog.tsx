import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Grid,
  Chip,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { ProductInventory, UserRole } from '../../types';
import { BillOfMaterialsManager } from './BillOfMaterialsManager';
import { useAuth } from '../../contexts/AuthContext';

interface ProductDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  product: ProductInventory | null;
}

export const ProductDetailsDialog: React.FC<ProductDetailsDialogProps> = ({
  open,
  onClose,
  product,
}) => {
  const { user } = useAuth();
  const canEditBOM = user?.role === UserRole.production || user?.role === UserRole.admin;

  if (!product) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Product Details</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Product Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              {product.name}
            </Typography>
            <Box display="flex" gap={1} mb={2}>
              <Chip 
                label={product.category || 'Uncategorized'} 
                color="primary" 
                size="small" 
              />
              {product.stockQuantity < product.reorderLevel && (
                <Chip 
                  label="Low Stock" 
                  color="warning" 
                  size="small" 
                />
              )}
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              SKU
            </Typography>
            <Typography variant="body1" gutterBottom>
              {product.sku}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Size
            </Typography>
            <Typography variant="body1" gutterBottom>
              {product.size}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Price
            </Typography>
            <Typography variant="body1" gutterBottom>
              ${product.price.toFixed(2)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Current Stock
            </Typography>
            <Typography variant="body1" gutterBottom>
              {product.stockQuantity.toLocaleString()} units
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Reorder Level
            </Typography>
            <Typography variant="body1" gutterBottom>
              {product.reorderLevel.toLocaleString()} units
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Reorder Quantity
            </Typography>
            <Typography variant="body1" gutterBottom>
              {product.reorderQuantity.toLocaleString()} units
            </Typography>
          </Grid>

          {product.barcode && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Barcode
              </Typography>
              <Typography variant="body1" gutterBottom>
                {product.barcode}
              </Typography>
            </Grid>
          )}
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Bill of Materials Section */}
        <BillOfMaterialsManager 
          product={product} 
          canEdit={canEditBOM} 
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};