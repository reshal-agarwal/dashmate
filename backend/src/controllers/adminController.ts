import { Request, Response } from 'express';
import { User } from '../models/userModel';
import { Order } from '../models/orderModel';
import { Transaction } from '../models/transactionModel';
import { Coupon } from '../models/couponModel';
import { WithdrawalRequest } from '../models/withdrawalModel';
import { NotFoundError, AppError } from '../utils/errors';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const adminController = {
  getDashboard: async (req: AuthenticatedRequest, res: Response) => {
    const [totalUsers, totalOrders, pendingCouriers, pendingWithdrawals] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ 'courier.kycStatus': 'pending' }),
      WithdrawalRequest.countDocuments({ status: 'pending' }),
    ]);

    const revenueAgg = await Transaction.aggregate([
      { $match: { type: { $in: ['wallet_topup', 'platform_fee'] }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true,
      data: { totalUsers, totalOrders, totalRevenue: revenueAgg[0]?.total || 0, pendingCouriers, pendingWithdrawals },
      meta: { timestamp: new Date().toISOString() },
    });
  },

  getRestaurants: async (req: AuthenticatedRequest, res: Response) => {
    const { Restaurant } = require('../models/restaurantModel');
    const { page = '1', limit = '20', isVerified } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const filter: any = {};
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

    const total = await Restaurant.countDocuments(filter);
    const items = await Restaurant.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean();
    res.json({ success: true, data: { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, meta: { timestamp: new Date().toISOString() } });
  },

  getCouriers: async (req: AuthenticatedRequest, res: Response) => {
    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const filter: any = { role: 'courier' };
    if (status) filter['courier.kycStatus'] = status;

    const total = await User.countDocuments(filter);
    const items = await User.find(filter)
      .select('name phone registerNumber courier createdAt')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({ success: true, data: { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, meta: { timestamp: new Date().toISOString() } });
  },

  getCourier: async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.params.id).select('-password -otp -otpExpires').lean();
    if (!user || user.role !== 'courier') throw new NotFoundError('Courier');
    res.json({ success: true, data: user, meta: { timestamp: new Date().toISOString() } });
  },

  verifyCourier: async (req: AuthenticatedRequest, res: Response) => {
    const { isVerified, rejectionReason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError('User');

    if (!user.courier) user.courier = {} as any;
    user.courier.kycStatus = isVerified ? 'approved' : 'rejected';
    user.courier.isVerified = isVerified;
    if (!isVerified && rejectionReason) user.courier.kycStatus = 'rejected';
    await user.save();

    const io = (global as any).io;
    if (io) {
      io.emitToCourier(String(user._id), 'notification:new', {
        type: isVerified ? 'verification_approved' : 'verification_rejected',
        title: isVerified ? 'KYC Approved' : 'KYC Rejected',
        message: isVerified ? 'You can now start delivering orders' : `KYC rejected: ${rejectionReason || 'Please re-submit'}`,
      });
    }

    res.json({ success: true, data: { message: `Courier ${isVerified ? 'verified' : 'rejected'}`, kycStatus: user.courier.kycStatus }, meta: { timestamp: new Date().toISOString() } });
  },

  getWithdrawals: async (req: AuthenticatedRequest, res: Response) => {
    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const filter: any = {};
    if (status) filter.status = status;

    const total = await WithdrawalRequest.countDocuments(filter);
    const items = await WithdrawalRequest.find(filter).populate('user', 'name phone').sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean();
    res.json({ success: true, data: { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }, meta: { timestamp: new Date().toISOString() } });
  },

  processWithdrawal: async (req: AuthenticatedRequest, res: Response) => {
    const { action, note } = req.body;
    const withdrawal = await WithdrawalRequest.findById(req.params.id);
    if (!withdrawal) throw new NotFoundError('Withdrawal');
    if (withdrawal.status !== 'pending') throw new AppError('CONFLICT', 'Withdrawal already processed');

    if (action === 'approve') {
      withdrawal.status = 'approved';
      withdrawal.processedAt = new Date();
      withdrawal.processedBy = req.user._id;
    } else {
      withdrawal.status = 'rejected';
      withdrawal.rejectionReason = note;
      withdrawal.processedBy = req.user._id;
      const user = await User.findById(withdrawal.user);
      if (user) {
        user.walletBalance += withdrawal.amount;
        await user.save();
      }
    }
    await withdrawal.save();

    res.json({ success: true, data: { message: `Withdrawal ${action}d`, withdrawal }, meta: { timestamp: new Date().toISOString() } });
  },
};
