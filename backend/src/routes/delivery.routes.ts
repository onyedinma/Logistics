import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as deliveryController from '../controllers/delivery.controller';
import { body } from 'express-validator';

const router = Router();

router.use(authenticate);

const deliveryPartnerRouter = Router();
deliveryPartnerRouter.get('/routes', authorize('delivery_partner'), deliveryController.getOptimizedRoutes);
deliveryPartnerRouter.post('/location', 
  authorize('delivery_partner'),
  body('latitude').isNumeric(),
  body('longitude').isNumeric(),
  deliveryController.updateLocation
);
deliveryPartnerRouter.post('/availability', authorize('delivery_partner'), deliveryController.updateAvailability);

const adminRouter = Router();
adminRouter.get('/partners/active', authorize('admin'), deliveryController.getActivePartners);
adminRouter.get('/analytics', authorize('admin'), deliveryController.getDeliveryAnalytics);

router.use('/delivery-partner', deliveryPartnerRouter);
router.use('/admin', adminRouter);

router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

export default router;