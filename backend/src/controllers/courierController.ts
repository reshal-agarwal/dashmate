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
