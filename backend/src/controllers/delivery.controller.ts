import { AuthRequest } from '../middleware/auth.middleware';
import { Response } from 'express';
import DeliveryPartner from '../models/deliveryPartner.model';
// import Order from '../models/order.model';

export const getOptimizedRoutes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    
    // Get all assigned orders for the delivery partner
    const orders = await Order.find({
      deliveryPartnerId: partnerId,
      status: { $in: ['assigned', 'picked_up'] }
    }).sort({ priority: -1 });

    // Basic route optimization (can be enhanced with actual routing algorithm)
    const optimizedRoute = orders.map(order => ({
      orderId: order._id,
      sequence: order.priority,
      pickup: order.pickupLocation,
      delivery: order.deliveryLocation,
      status: order.status,
      estimatedTime: order.estimatedDeliveryTime
    }));

    res.json({ routes: optimizedRoute });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching optimized routes' });
  }
};

export const updateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { latitude, longitude, timestamp, accuracy } = req.body;
    const partnerId = req.user!.id;

    // Update partner location in database
    await DeliveryPartner.findByIdAndUpdate(partnerId, {
      currentLocation: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      lastLocationUpdate: timestamp,
      locationAccuracy: accuracy,
    });

    // Emit location update through socket if needed
    // socketService.emitPartnerLocation(partnerId, { latitude, longitude });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating location' });
  }
};

export const updateAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const { isAvailable, availabilityHours } = req.body;

    await DeliveryPartner.findByIdAndUpdate(partnerId, {
      isAvailable,
      availabilityHours,
      lastAvailabilityUpdate: new Date()
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating availability' });
  }
};

export const getActivePartners = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activePartners = await DeliveryPartner.find({
      isAvailable: true,
      lastLocationUpdate: { 
        $gte: new Date(Date.now() - 15 * 60 * 1000) // Active in last 15 minutes
      }
    }).select('-password -tokens');

    res.json({ partners: activePartners });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active partners' });
  }
};

export const getDeliveryAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const { startDate, endDate } = req.query;

    const analytics = await Order.aggregate([
      {
        $match: {
          deliveryPartnerId: partnerId,
          createdAt: {
            $gte: new Date(startDate as string),
            $lte: new Date(endDate as string)
          }
        }
      },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          completedDeliveries: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          failedDeliveries: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          averageDeliveryTime: { $avg: '$deliveryTime' }
        }
      }
    ]);

    res.json(analytics[0] || {
      totalDeliveries: 0,
      completedDeliveries: 0,
      failedDeliveries: 0,
      averageDeliveryTime: 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics' });
  }
}; 