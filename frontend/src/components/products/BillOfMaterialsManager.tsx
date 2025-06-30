import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { ProductInventory } from '../../types';
import { bomService, CreateBOMData, UpdateBOMData, BOMWithDetails } from '../../services/bom.service';
import { rawMaterialsService } from '../../services/raw-materials.service';

interface BillOfMaterialsManagerProps {
  product: ProductInventory;
  canEdit?: boolean;
}

export const BillOfMaterialsManager: React.FC<BillOfMaterialsManagerProps> = ({ 
  product, 
  canEdit = false 
}) => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBOM, setEditingBOM] = useState<BOMWithDetails | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<BOMWithDetails | null>(null);

  // Fetch BOM for product
  const { data: bomData, isLoading } = useQuery({
    queryKey: ['bom', product.id],
    queryFn: () => bomService.getBOMByProductId(product.id),
  });

  // Fetch all raw materials for dropdown
  const { data: materialsData } = useQuery({
    queryKey: ['raw-materials-all'],
    queryFn: () => rawMaterialsService.getAllRawMaterials(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateBOMData) => bomService.createBOM(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom', product.id] });
      setDialogOpen(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBOMData }) => 
      bomService.updateBOM(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom', product.id] });
      setDialogOpen(false);
      setEditingBOM(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bomService.deleteBOM(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom', product.id] });
      setDeleteConfirm(null);
    },
  });

  // Form handling
  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateBOMData>({
    defaultValues: {
      productId: product.id,
      rawMaterialId: '',
      quantityRequired: 1,
      unitOverride: '',
    },
  });

  const materials = materialsData?.materials || [];
  const bom = bomData || [];

  // Calculate total cost
  const totalCost = bom.reduce((sum, item) => {
    return sum + (item.quantityRequired * item.rawMaterial.unitCost);
  }, 0);

  const handleAdd = () => {
    setEditingBOM(null);
    reset({
      productId: product.id,
      rawMaterialId: '',
      quantityRequired: 1,
      unitOverride: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (item: BOMWithDetails) => {
    setEditingBOM(item);
    reset({
      productId: product.id,
      rawMaterialId: item.rawMaterialId,
      quantityRequired: item.quantityRequired,
      unitOverride: item.unitOverride || '',
    });
    setDialogOpen(true);
  };

  const handleFormSubmit = async (data: CreateBOMData) => {
    if (editingBOM) {
      await updateMutation.mutateAsync({
        id: editingBOM.id,
        data: {
          quantityRequired: data.quantityRequired,
          unitOverride: data.unitOverride,
        },
      });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Bill of Materials</Typography>
        {canEdit && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add Material
          </Button>
        )}
      </Box>

      {bom.length === 0 ? (
        <Alert severity="warning">
          No materials defined for this product. Production requests cannot be created without defining required materials.
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Material</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell align="right">Quantity Required</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell align="right">Unit Cost</TableCell>
                  <TableCell align="right">Total Cost</TableCell>
                  {canEdit && <TableCell align="center">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {bom.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.rawMaterial.name}
                      {item.rawMaterial.stockQuantity < item.quantityRequired && (
                        <Chip
                          label="Low Stock"
                          color="warning"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{item.rawMaterial.sku}</TableCell>
                    <TableCell align="right">{item.quantityRequired}</TableCell>
                    <TableCell>{item.unitOverride || item.rawMaterial.unit}</TableCell>
                    <TableCell align="right">${item.rawMaterial.unitCost.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      ${(item.quantityRequired * item.rawMaterial.unitCost).toFixed(2)}
                    </TableCell>
                    {canEdit && (
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(item)}
                          title="Edit"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setDeleteConfirm(item)}
                          title="Delete"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={5} align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      Total Material Cost per Unit:
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      ${totalCost.toFixed(2)}
                    </Typography>
                  </TableCell>
                  {canEdit && <TableCell />}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Note: Material costs are estimates based on current unit costs. Actual costs may vary.
            </Typography>
          </Box>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogTitle>
            {editingBOM ? 'Edit Material Requirement' : 'Add Material Requirement'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Controller
                name="rawMaterialId"
                control={control}
                rules={{ required: 'Material is required' }}
                render={({ field: { onChange, value } }) => (
                  <Autocomplete
                    options={materials}
                    getOptionLabel={(option) => `${option.name} (${option.unit})`}
                    value={materials.find(m => m.id === value) || null}
                    onChange={(_, newValue) => onChange(newValue?.id || '')}
                    disabled={!!editingBOM}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body1">{option.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            SKU: {option.sku} • Stock: {option.stockQuantity} {option.unit}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Raw Material"
                        error={!!errors.rawMaterialId}
                        helperText={errors.rawMaterialId?.message}
                      />
                    )}
                  />
                )}
              />

              <Controller
                name="quantityRequired"
                control={control}
                rules={{ 
                  required: 'Quantity is required',
                  min: { value: 0.001, message: 'Quantity must be greater than 0' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Quantity Required"
                    fullWidth
                    margin="normal"
                    error={!!errors.quantityRequired}
                    helperText={errors.quantityRequired?.message}
                    inputProps={{ step: 'any', min: 0 }}
                  />
                )}
              />

              <Controller
                name="unitOverride"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Unit Override (Optional)"
                    fullWidth
                    margin="normal"
                    helperText="Leave empty to use the material's default unit"
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingBOM ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove "{deleteConfirm?.rawMaterial.name}" from the bill of materials?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            onClick={() => {
              if (deleteConfirm) {
                deleteMutation.mutate(deleteConfirm.id);
              }
            }}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};