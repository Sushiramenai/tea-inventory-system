import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  Chip,
  IconButton,
  Stack,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  CheckCircle as CompleteIcon,
  PlayArrow as StartIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../components/common/DataTable';
import { ProductionRequestForm } from '../components/requests/ProductionRequestForm';
import { ProductionRequest, RequestStatus } from '../types';
import { 
  productionRequestsService, 
  CreateProductionRequestData, 
  UpdateProductionRequestData,
  ProductionRequestFilters,
  CompleteProductionRequestResponse
} from '../services/production-requests.service';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export const ProductionRequests: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProductionRequest | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completeResult, setCompleteResult] = useState<CompleteProductionRequestResponse | null>(null);
  const [filters, setFilters] = useState<ProductionRequestFilters>({
    status: undefined,
  });

  const canCreate = user?.role === UserRole.fulfillment || user?.role === UserRole.admin;
  const canComplete = user?.role === UserRole.production || user?.role === UserRole.admin;

  // Fetch requests
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['production-requests', filters],
    queryFn: () => productionRequestsService.getProductionRequests(filters),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateProductionRequestData) => 
      productionRequestsService.createProductionRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-requests'] });
      setFormOpen(false);
    },
  });

  // Update mutation (for status changes)
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductionRequestData }) =>
      productionRequestsService.updateProductionRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-requests'] });
    },
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: (id: string) =>
      productionRequestsService.completeProductionRequest(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['production-requests'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      setCompleteResult(data);
      setCompleteDialogOpen(true);
    },
  });

  const handleAdd = () => {
    setFormOpen(true);
  };

  const handleViewDetails = (request: ProductionRequest) => {
    setSelectedRequest(request);
    setDetailsDialogOpen(true);
  };

  const handleStartProduction = (request: ProductionRequest) => {
    updateMutation.mutate({
      id: request.id,
      data: { status: RequestStatus.in_progress },
    });
  };

  const [confirmCompleteRequest, setConfirmCompleteRequest] = useState<ProductionRequest | null>(null);

  const handleCompleteProduction = (request: ProductionRequest) => {
    setConfirmCompleteRequest(request);
  };

  const handleConfirmComplete = () => {
    if (confirmCompleteRequest) {
      completeMutation.mutate(confirmCompleteRequest.id);
      setConfirmCompleteRequest(null);
    }
  };

  const handleFormSubmit = async (data: CreateProductionRequestData) => {
    const result = await createMutation.mutateAsync(data);
    return result;
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.pending:
        return 'warning';
      case RequestStatus.in_progress:
        return 'info';
      case RequestStatus.completed:
        return 'success';
      case RequestStatus.cancelled:
        return 'error';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'requestNumber',
      headerName: 'Request #',
      width: 150,
    },
    {
      field: 'product',
      headerName: 'Product',
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">{params.value.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {params.value.size}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'quantityRequested',
      headerName: 'Quantity',
      width: 100,
      type: 'number',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value.replace('_', ' ')}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'allMaterialsAvailable',
      headerName: 'Materials',
      width: 100,
      renderCell: (params) => (
        params.value ? (
          <Chip label="Available" color="success" size="small" />
        ) : (
          <Chip label="Check" color="warning" size="small" />
        )
      ),
    },
    {
      field: 'requestedBy',
      headerName: 'Requested By',
      width: 120,
      renderCell: (params) => params.value.username,
    },
    {
      field: 'requestedAt',
      headerName: 'Requested',
      width: 150,
      renderCell: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      type: 'actions',
      getActions: (params) => {
        const request = params.row as ProductionRequest;
        const actions = [
          <IconButton
            key="details"
            onClick={() => handleViewDetails(request)}
            size="small"
            title="View Details"
          >
            <InfoIcon />
          </IconButton>,
        ];

        if (canComplete && request.status === RequestStatus.pending) {
          actions.push(
            <IconButton
              key="start"
              onClick={() => handleStartProduction(request)}
              size="small"
              color="info"
              title="Start Production"
            >
              <StartIcon />
            </IconButton>
          );
        }

        if (canComplete && request.status === RequestStatus.in_progress) {
          actions.push(
            <IconButton
              key="complete"
              onClick={() => handleCompleteProduction(request)}
              size="small"
              color="success"
              title="Complete Production"
            >
              <CompleteIcon />
            </IconButton>
          );
        }

        return actions;
      },
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Production Requests</Typography>
        <Stack direction="row" spacing={2}>
          <IconButton onClick={() => refetch()} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
            >
              New Request
            </Button>
          )}
        </Stack>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2}>
          <TextField
            select
            label="Status"
            size="small"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All</MenuItem>
            {Object.values(RequestStatus).map((status) => (
              <MenuItem key={status} value={status}>
                {status.replace('_', ' ')}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load production requests
        </Alert>
      )}

      <DataTable
        rows={data?.requests || []}
        columns={columns}
        loading={isLoading}
        height={600}
        actions={false}
      />

      {/* Create Request Form */}
      <ProductionRequestForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        loading={createMutation.isPending}
        error={createMutation.error?.message}
      />

      {/* Request Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Production Request Details
          {selectedRequest && (
            <Chip
              label={selectedRequest.status.replace('_', ' ')}
              color={getStatusColor(selectedRequest.status)}
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Request #{selectedRequest.requestNumber}
              </Typography>
              <Typography variant="body2" paragraph>
                Product: {selectedRequest.product.name} - {selectedRequest.product.size}
              </Typography>
              <Typography variant="body2" paragraph>
                Quantity: {selectedRequest.quantityRequested} units
              </Typography>
              <Typography variant="body2" paragraph>
                Requested by: {selectedRequest.requestedBy.username} on {new Date(selectedRequest.requestedAt).toLocaleString()}
              </Typography>
              {selectedRequest.completedBy && (
                <Typography variant="body2" paragraph>
                  Completed by: {selectedRequest.completedBy.username} on {new Date(selectedRequest.completedAt!).toLocaleString()}
                </Typography>
              )}
              {selectedRequest.notes && (
                <Typography variant="body2" paragraph>
                  Notes: {selectedRequest.notes}
                </Typography>
              )}
              
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Material Requirements
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Material</TableCell>
                      <TableCell align="right">Required</TableCell>
                      <TableCell align="right">Available at Request</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRequest.materials?.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell>{material.rawMaterial?.itemName || 'Unknown'}</TableCell>
                        <TableCell align="right">{Number(material.quantityConsumed).toLocaleString()}</TableCell>
                        <TableCell align="right">{Number(material.quantityAvailableAtRequest).toLocaleString()}</TableCell>
                        <TableCell align="center">
                          {material.isAvailable ? (
                            <Chip label="Available" color="success" size="small" />
                          ) : (
                            <Chip label="Insufficient" color="error" size="small" />
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
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Complete Dialog */}
      <Dialog open={!!confirmCompleteRequest} onClose={() => setConfirmCompleteRequest(null)}>
        <DialogTitle>Confirm Production Completion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to complete this production request? This will:
            <ul>
              <li>Update product inventory</li>
              <li>Deduct raw materials from stock</li>
              <li>Mark the request as completed</li>
            </ul>
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCompleteRequest(null)}>Cancel</Button>
          <Button
            onClick={handleConfirmComplete}
            color="primary"
            variant="contained"
            disabled={completeMutation.isPending}
          >
            {completeMutation.isPending ? 'Completing...' : 'Complete Production'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Completion Result Dialog */}
      <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)}>
        <DialogTitle>Production Completed Successfully</DialogTitle>
        <DialogContent>
          {completeResult && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Production request completed and inventory updated.
              </Alert>
              
              <Typography variant="subtitle2" gutterBottom>
                Product Updated:
              </Typography>
              <Typography variant="body2" paragraph>
                Previous count: {completeResult.inventoryUpdates.productUpdated.previousCount} → 
                New count: {completeResult.inventoryUpdates.productUpdated.newCount}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Materials Consumed:
              </Typography>
              {completeResult.inventoryUpdates.materialsConsumed.map((material, index) => (
                <Typography key={index} variant="body2">
                  {material.itemName}: -{material.consumed} (Remaining: {material.remaining})
                </Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCompleteDialogOpen(false);
            setCompleteResult(null);
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};