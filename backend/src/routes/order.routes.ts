import { Router, RequestHandler } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateOrder } from '../middleware/validation.middleware';
import * as orderController from '../controllers/order.controller';

const router = Router();

// Public routes
router.get(
  '/track/:trackingNumber', 
  orderController.trackOrder as unknown as RequestHandler
);

// Protected routes
router.use(authenticate as RequestHandler);

// Client routes (B2B and B2C)
router.post(
  '/', 
  authorize('business_client', 'consumer') as RequestHandler,
  validateOrder as RequestHandler,
  orderController.createOrder as unknown as RequestHandler
);

router.get(
  '/my-orders',
  authorize('business_client', 'consumer') as RequestHandler,
  orderController.getMyOrders as unknown as RequestHandler
);

// Business client specific routes
router.post(
  '/bulk',
  authorize('business_client') as RequestHandler,
  orderController.createBulkOrders as unknown as RequestHandler
);

router.post(
  '/recurring',
  authorize('business_client') as RequestHandler,
  orderController.setupRecurringOrder as unknown as RequestHandler
);

// Delivery partner routes
router.get(
  '/assigned',
  authorize('delivery_partner') as RequestHandler,
  orderController.getAssignedOrders as unknown as RequestHandler
);

router.patch(
  '/:orderId/status',
  authorize('delivery_partner') as RequestHandler,
  orderController.updateOrderStatus as unknown as RequestHandler
);

// Admin routes
router.get(
  '/all',
  authorize('admin') as RequestHandler,
  orderController.getAllOrders as unknown as RequestHandler
);

router.patch(
  '/:orderId/assign',
  authorize('admin') as RequestHandler,
  orderController.assignOrder as unknown as RequestHandler
);

export default router;
