import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  syncShopifyOrders,
  getShopifyOrders,
  updateOrderStatus,
  generatePickList,
  generatePackingSlip,
  createStockReservation,
  releaseStockReservation
} from '../controllers/shopify.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Sync orders from Shopify (admin only)
router.post('/sync', requireRole('admin'), syncShopifyOrders);

// Get orders with filters
router.get('/orders', requireRole('fulfillment', 'admin'), getShopifyOrders);

// Update order status
router.put('/orders/:id/status', requireRole('fulfillment', 'admin'), updateOrderStatus);

// Generate pick list for multiple orders
router.post('/pick-list', requireRole('fulfillment', 'admin'), generatePickList);

// Generate packing slip for an order
router.get('/orders/:id/packing-slip', requireRole('fulfillment', 'admin'), generatePackingSlip);

// Stock reservations
router.post('/reservations', requireRole('fulfillment', 'admin'), createStockReservation);
router.delete('/reservations/:id', requireRole('fulfillment', 'admin'), releaseStockReservation);

export default router;