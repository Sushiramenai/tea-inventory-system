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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
} from '@mui/material';
import {
  Sync as SyncIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  Inventory as InventoryIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../components/common/DataTable';
import { shopifyService, ShopifyOrder, PackingSlip } from '../services/shopify.service';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export const ShopifyOrders: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [packingSlipDialog, setPackingSlipDialog] = useState<{
    open: boolean;
    order?: ShopifyOrder;
    packingSlip?: PackingSlip;
  }>({ open: false });
  const [pickListDialog, setPickListDialog] = useState<{
    open: boolean;
    data?: any;
  }>({ open: false });
  const [filters, setFilters] = useState({
    status: '',
    shippingMethod: '',
    tags: '',
  });

  const isAdmin = user?.role === UserRole.admin;

  // Fetch orders
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['shopify-orders', filters],
    queryFn: () => shopifyService.getOrders(filters),
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: () => shopifyService.syncOrders(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['shopify-orders'] });
      alert(`Synced ${result.orders.length} new orders`);
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: any; notes?: string }) =>
      shopifyService.updateOrderStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopify-orders'] });
    },
  });

  // Generate pick list mutation
  const pickListMutation = useMutation({
    mutationFn: (orderIds: string[]) => shopifyService.generatePickList(orderIds),
    onSuccess: (data) => {
      setPickListDialog({ open: true, data });
    },
  });

  // Generate packing slip
  const packingSlipMutation = useMutation({
    mutationFn: (orderId: string) => shopifyService.generatePackingSlip(orderId),
    onSuccess: (data, orderId) => {
      const order = orders?.find(o => o.id === orderId);
      setPackingSlipDialog({ open: true, order, packingSlip: data.packingSlip });
    },
  });

  const orders = data?.orders || [];

  const handleSync = () => {
    if (window.confirm('Sync orders from Shopify?')) {
      syncMutation.mutate();
    }
  };

  const handleMarkReady = (order: ShopifyOrder) => {
    updateStatusMutation.mutate({
      id: order.id,
      status: 'ready_to_ship',
      notes: 'All items picked and packed',
    });
  };

  const handleCancelOrder = (order: ShopifyOrder) => {
    if (window.confirm('Cancel this order? Stock reservations will be released.')) {
      updateStatusMutation.mutate({
        id: order.id,
        status: 'cancelled',
        notes: 'Order cancelled',
      });
    }
  };

  const handleGeneratePickList = () => {
    if (selectedOrders.length === 0) {
      alert('Please select orders to generate pick list');
      return;
    }
    pickListMutation.mutate(selectedOrders);
  };

  const handlePrintPackingSlip = (order: ShopifyOrder) => {
    packingSlipMutation.mutate(order.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'ready_to_ship':
        return 'info';
      case 'shipped':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getShippingIcon = (method: string) => {
    switch (method) {
      case 'Express':
      case 'Priority':
        return '🚀';
      default:
        return '📦';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'select',
      headerName: '',
      width: 50,
      renderCell: (params) => (
        <Checkbox
          checked={selectedOrders.includes(params.row.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedOrders([...selectedOrders, params.row.id]);
            } else {
              setSelectedOrders(selectedOrders.filter(id => id !== params.row.id));
            }
          }}
          disabled={params.row.status !== 'pending'}
        />
      ),
    },
    {
      field: 'shopifyOrderNumber',
      headerName: 'Order #',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'customerName',
      headerName: 'Customer',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'items',
      headerName: 'Items',
      width: 80,
      renderCell: (params) => params.value.length,
    },
    {
      field: 'shippingMethod',
      headerName: 'Shipping',
      width: 120,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <span>{getShippingIcon(params.value)}</span>
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'tags',
      headerName: 'Tags',
      width: 100,
      renderCell: (params) => 
        params.value ? (
          <Chip label={params.value} size="small" color="primary" />
        ) : null,
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
      field: 'canFulfill',
      headerName: 'Stock',
      width: 80,
      renderCell: (params) => (
        params.value ? (
          <CheckIcon color="success" />
        ) : (
          <WarningIcon color="error" />
        )
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Order Date',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      type: 'actions',
      getActions: (params) => {
        const order = params.row as ShopifyOrder;
        const actions = [];

        if (order.status === 'pending' && order.canFulfill) {
          actions.push(
            <IconButton
              key="ready"
              onClick={() => handleMarkReady(order)}
              size="small"
              color="success"
              title="Mark Ready to Ship"
            >
              <CheckIcon />
            </IconButton>
          );
        }

        actions.push(
          <IconButton
            key="print"
            onClick={() => handlePrintPackingSlip(order)}
            size="small"
            title="Print Packing Slip"
          >
            <PrintIcon />
          </IconButton>
        );

        if (order.status === 'pending') {
          actions.push(
            <IconButton
              key="cancel"
              onClick={() => handleCancelOrder(order)}
              size="small"
              color="error"
              title="Cancel Order"
            >
              <CancelIcon />
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
        <Typography variant="h4">Shopify Orders</Typography>
        <Stack direction="row" spacing={2}>
          {selectedOrders.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<InventoryIcon />}
              onClick={handleGeneratePickList}
            >
              Generate Pick List ({selectedOrders.length})
            </Button>
          )}
          <IconButton onClick={() => refetch()} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<SyncIcon />}
              onClick={handleSync}
              disabled={syncMutation.isPending}
            >
              Sync Orders
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
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="ready_to_ship">Ready to Ship</MenuItem>
            <MenuItem value="shipped">Shipped</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
          <TextField
            select
            label="Shipping Method"
            size="small"
            value={filters.shippingMethod}
            onChange={(e) => setFilters({ ...filters, shippingMethod: e.target.value })}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Standard">Standard</MenuItem>
            <MenuItem value="Express">Express</MenuItem>
            <MenuItem value="Priority">Priority</MenuItem>
          </TextField>
          <TextField
            label="Tags"
            size="small"
            value={filters.tags}
            onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
            placeholder="e.g., VIP"
          />
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load orders
        </Alert>
      )}

      <DataTable
        rows={orders}
        columns={columns}
        loading={isLoading}
        height={600}
      />

      {/* Packing Slip Dialog */}
      <Dialog
        open={packingSlipDialog.open}
        onClose={() => setPackingSlipDialog({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Packing Slip - {packingSlipDialog.packingSlip?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {packingSlipDialog.packingSlip && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                {packingSlipDialog.packingSlip.customerName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Shipping Method: {packingSlipDialog.packingSlip.shippingMethod}
              </Typography>
              
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>SKU</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Qty</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {packingSlipDialog.packingSlip.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell>
                          {item.name} - {item.size}
                        </TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {packingSlipDialog.packingSlip.specialInstructions && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {packingSlipDialog.packingSlip.specialInstructions}
                </Alert>
              )}

              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2">
                  {packingSlipDialog.packingSlip.brewingInstructions}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => window.print()}>Print</Button>
          <Button onClick={() => setPackingSlipDialog({ open: false })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Pick List Dialog */}
      <Dialog
        open={pickListDialog.open}
        onClose={() => setPickListDialog({ open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Pick List - {pickListDialog.data?.totalOrders} Orders
        </DialogTitle>
        <DialogContent>
          {pickListDialog.data && (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Location</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Total Qty</TableCell>
                    <TableCell>Orders</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pickListDialog.data.pickList.map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {item.product.binLocation || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.product.sku}</TableCell>
                      <TableCell>
                        {item.product.name} - {item.product.size}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold">
                          {item.totalQuantity}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {item.orders.map((o: any) => 
                            `${o.orderNumber} (${o.quantity})`
                          ).join(', ')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => window.print()}>Print</Button>
          <Button onClick={() => setPickListDialog({ open: false })}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};