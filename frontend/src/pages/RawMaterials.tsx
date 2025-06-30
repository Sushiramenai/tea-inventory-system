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
  Inventory as InventoryIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../components/common/DataTable';
import { RawMaterialForm } from '../components/production/RawMaterialForm';
import { StockAdjustmentDialog } from '../components/raw-materials/StockAdjustmentDialog';
import { AdjustmentHistory } from '../components/raw-materials/AdjustmentHistory';
import { RawMaterial, MaterialCategory } from '../types';
import { rawMaterialsService, CreateRawMaterialData, UpdateRawMaterialData, RawMaterialFilters } from '../services/raw-materials.service';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export const RawMaterials: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<RawMaterial | null>(null);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [materialToAdjust, setMaterialToAdjust] = useState<RawMaterial | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [materialForHistory, setMaterialForHistory] = useState<RawMaterial | null>(null);
  const [filters, setFilters] = useState<RawMaterialFilters>({
    search: '',
    category: '',
    lowStock: false,
    page: 1,
    limit: 50,
  });

  const canEdit = user?.role === UserRole.production || user?.role === UserRole.admin;

  // Fetch materials
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['raw-materials', filters],
    queryFn: () => rawMaterialsService.getRawMaterials(filters),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateRawMaterialData) => rawMaterialsService.createRawMaterial(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'], exact: false });
      setFormOpen(false);
      setSelectedMaterial(null);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRawMaterialData }) =>
      rawMaterialsService.updateRawMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'], exact: false });
      setFormOpen(false);
      setSelectedMaterial(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => rawMaterialsService.deleteRawMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'], exact: false });
      setDeleteDialogOpen(false);
      setMaterialToDelete(null);
    },
  });

  const handleAdd = () => {
    setSelectedMaterial(null);
    setFormOpen(true);
  };

  const handleEdit = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setFormOpen(true);
  };

  const handleDelete = (material: RawMaterial) => {
    setMaterialToDelete(material);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (materialToDelete) {
      deleteMutation.mutate(materialToDelete.id);
    }
  };

  const handleAdjustStock = (material: RawMaterial) => {
    setMaterialToAdjust(material);
    setAdjustmentDialogOpen(true);
  };

  const handleViewHistory = (material: RawMaterial) => {
    setMaterialForHistory(material);
    setHistoryDialogOpen(true);
  };

  const handleFormSubmit = async (data: CreateRawMaterialData | UpdateRawMaterialData) => {
    try {
      if (selectedMaterial) {
        await updateMutation.mutateAsync({ id: selectedMaterial.id, data: data as UpdateRawMaterialData });
      } else {
        await createMutation.mutateAsync(data as CreateRawMaterialData);
      }
    } catch (error) {
      // Error will be handled by the mutation error state
      console.error('Form submission error:', error);
    }
  };

  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setExportError(null);
      const blob = await rawMaterialsService.exportRawMaterials(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `raw-materials-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setExportError('Failed to export raw materials. Please try again.');
    }
  };

  const formatCategory = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Material Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'sku',
      headerName: 'SKU',
      width: 120,
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={formatCategory(params.value)}
          size="small"
          color={params.value === 'tea' ? 'primary' : 'default'}
        />
      ),
    },
    {
      field: 'stockQuantity',
      headerName: 'Stock Qty',
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
      field: 'unit',
      headerName: 'Unit',
      width: 80,
    },
    {
      field: 'unitCost',
      headerName: 'Unit Cost',
      width: 100,
      type: 'number',
      valueFormatter: (value) => `$${Number(value).toFixed(2)}`,
    },
    {
      field: 'reorderLevel',
      headerName: 'Reorder At',
      width: 100,
      type: 'number',
      valueFormatter: (value) => Number(value).toLocaleString(),
    },
    {
      field: 'supplier',
      headerName: 'Supplier',
      width: 150,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'notes',
      headerName: 'Notes',
      width: 150,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'updatedAt',
      headerName: 'Last Updated',
      width: 150,
      renderCell: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          {canEdit && (
            <Tooltip title="Adjust Stock">
              <IconButton
                size="small"
                onClick={() => handleAdjustStock(params.row)}
                color="primary"
              >
                <InventoryIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="View History">
            <IconButton
              size="small"
              onClick={() => handleViewHistory(params.row)}
              color="default"
            >
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Raw Materials</Typography>
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
              Add Material
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
            {Object.values(MaterialCategory).map((cat) => (
              <MenuItem key={cat} value={cat}>
                {formatCategory(cat)}
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
          Failed to load raw materials
        </Alert>
      )}

      {exportError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setExportError(null)}>
          {exportError}
        </Alert>
      )}

      <DataTable
        rows={data?.materials || []}
        columns={columns}
        loading={isLoading}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canEdit ? handleDelete : undefined}
        height={600}
      />

      {/* Material Form Dialog */}
      <RawMaterialForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedMaterial(null);
        }}
        onSubmit={handleFormSubmit}
        material={selectedMaterial}
        loading={createMutation.isPending || updateMutation.isPending}
        error={(() => {
          const error = createMutation.error || updateMutation.error;
          if (!error) return null;
          
          // Handle different error formats
          if (typeof error === 'string') return error;
          if ((error as any)?.error?.message) return (error as any).error.message;
          if ((error as any)?.message) return (error as any).message;
          return 'An error occurred. Please try again.';
        })()}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{materialToDelete?.name}"?
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

      {/* Stock Adjustment Dialog */}
      <StockAdjustmentDialog
        open={adjustmentDialogOpen}
        onClose={() => {
          setAdjustmentDialogOpen(false);
          setMaterialToAdjust(null);
        }}
        material={materialToAdjust}
      />

      {/* Adjustment History Dialog */}
      <Dialog 
        open={historyDialogOpen} 
        onClose={() => {
          setHistoryDialogOpen(false);
          setMaterialForHistory(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Stock Adjustment History - {materialForHistory?.name}
        </DialogTitle>
        <DialogContent>
          {materialForHistory && (
            <AdjustmentHistory
              materialId={materialForHistory.id}
              materialName={materialForHistory.name}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};