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
  Tooltip,
  TextField,
  MenuItem,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../components/common/DataTable';
import { ProductForm } from '../components/fulfillment/ProductForm';
import { ProductDetailsDialog } from '../components/products/ProductDetailsDialog';
import { ProductInventory, ProductCategory } from '../types';
import { productsService, CreateProductData, UpdateProductData, ProductFilters } from '../services/products.service';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export const Products: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductInventory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductInventory | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [productForDetails, setProductForDetails] = useState<ProductInventory | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: '',
    lowStock: false,
    page: 1,
    limit: 50,
  });

  const canEdit = user?.role === UserRole.fulfillment || user?.role === UserRole.admin;

  // Fetch products
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsService.getProducts(filters),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateProductData) => productsService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setFormOpen(false);
      setSelectedProduct(null);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductData }) =>
      productsService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setFormOpen(false);
      setSelectedProduct(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
  });

  const handleAdd = () => {
    setSelectedProduct(null);
    setFormOpen(true);
  };

  const handleEdit = (product: ProductInventory) => {
    setSelectedProduct(product);
    setFormOpen(true);
  };

  const handleDelete = (product: ProductInventory) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleViewDetails = (product: ProductInventory) => {
    setProductForDetails(product);
    setDetailsDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete.id);
    }
  };

  const handleFormSubmit = async (data: CreateProductData | UpdateProductData) => {
    if (selectedProduct) {
      await updateMutation.mutateAsync({ id: selectedProduct.id, data: data as UpdateProductData });
    } else {
      await createMutation.mutateAsync(data as CreateProductData);
    }
  };

  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setExportError(null);
      const blob = await productsService.exportProducts(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `product-inventory-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setExportError('Failed to export products. Please try again.');
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Product Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'tea' ? 'primary' : 'default'}
        />
      ),
    },
    {
      field: 'size',
      headerName: 'Size',
      width: 120,
    },
    {
      field: 'price',
      headerName: 'Price',
      width: 100,
      type: 'number',
      renderCell: (params) => `$${params.value?.toFixed(2) || '0.00'}`,
    },
    {
      field: 'sku',
      headerName: 'SKU',
      width: 120,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'stockQuantity',
      headerName: 'Stock',
      width: 100,
      type: 'number',
      renderCell: (params) => {
        const isLowStock = params.row.isLowStock;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {Number(params.value).toLocaleString()}
            {isLowStock && (
              <Tooltip title="Low stock">
                <WarningIcon color="warning" fontSize="small" />
              </Tooltip>
            )}
          </Box>
        );
      },
    },
    {
      field: 'reorderLevel',
      headerName: 'Reorder At',
      width: 100,
      type: 'number',
      valueFormatter: (value) => Number(value).toLocaleString(),
    },
    {
      field: 'updatedAt',
      headerName: 'Last Updated',
      width: 150,
      renderCell: (params) => new Date(params.value).toLocaleDateString(),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Product Inventory</Typography>
        <Stack direction="row" spacing={2}>
          <IconButton onClick={() => refetch()} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={isLoading}
          >
            Export CSV
          </Button>
          {canEdit && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
            >
              Add Product
            </Button>
          )}
        </Stack>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Search"
            size="small"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            sx={{ minWidth: 200 }}
          />
          <TextField
            select
            label="Category"
            size="small"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All</MenuItem>
            {Object.values(ProductCategory).map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant={filters.lowStock ? 'contained' : 'outlined'}
            onClick={() => setFilters({ ...filters, lowStock: !filters.lowStock })}
            startIcon={<WarningIcon />}
          >
            Low Stock Only
          </Button>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load products
        </Alert>
      )}

      {exportError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setExportError(null)}>
          {exportError}
        </Alert>
      )}

      <DataTable
        rows={data?.products || []}
        columns={columns}
        loading={isLoading}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canEdit ? handleDelete : undefined}
        onView={handleViewDetails}
        height={600}
      />

      {/* Product Form Dialog */}
      <ProductForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedProduct(null);
        }}
        onSubmit={handleFormSubmit}
        product={selectedProduct}
        loading={createMutation.isPending || updateMutation.isPending}
        error={createMutation.error?.message || updateMutation.error?.message}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{productToDelete?.name} - {productToDelete?.size}"?
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

      {/* Product Details Dialog */}
      <ProductDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setProductForDetails(null);
        }}
        product={productForDetails}
      />
    </Box>
  );
};