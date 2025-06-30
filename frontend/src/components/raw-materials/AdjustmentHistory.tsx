import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { inventoryAdjustmentsService, AdjustmentType } from '../../services/inventory-adjustments.service';

interface AdjustmentHistoryProps {
  materialId: string;
  materialName: string;
}

const adjustmentTypeLabels = {
  [AdjustmentType.received]: 'Received',
  [AdjustmentType.damage]: 'Damage/Loss',
  [AdjustmentType.sample]: 'Sample',
  [AdjustmentType.count_correction]: 'Count Correction',
  [AdjustmentType.other]: 'Other',
};

const adjustmentTypeColors: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  [AdjustmentType.received]: 'success',
  [AdjustmentType.damage]: 'error',
  [AdjustmentType.sample]: 'warning',
  [AdjustmentType.count_correction]: 'info',
  [AdjustmentType.other]: 'default',
};

export const AdjustmentHistory: React.FC<AdjustmentHistoryProps> = ({ 
  materialId, 
  materialName 
}) => {
  const { data: adjustments, isLoading, error } = useQuery({
    queryKey: ['adjustments', materialId],
    queryFn: () => inventoryAdjustmentsService.getMaterialAdjustments(materialId),
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load adjustment history
      </Alert>
    );
  }

  if (!adjustments || adjustments.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="text.secondary">
          No stock adjustments recorded for {materialName}
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">Before</TableCell>
            <TableCell align="right">Change</TableCell>
            <TableCell align="right">After</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell>Adjusted By</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {adjustments.map((adjustment) => {
            const change = adjustment.quantityAfter - adjustment.quantityBefore;
            return (
              <TableRow key={adjustment.id}>
                <TableCell>
                  {new Date(adjustment.adjustedAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={adjustmentTypeLabels[adjustment.adjustmentType as AdjustmentType] || adjustment.adjustmentType}
                    color={adjustmentTypeColors[adjustment.adjustmentType] || 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {adjustment.quantityBefore}
                </TableCell>
                <TableCell align="right">
                  <Typography
                    color={change > 0 ? 'success.main' : 'error.main'}
                    fontWeight="medium"
                  >
                    {change > 0 ? '+' : ''}{change}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  {adjustment.quantityAfter}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 300 }}>
                    {adjustment.reason}
                  </Typography>
                </TableCell>
                <TableCell>
                  {adjustment.adjustedBy?.username || 'Unknown'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};