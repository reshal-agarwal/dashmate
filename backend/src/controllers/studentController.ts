import { Request, Response } from 'express';
import { Restaurant } from '../models/restaurantModel';
import { Product } from '../models/productModel';
import { NotFoundError } from '../utils/errors';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const studentController = {
  getRestaurants: async (req: AuthenticatedRequest, res: Response) => {
    const { category, search, openNow, rating, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));

    const filter: any = { isActive: true, isVerified: true };
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (rating) filter.rating = { $gte: parseFloat(rating as string) };

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDay();

    const total = await Restaurant.countDocuments(filter);
    const restaurants = await Restaurant.find(filter)
      .select('-payoutUpiId -gstNumber -platformCommission')
      .sort({ rating: -1, totalOrders: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    let items = restaurants.map(r => {
      const isOpenNow = r.operatingHours.daysOpen.includes(currentDay) &&
        currentTime >= r.operatingHours.open && currentTime < r.operatingHours.close;
      return { ...r, isOpenNow };
    });

    if (openNow === 'true') items = items.filter(i => i.isOpenNow);

    res.json({
      success: true,
      data: { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } },
      meta: { timestamp: new Date().toISOString() },
    });
  },

  getRestaurant: async (req: AuthenticatedRequest, res: Response) => {
    const restaurant = await Restaurant.findById(req.params.id)
      .select('-payoutUpiId -gstNumber -platformCommission')
      .populate('owner', 'name')
      .lean();

    if (!restaurant) throw new NotFoundError('Restaurant');

    const productCount = await Product.countDocuments({ restaurant: restaurant._id, isAvailable: true });

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const isOpenNow = restaurant.operatingHours.daysOpen.includes(now.getDay()) &&
      currentTime >= restaurant.operatingHours.open && currentTime < restaurant.operatingHours.close;

    res.json({
      success: true,
      data: { ...restaurant, productCount, isOpenNow },
      meta: { timestamp: new Date().toISOString() },
    });
  },

  getRestaurantProducts: async (req: AuthenticatedRequest, res: Response) => {
    const { category, page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));

    const filter: any = { restaurant: req.params.id, isAvailable: true };
    if (category) filter.category = category;

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ category: 1, name: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data: { items: products, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } },
      meta: { timestamp: new Date().toISOString() },
    });
  },

  searchProducts: async (req: AuthenticatedRequest, res: Response) => {
    const { q, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));

    if (!q) {
      res.json({
        success: true,
        data: { items: [], pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 } },
        meta: { timestamp: new Date().toISOString() },
      });
      return;
    }

    const products = await Product.find(
      { $text: { $search: q as string }, isAvailable: true },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('restaurant', 'name category')
      .lean();

    const total = await Product.countDocuments({ $text: { $search: q as string }, isAvailable: true });

    res.json({
      success: true,
      data: { items: products, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } },
      meta: { timestamp: new Date().toISOString() },
    });
  },
  placeOrder: async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: { order: null, payment: null, creditsEarned: 0 } });
  },
  getOrders: async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: { items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } } });
  },
  getOrder: async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: null });
  },
  cancelOrder: async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: { message: 'Order cancelled' } });
  },
  rateOrder: async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: { message: 'Order rated' } });
  },
  getWallet: async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: { balance: 0, creditsBalance: 0, transactions: [] } });
  },
  initiateTopup: async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: { orderId: 'rzp_test_xxx', amount: 0 } });
  },
  verifyTopup: async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: { message: 'Payment verified' } });
  },
  getCreditsHistory: async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: { items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } } });
  },
  convertCredits: async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: { message: 'Credits converted' } });
  },
  getProfile: async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: req.user });
  },
  updateProfile: async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: { message: 'Profile updated' } });
  },
  getAddresses: async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: [] });
  },
  addAddress: async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: { message: 'Address added' } });
  },
  updateAddress: async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: { message: 'Address updated' } });
  },
  deleteAddress: async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: { message: 'Address deleted' } });
  },
  getNotifications: async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: { items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } } });
  },
  markNotificationRead: async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: { message: 'Notification marked as read' } });
  },
  markAllNotificationsRead: async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: { message: 'All notifications marked as read' } });
  },
};