import { Request, Response } from 'express';
import { User } from '../models/userModel';
import { Order } from '../models/orderModel';
import { Transaction } from '../models/transactionModel';
import { WithdrawalRequest } from '../models/withdrawalModel';
import { AppError, NotFoundError } from '../utils/errors';
import { isValidTransition, canCancel } from '../utils/cancellationPolicy';
import { config } from '../config';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const courierController = {
  applyCourier: async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (user.courier?.kycStatus === 'pending') throw new AppError('CONFLICT', 'Application already pending');
    if (user.courier?.kycStatus === 'approved') throw new AppError('CONFLICT', 'Already a verified courier');

    const { vehicleType, vehicleNumber, licenseNumber, aadharUrl, selfieUrl, drivingLicenseUrl, upiId } = req.body;
    user.role = 'courier';
    user.courier = {
      isVerified: false,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      kycStatus: 'pending',
      kycDocuments: { aadhar: aadharUrl, selfie: selfieUrl, drivingLicense: drivingLicenseUrl },
      bankDetails: { upiId },
      rating: 5.0,
      totalDeliveries: 0,
      cancelledDeliveries: 0,
      isOnline: false,
      earningsToday: 0,
      earningsThisWeek: 0,
      earningsTotal: 0,
    };
    await user.save();

    res.status(201).json({
      success: true,
      data: { message: 'Courier application submitted', kycStatus: 'pending' },
      meta: { timestamp: new Date().toISOString() },
    });
  },

  getApplication: async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    res.json({
      success: true,
      data: { kycStatus: user.courier?.kycStatus || 'none', courier: user.courier || null },
      meta: { timestamp: new Date().toISOString() },
    });
  },

  getDashboard: async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const activeOrder = await Order.findOne({ courier: user._id, status: { $in: ['courier_assigned', 'picked_up'] } }).lean();
    const pendingPayout = await WithdrawalRequest.aggregate([
      { $match: { user: user._id, type: 'courier', status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true,
      data: {
        isOnline: user.courier?.isOnline || false,
        earningsToday: user.courier?.earningsToday || 0,
        earningsThisWeek: user.courier?.earningsThisWeek || 0,
        earningsTotal: user.courier?.earningsTotal || 0,
        totalDeliveries: user.courier?.totalDeliveries || 0,
        rating: user.courier?.rating || 5.0,
        hasActiveOrder: !!activeOrder,
        activeOrderId: activeOrder?._id,
        pendingPayout: pendingPayout[0]?.total || 0,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  },

  toggleOnline: async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (user.courier?.kycStatus !== 'approved') throw new AppError('COURIER_NOT_VERIFIED', 'KYC not approved');
    user.courier.isOnline = !user.courier.isOnline;
    await user.save();

    const io = (global as any).io;
    if (io) io.emitToNearbyCouriers('all', 'courier:status', { courierId: user._id, isOnline: user.courier.isOnline });

    res.json({ success: true, data: { isOnline: user.courier.isOnline }, meta: { timestamp: new Date().toISOString() } });
  },

  updateLocation: async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: { message: 'Location updated' }, meta: { timestamp: new Date().toISOString() } });
  },

  getAvailableOrders: async (req: AuthenticatedRequest, res: Response) => {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));

    const filter = { status: 'ready' as const };
    const total = await Order.countDocuments(filter);
    const items = await Order.find(filter)
      .populate('restaurant', 'name category location images')
      .populate('student', 'name')
      .sort({ 'timestamps.readyAt': -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('-pickupCode -deliveryCode')
      .lean();

    res.json({
      success: true,
      data: { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } },
      meta: { timestamp: new Date().toISOString() },
    });
  },

  acceptOrder: async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user.courier?.isOnline) throw new AppError('COURIER_NOT_ONLINE', 'Go online to accept orders');

    const order = await Order.findById(req.params.id);
    if (!order) throw new NotFoundError('Order');
    if (!isValidTransition(order.status, 'courier_assigned')) {
      throw new AppError('INVALID_STATUS_TRANSITION', `Cannot accept order in ${order.status} status`);
    }

    order.status = 'courier_assigned';
    order.courier = user._id;
    order.timestamps.courierAssignedAt = new Date();
    await order.save();

    const io = (global as any).io;
    if (io) {
      io.emitToOrder(String(order._id), 'order:status', { orderId: order._id, status: 'courier_assigned', orderNumber: order.orderNumber });
      io.emitToStudent(String(order.student), 'notification:new', { type: 'courier_assigned', title: 'Courier Assigned', message: `Courier assigned to order ${order.orderNumber}` });
    }

    res.json({
      success: true,
      data: { message: 'Order accepted', orderId: order._id, orderNumber: order.orderNumber },
      meta: { timestamp: new Date().toISOString() },
    });
  },

  pickupOrder: async (req: AuthenticatedRequest, res: Response) => {
    const { code } = req.body;
    const order = await Order.findOne({ _id: req.params.id, courier: req.user._id });
    if (!order) throw new NotFoundError('Order');
    if (!isValidTransition(order.status, 'picked_up')) throw new AppError('INVALID_STATUS_TRANSITION', `Cannot pickup in ${order.status} status`);
    if (order.pickupCode !== code) throw new AppError('PICKUP_CODE_MISMATCH', 'Invalid pickup code');

    order.status = 'picked_up';
    order.timestamps.pickedUpAt = new Date();
    await order.save();

    const io = (global as any).io;
    if (io) {
      io.emitToOrder(String(order._id), 'order:status', { orderId: order._id, status: 'picked_up' });
      io.emitToRestaurant(String(order.restaurant), 'order:status', { orderId: order._id, status: 'picked_up' });
    }

    res.json({ success: true, data: { message: 'Order picked up', orderId: order._id, orderNumber: order.orderNumber }, meta: { timestamp: new Date().toISOString() } });
  },

  deliverOrder: async (req: AuthenticatedRequest, res: Response) => {
    const { code } = req.body;
    const order = await Order.findOne({ _id: req.params.id, courier: req.user._id });
    if (!order) throw new NotFoundError('Order');
    if (!isValidTransition(order.status, 'delivered')) throw new AppError('INVALID_STATUS_TRANSITION', `Cannot deliver in ${order.status} status`);
    if (order.deliveryCode !== code) throw new AppError('DELIVERY_CODE_MISMATCH', 'Invalid delivery code');

    order.status = 'delivered';
    order.timestamps.deliveredAt = new Date();
    const courierFee = order.pricing.deliveryFee + (order.earnings?.courierFee || 0);
    order.earnings = { ...order.earnings, courierFee };
    await order.save();

    const user = req.user;
    if (!user.courier) user.courier = {};
    user.courier.totalDeliveries = (user.courier.totalDeliveries || 0) + 1;
    user.courier.earningsToday = (user.courier.earningsToday || 0) + courierFee;
    user.courier.earningsThisWeek = (user.courier.earningsThisWeek || 0) + courierFee;
    user.courier.earningsTotal = (user.courier.earningsTotal || 0) + courierFee;
    user.walletBalance += courierFee;
    await user.save();

    await Transaction.create({
      user: user._id, type: 'courier_earning', amount: courierFee, balanceAfter: user.walletBalance,
      reference: { id: order._id, model: 'Order' },
      description: `Delivery fee for order ${order.orderNumber}`, status: 'completed',
    });

    const io = (global as any).io;
    if (io) {
      io.emitToOrder(String(order._id), 'order:status', { orderId: order._id, status: 'delivered', orderNumber: order.orderNumber });
      io.emitToStudent(String(order.student), 'notification:new', { type: 'order_delivered', title: 'Order Delivered', message: `Order ${order.orderNumber} has been delivered` });
      io.emitToCourier(String(user._id), 'earnings:update', { amount: courierFee, totalEarnings: user.courier.earningsTotal });
    }

    res.json({ success: true, data: { message: 'Order delivered', courierFee, orderNumber: order.orderNumber }, meta: { timestamp: new Date().toISOString() } });
  },

  cancelOrder: async (req: AuthenticatedRequest, res: Response) => {
    const { reason } = req.body;
    const order = await Order.findOne({ _id: req.params.id, courier: req.user._id });
    if (!order) throw new NotFoundError('Order');
    if (!canCancel('courier', order.status)) throw new AppError('ORDER_NOT_CANCELLABLE', `Cannot cancel in ${order.status} status`);

    order.status = 'cancelled';
    order.cancelledBy = 'courier';
    order.cancellationReason = reason || 'Cancelled by courier';
    order.timestamps.cancelledAt = new Date();
    await order.save();

    const user = req.user;
    if (user.courier) {
      user.courier.cancelledDeliveries = (user.courier.cancelledDeliveries || 0) + 1;
      user.courier.isOnline = false;
      await user.save();
    }

    const io = (global as any).io;
    if (io) {
      io.emitToOrder(String(order._id), 'order:status', { orderId: order._id, status: 'cancelled', cancelledBy: 'courier' });
      io.emitToStudent(String(order.student), 'order:cancelled', { orderId: order._id, orderNumber: order.orderNumber, reason });
      io.emitToRestaurant(String(order.restaurant), 'order:cancelled', { orderId: order._id, orderNumber: order.orderNumber, reason });
    }

    res.json({ success: true, data: { message: 'Order cancelled', orderNumber: order.orderNumber }, meta: { timestamp: new Date().toISOString() } });
  },

  getActiveOrder: async (req: AuthenticatedRequest, res: Response) => {
    const order = await Order.findOne({
      courier: req.user._id,
      status: { $in: ['courier_assigned', 'picked_up'] },
    })
      .populate('restaurant', 'name category location contactPhone images')
      .populate('student', 'name phone')
      .lean();

    res.json({ success: true, data: order, meta: { timestamp: new Date().toISOString() } });
  },

  getOrderHistory: async (req: AuthenticatedRequest, res: Response) => {
    const { status, page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const filter: any = { courier: req.user._id };
    if (status) filter.status = status;

    const total = await Order.countDocuments(filter);
    const items = await Order.find(filter)
      .populate('restaurant', 'name category')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({ success: true, data: { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, meta: { timestamp: new Date().toISOString() } });
  },

  getEarnings: async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayAgg, weekAgg, monthAgg, pendingAgg] = await Promise.all([
      Transaction.aggregate([{ $match: { user: user._id, type: 'courier_earning', createdAt: { $gte: startOfDay } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.aggregate([{ $match: { user: user._id, type: 'courier_earning', createdAt: { $gte: startOfWeek } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.aggregate([{ $match: { user: user._id, type: 'courier_earning', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      WithdrawalRequest.aggregate([{ $match: { user: user._id, type: 'courier', status: 'pending' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    res.json({
      success: true,
      data: {
        today: todayAgg[0]?.total || 0, week: weekAgg[0]?.total || 0, month: monthAgg[0]?.total || 0,
        total: user.courier?.earningsTotal || 0, pendingPayout: pendingAgg[0]?.total || 0, walletBalance: user.walletBalance || 0,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  },

  requestPayout: async (req: AuthenticatedRequest, res: Response) => {
    const { amount, upiId } = req.body;
    const user = req.user;
    if (amount > (user.walletBalance || 0)) throw new AppError('INSUFFICIENT_WALLET', 'Insufficient wallet balance');

    const withdrawal = await WithdrawalRequest.create({
      user: user._id, type: 'courier', amount,
      bankDetails: { upiId: upiId || user.courier?.bankDetails?.upiId },
      status: 'pending',
    });

    user.walletBalance -= amount;
    await user.save();

    await Transaction.create({
      user: user._id, type: 'courier_payout', amount: -amount, balanceAfter: user.walletBalance,
      reference: { id: withdrawal._id, model: 'WithdrawalRequest' },
      description: `Payout request of ₹${amount}`, status: 'completed',
    });

    const io = (global as any).io;
    if (io) io.emitToAdmins('withdrawal:pending', { withdrawalId: withdrawal._id, user: user._id, amount });

    res.status(201).json({ success: true, data: { message: 'Payout requested', withdrawal, walletBalance: user.walletBalance }, meta: { timestamp: new Date().toISOString() } });
  },

  getPayoutHistory: async (req: AuthenticatedRequest, res: Response) => {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));

    const total = await WithdrawalRequest.countDocuments({ user: req.user._id, type: 'courier' });
    const items = await WithdrawalRequest.find({ user: req.user._id, type: 'courier' })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({ success: true, data: { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, meta: { timestamp: new Date().toISOString() } });
  },

  getProfile: async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.user._id).select('-password -otp -otpExpires').lean();
    res.json({ success: true, data: user, meta: { timestamp: new Date().toISOString() } });
  },

  updateProfile: async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const updatable = ['name', 'phone', 'roomNumber', 'hostelBlock'];
    for (const field of updatable) {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    }
    if (req.body.bankDetails && user.courier) {
      user.courier.bankDetails = { ...user.courier.bankDetails, ...req.body.bankDetails };
    }
    await user.save();
    res.json({ success: true, data: { message: 'Profile updated' }, meta: { timestamp: new Date().toISOString() } });
  },
};
