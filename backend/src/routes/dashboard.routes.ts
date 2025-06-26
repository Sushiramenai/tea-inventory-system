import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All dashboard routes require authentication
router.use(requireAuth);

router.get('/stats', dashboardController.getDashboardStats);
router.get('/low-stock', dashboardController.getLowStockReport);

export default router;