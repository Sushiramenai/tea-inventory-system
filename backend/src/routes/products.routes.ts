import { Router } from 'express';
import * as productsController from '../controllers/products.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { createProductSchema, updateProductSchema, productQuerySchema } from '../utils/validation';
import { UserRole } from '../constants/enums';

const router = Router();

// All product routes require authentication
router.use(requireAuth);

// Read operations - available to all authenticated users
router.get('/', validateQuery(productQuerySchema), productsController.getProducts);
router.get('/export', validateQuery(productQuerySchema), productsController.exportProducts);
router.get('/by-sku/:sku', productsController.getProductBySku);
router.get('/:id', productsController.getProductById);

// Write operations - require fulfillment or admin role
router.post('/', requireRole(UserRole.fulfillment, UserRole.admin), validate(createProductSchema), productsController.createProduct);
router.put('/:id', requireRole(UserRole.fulfillment, UserRole.admin), validate(updateProductSchema), productsController.updateProduct);
router.delete('/:id', requireRole(UserRole.fulfillment, UserRole.admin), productsController.deleteProduct);

export default router;