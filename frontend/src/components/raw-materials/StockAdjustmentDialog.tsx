import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Alert,
  Box,
  Typography,
  Grid,
  InputAdornment,
  Chip,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RawMaterial } from '../../types';
import { 
  inventoryAdjustmentsService, 
  CreateAdjustmentData, 
  AdjustmentType 
} from '../../services/inventory-adjustments.service';

interface StockAdjustmentDialogProps {
  open: boolean;
  onClose: () => void;
  material: RawMaterial | null;
}

const adjustmentTypeLabels = {
  [AdjustmentType.received]: 'Received Stock',
  [AdjustmentType.damage]: 'Damage/Loss',
  [AdjustmentType.sample]: 'Sample/Testing',
  [AdjustmentType.count_correction]: 'Count Correction',
  [AdjustmentType.other]: 'Other',
};

const adjustmentTypeColors: Record<AdjustmentType, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  [AdjustmentType.received]: 'success',
  [AdjustmentType.damage]: 'error',
  [AdjustmentType.sample]: 'warning',
  [AdjustmentType.count_correction]: 'info',
  [AdjustmentType.other]: 'default',
};

export const StockAdjustmentDialog: React.FC<StockAdjustmentDialogProps> = ({
  open,
  onClose,
  material,
}) => {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CreateAdjustmentData>({
    defaultValues: {
      rawMaterialId: '',
      adjustmentType: AdjustmentType.received,
      adjustmentAmount: 0,
      reason: '',
    },
  });

  const adjustmentType = watch('adjustmentType');
  const adjustmentAmount = watch('adjustmentAmount');

  React.useEffect(() => {
    if (material) {
      reset({
        rawMaterialId: material.id,
        adjustmentType: AdjustmentType.received,
        adjustmentAmount: 0,
        reason: '',
      });
      setSuccessMessage(null);
    }
  }, [material, reset]);

  const mutation = useMutation({
    mutationFn: (data: CreateAdjustmentData) => 
      inventoryAdjustmentsService.createAdjustment(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      queryClient.invalidateQueries({ queryKey: ['adjustments', material?.id] });
      setSuccessMessage(`Stock adjusted successfully. New quantity: ${result.material.stockQuantity} ${material?.unit}`);
      
      // Reset form but keep dialog open for multiple adjustments
      reset({
        rawMaterialId: material?.id || '',
        adjustmentType: AdjustmentType.received,
        adjustmentAmount: 0,
        reason: '',
      });
    },
  });

  const handleFormSubmit = async (data: CreateAdjustmentData) => {
    // For damage/sample, make the amount negative
    if ([AdjustmentType.damage, AdjustmentType.sample].includes(data.adjustmentType) && data.adjustmentAmount > 0) {
      data.adjustmentAmount = -data.adjustmentAmount;
    }
    
    await mutation.mutateAsync(data);
  };

  const handleClose = () => {
    reset();
    setSuccessMessage(null);
    onClose();
  };

  if (!material) return null;

  const currentStock = material.stockQuantity;
  const newStock = currentStock + adjustmentAmount;
  const isNegativeAdjustment = [AdjustmentType.damage, AdjustmentType.sample].includes(adjustmentType);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>
          Adjust Stock - {material.name}
          <Typography variant="body2" color="text.secondary">
            Current Stock: {currentStock} {material.unit}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          )}
          
          {mutation.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {(mutation.error as any)?.message || 'Failed to adjust stock'}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller
                name="adjustmentType"
                control={control}
                rules={{ required: 'Adjustment type is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Adjustment Type"
                    fullWidth
                    error={!!errors.adjustmentType}
                    helperText={errors.adjustmentType?.message}
                  >
                    {Object.values(AdjustmentType).map((type) => (
                      <MenuItem key={type} value={type}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {adjustmentTypeLabels[type]}
                          <Chip 
                            size="small" 
                            label={type === AdjustmentType.received ? '+' : '-'} 
                            color={adjustmentTypeColors[type]}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="adjustmentAmount"
                control={control}
                rules={{ 
                  required: 'Amount is required',
                  validate: (value) => {
                    if (value === 0) return 'Amount cannot be zero';
                    if (isNegativeAdjustment && value > currentStock) {
                      return `Cannot remove more than current stock (${currentStock} ${material.unit})`;
                    }
                    return true;
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label={isNegativeAdjustment ? "Quantity to Remove" : "Quantity to Add"}
                    fullWidth
                    error={!!errors.adjustmentAmount}
                    helperText={errors.adjustmentAmount?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {isNegativeAdjustment ? '-' : '+'}
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          {material.unit}
                        </InputAdornment>
                      ),
                    }}
                    inputProps={{ 
                      min: 0, 
                      step: 'any',
                      max: isNegativeAdjustment ? currentStock : undefined,
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="reason"
                control={control}
                rules={{ 
                  required: 'Reason is required',
                  minLength: { value: 10, message: 'Please provide more details (min 10 characters)' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Reason / Notes"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.reason}
                    helperText={errors.reason?.message}
                    placeholder={
                      adjustmentType === AdjustmentType.received ? "e.g., Received delivery from supplier XYZ, PO#12345" :
                      adjustmentType === AdjustmentType.damage ? "e.g., Water damage in storage area B2" :
                      adjustmentType === AdjustmentType.sample ? "e.g., Sent 5kg sample to customer ABC" :
                      adjustmentType === AdjustmentType.count_correction ? "e.g., Physical count showed discrepancy" :
                      "Please provide details..."
                    }
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  Stock Preview:
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography>{currentStock} {material.unit}</Typography>
                  <Typography>→</Typography>
                  <Typography 
                    color={newStock < 0 ? 'error' : newStock < material.reorderLevel ? 'warning' : 'success'}
                    fontWeight="bold"
                  >
                    {newStock} {material.unit}
                  </Typography>
                  {newStock < material.reorderLevel && newStock >= 0 && (
                    <Chip label="Below reorder level" color="warning" size="small" />
                  )}
                  {newStock < 0 && (
                    <Chip label="Invalid" color="error" size="small" />
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={mutation.isPending || newStock < 0}
          >
            {mutation.isPending ? 'Adjusting...' : 'Adjust Stock'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};