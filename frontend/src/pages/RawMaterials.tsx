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
import { RawMaterialForm } from '../components/production/RawMaterialForm';
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
  const [filters, setFilters] = useState<RawMaterialFilters>({
    search: '',
    category: '',
    lowStock: false,
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
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      setFormOpen(false);
      setSelectedMaterial(null);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRawMaterialData }) =>
      rawMaterialsService.updateRawMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      setFormOpen(false);
      setSelectedMaterial(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => rawMaterialsService.deleteRawMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
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

  const handleFormSubmit = async (data: CreateRawMaterialData | UpdateRawMaterialData) => {
    if (selectedMaterial) {
      await updateMutation.mutateAsync({ id: selectedMaterial.id, data: data as UpdateRawMaterialData });
    } else {
      await createMutation.mutateAsync(data as CreateRawMaterialData);
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
      field: 'itemName',
      headerName: 'Item Name',
      flex: 1,
      minWidth: 200,
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
      field: 'count',
      headerName: 'Count',
      width: 100,
      type: 'number',
      valueFormatter: (value) => Number(value).toLocaleString(),
    },
    {
      field: 'unit',
      headerName: 'Unit',
      width: 80,
    },
    {
      field: 'quantityPerUnit',
      headerName: 'Per Unit',
      width: 100,
      type: 'number',
      renderCell: (params) => params.value ? Number(params.value).toLocaleString() : '-',
    },
    {
      field: 'totalQuantity',
      headerName: 'Total',
      width: 120,
      type: 'number',
      renderCell: (params) => {
        const total = params.value || params.row.count;
        const isLowStock = params.row.isLowStock;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {Number(total).toLocaleString()}
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
      field: 'reorderThreshold',
      headerName: 'Reorder At',
      width: 100,
      type: 'number',
      valueFormatter: (value) => Number(value).toLocaleString(),
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
        error={createMutation.error?.message || updateMutation.error?.message}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{materialToDelete?.itemName}"?
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
    </Box>
  );
};