import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateOrder } from '../middleware/validation.middleware';
import * as orderController from '../controllers/order.controller';

const router = Router();

// Public routes
router.get(
  '/track/:trackingNumber', 
  orderController.trackOrder as any
);

// Protected routes
router.use(authenticate as any);

// Client routes (B2B and B2C)
router.post(
  '/', 
  authorize(['business_client', 'consumer']) as any,
  validateOrder as any,
  orderController.createOrder as any
);

router.get(
  '/my-orders',
  authorize(['business_client', 'consumer']) as any,
  orderController.getMyOrders as any
);

// Business client specific routes
router.post(
  '/bulk',
  authorize('business_client') as any,
  orderController.createBulkOrders as any
);

router.post(
  '/recurring',
  authorize('business_client') as any,
  orderController.setupRecurringOrder
);

// Delivery partner routes
router.get(
  '/assigned',
  authorize('delivery_partner') as any,
  orderController.getAssignedOrders
);

router.patch(
  '/:orderId/status',
  authorize('delivery_partner') as any,
  orderController.updateOrderStatus as any
);

// Admin routes
router.get(
  '/all',
  authorize('admin') as any,
  orderController.getAllOrders as any
);

router.patch(
  '/:orderId/assign',
  authorize('admin') as any,
  orderController.assignOrder as any
);

export default router;
