import { Router } from 'express';
import * as bomController from '../controllers/bom.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createBillOfMaterialSchema, updateBillOfMaterialSchema } from '../utils/validation';
import { UserRole } from '../constants/enums';

const router = Router();

// All BoM routes require authentication
router.use(requireAuth);

// Read operations - available to all authenticated users
router.get('/product/:productId', bomController.getBillOfMaterialsByProduct);

// Write operations - require fulfillment or admin role (they manage product recipes)
router.post('/', requireRole(UserRole.fulfillment, UserRole.admin), validate(createBillOfMaterialSchema), bomController.createBillOfMaterial);
router.put('/:id', requireRole(UserRole.fulfillment, UserRole.admin), validate(updateBillOfMaterialSchema), bomController.updateBillOfMaterial);
router.delete('/:id', requireRole(UserRole.fulfillment, UserRole.admin), bomController.deleteBillOfMaterial);

export default router;