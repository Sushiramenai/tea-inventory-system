import { Router } from 'express';
import * as productionRequestsController from '../controllers/production-requests.controller';
import { requireAuth } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { createProductionRequestSchema, updateProductionRequestSchema, completeProductionRequestSchema, productionRequestQuerySchema } from '../utils/validation';

const router = Router();

// All production request routes require authentication
router.use(requireAuth);

// Read operations - available to all authenticated users
router.get('/', validateQuery(productionRequestQuerySchema), productionRequestsController.getProductionRequests);
router.get('/:id', productionRequestsController.getProductionRequestById);

// Create - available to all authenticated users (fulfillment creates requests)
router.post('/', validate(createProductionRequestSchema), productionRequestsController.createProductionRequest);

// Update - available to all authenticated users with role-based logic in controller
router.put('/:id', validate(updateProductionRequestSchema), productionRequestsController.updateProductionRequest);

// Complete - production team only (handled in controller)
router.post('/:id/complete', validate(completeProductionRequestSchema), productionRequestsController.completeProductionRequest);

export default router;