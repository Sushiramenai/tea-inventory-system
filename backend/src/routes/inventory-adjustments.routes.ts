import { Router } from 'express';
import * as inventoryAdjustmentsController from '../controllers/inventory-adjustments.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createInventoryAdjustmentSchema } from '../utils/validation';
import { UserRole } from '../constants/enums';

const router = Router();

// All inventory adjustment routes require authentication
router.use(requireAuth);

// Create adjustment - require production or admin role
router.post(
  '/', 
  requireRole(UserRole.production, UserRole.admin), 
  validate(createInventoryAdjustmentSchema), 
  inventoryAdjustmentsController.createAdjustment
);

// Get adjustment history for a material
router.get('/material/:materialId', inventoryAdjustmentsController.getMaterialAdjustments);

// Get all recent adjustments
router.get('/', inventoryAdjustmentsController.getRecentAdjustments);

export default router;