import { Request, Response } from 'express';
import { Restaurant } from '../models/restaurantModel';
import { Product } from '../models/productModel';
import { Order } from '../models/orderModel';
import { Transaction } from '../models/transactionModel';
import { WithdrawalRequest } from '../models/withdrawalModel';
import { NotFoundError, AppError } from '../utils/errors';
import { isValidTransition, getCancellationPolicy, canCancel } from '../utils/cancellationPolicy';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const restaurantController = {
  getDashboard: async (req: AuthenticatedRequest, res: Response) => {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) throw new NotFoundError('Restaurant');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [todayOrders, pendingOrders, activeOrders] = await Promise.all([
      Order.find({ restaurant: restaurant._id, createdAt: { $gte: today, $lte: endOfToday } }),
      Order.countDocuments({ restaurant: restaurant._id, status: 'placed' }),
      Order.countDocuments({ restaurant: restaurant._id, status: { $in: ['confirmed', 'preparing'] } }),
    ]);

    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.pricing?.totalAmount || 0), 0);
    const todayOrdersCount = todayOrders.length;

    res.json({
      success: true,
      data: {
        todayOrders: todayOrdersCount,
        todayRevenue,
        avgOrderValue: todayOrdersCount > 0 ? Math.round(todayRevenue / todayOrdersCount) : 0,
        pendingOrders,
        activeOrders,
        totalOrders: restaurant.totalOrders || 0,
        rating: restaurant.rating || 0,
        isActive: restaurant.isActive,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  },

  getProfile: async (req: AuthenticatedRequest, res: Response) => {
    const restaurant = await Restaurant.findOne({ owner: req.user._id }).lean();
    if (!restaurant) throw new NotFoundError('Restaurant');
    res.json({ success: true, data: restaurant, meta: { timestamp: new Date().toISOString() } });
  },

  updateProfile: async (req: AuthenticatedRequest, res: Response) => {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) throw new NotFoundError('Restaurant');

    const updatable = ['name', 'description', 'category', 'location', 'operatingHours', 'minimumOrderAmount', 'deliveryFee', 'estimatedPrepTime', 'tags', 'contactPhone', 'gstNumber', 'payoutUpiId', 'images'];
    for (const field of updatable) {
      if (req.body[field] !== undefined) {
        (restaurant as any)[field] = req.body[field];
      }
    }

    await restaurant.save();
    res.json({
      success: true,
      data: { message: 'Restaurant profile updated', restaurant },
      meta: { timestamp: new Date().toISOString() },
    });
  },

  getAnalytics: async (req: AuthenticatedRequest, res: Response) => {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) throw new NotFoundError('Restaurant');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const orders = await Order.find({
      restaurant: restaurant._id,
      createdAt: { $gte: sevenDaysAgo },
      status: { $ne: 'cancelled' },
    }).lean();

    const dailySales: Record<string, number> = {};
    const hourlyCount: Record<number, number> = {};
    const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {};

    for (const order of orders) {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
      dailySales[dateKey] = (dailySales[dateKey] || 0) + order.pricing.totalAmount;
      const hour = new Date(order.createdAt).getHours();
      hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
      for (const item of order.items) {
        if (!itemSales[item.product.toString()]) {
          itemSales[item.product.toString()] = { name: item.name, quantity: 0, revenue: 0 };
        }
        itemSales[item.product.toString()].quantity += item.quantity;
        itemSales[item.product.toString()].revenue += item.price * item.quantity;
      }
    }

    const sales = Object.entries(dailySales).map(([date, revenue]) => ({ date, revenue, orders: orders.filter(o => new Date(o.createdAt).toISOString().split('T')[0] === date).length }));
    const topItems = Object.values(itemSales).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    const peakHours = Object.entries(hourlyCount).map(([hour, count]) => ({ hour: parseInt(hour), count })).sort((a, b) => a.hour - b.hour);

    res.json({
      success: true,
      data: { sales, topItems, peakHours, totalRevenue: orders.reduce((s, o) => s + o.pricing.totalAmount, 0), totalOrders: orders.length },
      meta: { timestamp: new Date().toISOString() },
    });
  },

  getProducts: async (req: AuthenticatedRequest, res: Response) => {
    const { page = '1', limit = '20', category, isAvailable } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));

    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) throw new NotFoundError('Restaurant');

    const filter: any = { restaurant: restaurant._id };
    if (category) filter.category = category;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';

    const total = await Product.countDocuments(filter);
    const items = await Product.find(filter)
      .sort({ category: 1, name: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data: { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } },
      meta: { timestamp: new Date().toISOString() },
    });
  },

  createProduct: async (req: AuthenticatedRequest, res: Response) => {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) throw new NotFoundError('Restaurant');
    const product = await Product.create({ ...req.body, restaurant: restaurant._id });
    res.status(201).json({ success: true, data: product, meta: { timestamp: new Date().toISOString() } });
  },

  getProduct: async (req: AuthenticatedRequest, res: Response) => {
    const product = await Product.findOne({ _id: req.params.id }).lean();
    if (!product) throw new NotFoundError('Product');
    res.json({ success: true, data: product, meta: { timestamp: new Date().toISOString() } });
  },

  updateProduct: async (req: AuthenticatedRequest, res: Response) => {
    const product = await Product.findOne({ _id: req.params.id });
    if (!product) throw new NotFoundError('Product');
    const updatable = ['name', 'description', 'category', 'price', 'originalPrice', 'images', 'isAvailable', 'isVegetarian', 'isVegan', 'spiceLevel', 'preparationTime', 'stock', 'tags'];
    for (const field of updatable) {
      if (req.body[field] !== undefined) (product as any)[field] = req.body[field];
    }
    await product.save();
    res.json({ success: true, data: product, meta: { timestamp: new Date().toISOString() } });
  },

  deleteProduct: async (req: AuthenticatedRequest, res: Response) => {
    const product = await Product.findOneAndDelete({ _id: req.params.id });
    if (!product) throw new NotFoundError('Product');
    res.json({ success: true, data: { message: 'Product deleted' }, meta: { timestamp: new Date().toISOString() } });
  },

  toggleProduct: async (req: AuthenticatedRequest, res: Response) => {
    const product = await Product.findOne({ _id: req.params.id });
    if (!product) throw new NotFoundError('Product');
    product.isAvailable = !product.isAvailable;
    await product.save();
    res.json({ success: true, data: { message: `Product ${product.isAvailable ? 'enabled' : 'disabled'}`, isAvailable: product.isAvailable }, meta: { timestamp: new Date().toISOString() } });
  },

  bulkToggleProducts: async (req: AuthenticatedRequest, res: Response) => {
    const { productIds, isAvailable } = req.body;
    const result = await Product.updateMany({ _id: { $in: productIds } }, { $set: { isAvailable } });
    res.json({ success: true, data: { message: `${result.modifiedCount} products updated`, modifiedCount: result.modifiedCount }, meta: { timestamp: new Date().toISOString() } });
  },

  getOrders: async (req: AuthenticatedRequest, res: Response) => {
    const { status, page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) throw new NotFoundError('Restaurant');

    const filter: any = { restaurant: restaurant._id };
    if (status) filter.status = status;

    const total = await Order.countDocuments(filter);
    const items = await Order.find(filter)
      .populate('student', 'name phone roomNumber hostelBlock')
      .populate('courier', 'name phone')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({ success: true, data: { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, meta: { timestamp: new Date().toISOString() } });
  },

  getOrder: async (req: AuthenticatedRequest, res: Response) => {
    const order = await Order.findById(req.params.id)
      .populate('student', 'name phone roomNumber hostelBlock')
      .populate('courier', 'name phone')
      .lean();
    if (!order) throw new NotFoundError('Order');
    res.json({ success: true, data: order, meta: { timestamp: new Date().toISOString() } });
  },

  confirmOrder: async (req: AuthenticatedRequest, res: Response) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw new NotFoundError('Order');
    if (!isValidTransition(order.status, 'confirmed')) throw new AppError('INVALID_STATUS_TRANSITION', `Cannot confirm order in ${order.status} status`);
    order.status = 'confirmed';
    order.timestamps.confirmedAt = new Date();
    await order.save();

    const io = (global as any).io;
    if (io) {
      io.emitToOrder(String(order._id), 'order:status', { orderId: order._id, status: 'confirmed', orderNumber: order.orderNumber });
      io.emitToStudent(String(order.student), 'notification:new', { type: 'order_confirmed', title: 'Order Confirmed', message: `Order ${order.orderNumber} has been confirmed` });
    }

    res.json({ success: true, data: { message: 'Order confirmed', status: order.status }, meta: { timestamp: new Date().toISOString() } });
  },

  startPrep: async (req: AuthenticatedRequest, res: Response) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw new NotFoundError('Order');
    if (!isValidTransition(order.status, 'preparing')) throw new AppError('INVALID_STATUS_TRANSITION', `Cannot start preparation in ${order.status} status`);
    order.status = 'preparing';
    order.timestamps.confirmedAt = order.timestamps.confirmedAt || new Date();
    await order.save();

    const io = (global as any).io;
    if (io) {
      io.emitToOrder(String(order._id), 'order:status', { orderId: order._id, status: 'preparing', orderNumber: order.orderNumber });
    }

    res.json({ success: true, data: { message: 'Preparation started', status: order.status }, meta: { timestamp: new Date().toISOString() } });
  },

  markReady: async (req: AuthenticatedRequest, res: Response) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw new NotFoundError('Order');
    if (!isValidTransition(order.status, 'ready')) throw new AppError('INVALID_STATUS_TRANSITION', `Cannot mark ready in ${order.status} status`);
    order.status = 'ready';
    order.timestamps.readyAt = new Date();
    await order.save();

    const io = (global as any).io;
    if (io) {
      io.emitToOrder(String(order._id), 'order:status', { orderId: order._id, status: 'ready', orderNumber: order.orderNumber });
      io.emitToStudent(String(order.student), 'notification:new', { type: 'order_ready', title: 'Order Ready', message: `Order ${order.orderNumber} is ready for pickup` });
      io.emitToNearbyCouriers('all', 'order:ready', { orderId: order._id, orderNumber: order.orderNumber, restaurant: order.restaurant });
    }

    res.json({ success: true, data: { message: 'Order ready for pickup', status: order.status }, meta: { timestamp: new Date().toISOString() } });
  },

  cancelOrder: async (req: AuthenticatedRequest, res: Response) => {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) throw new NotFoundError('Order');
    if (!canCancel('restaurant', order.status)) throw new AppError('ORDER_NOT_CANCELLABLE', `Order cannot be cancelled in ${order.status} status`);

    const foodCost = order.pricing.subtotal;
    const comp = getCancellationPolicy('restaurant', order.status, order.pricing.totalAmount, order.pricing.deliveryFee, foodCost);
    order.status = 'cancelled';
    order.cancelledBy = 'restaurant';
    order.cancellationReason = reason || 'Cancelled by restaurant';
    order.timestamps.cancelledAt = new Date();
    order.cancellationFee = comp.restaurant;

    if (comp.studentRefund > 0 && order.payment.status === 'paid') {
      const { User } = require('../models/userModel');
      const student = await User.findById(order.student);
      if (student) {
        student.walletBalance += comp.studentRefund;
        await student.save();
        await Transaction.create({ user: student._id, type: 'wallet_refund', amount: comp.studentRefund, balanceAfter: student.walletBalance, reference: { id: order._id, model: 'Order' }, description: `Refund for cancelled order ${order.orderNumber} by restaurant`, status: 'completed' });
      }
    }

    await order.save();

    const io = (global as any).io;
    if (io) {
      io.emitToStudent(String(order.student), 'order:cancelled', { orderId: order._id, orderNumber: order.orderNumber, reason, cancelledBy: 'restaurant' });
    }

    res.json({ success: true, data: { message: 'Order cancelled', orderNumber: order.orderNumber, status: order.status }, meta: { timestamp: new Date().toISOString() } });
  },

  getPayoutHistory: async (req: AuthenticatedRequest, res: Response) => {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));

    const total = await WithdrawalRequest.countDocuments({ user: req.user._id, type: 'restaurant' });
    const items = await WithdrawalRequest.find({ user: req.user._id, type: 'restaurant' })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({ success: true, data: { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, meta: { timestamp: new Date().toISOString() } });
  },

  requestPayout: async (req: AuthenticatedRequest, res: Response) => {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) throw new NotFoundError('Restaurant');

    const { amount, upiId } = req.body;
    if (amount < 100) throw new AppError('VALIDATION_ERROR', 'Minimum payout amount is ₹100');

    const earnings = await Order.aggregate([
      { $match: { restaurant: restaurant._id, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$earnings.restaurantPayout' } } },
    ]);
    const availableBalance = earnings[0]?.total || 0;
    if (amount > availableBalance) throw new AppError('VALIDATION_ERROR', 'Insufficient payout balance');

    const withdrawal = await WithdrawalRequest.create({
      user: req.user._id,
      type: 'restaurant',
      amount,
      bankDetails: { upiId: upiId || restaurant.payoutUpiId },
      status: 'pending',
    });

    res.status(201).json({ success: true, data: withdrawal, meta: { timestamp: new Date().toISOString() } });
  },
};
