import { Router } from 'express';
import * as rawMaterialsController from '../controllers/raw-materials.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { createRawMaterialSchema, updateRawMaterialSchema, rawMaterialQuerySchema } from '../utils/validation';
import { UserRole } from '../constants/enums';

const router = Router();

// All raw material routes require authentication
router.use(requireAuth);

// Read operations - available to all authenticated users
router.get('/', validateQuery(rawMaterialQuerySchema), rawMaterialsController.getRawMaterials);
router.get('/export', validateQuery(rawMaterialQuerySchema), rawMaterialsController.exportRawMaterials);
router.get('/:id', rawMaterialsController.getRawMaterialById);

// Write operations - require production or admin role
router.post('/', requireRole(UserRole.production, UserRole.admin), validate(createRawMaterialSchema), rawMaterialsController.createRawMaterial);
router.put('/:id', requireRole(UserRole.production, UserRole.admin), validate(updateRawMaterialSchema), rawMaterialsController.updateRawMaterial);
router.delete('/:id', requireRole(UserRole.production, UserRole.admin), rawMaterialsController.deleteRawMaterial);

export default router;