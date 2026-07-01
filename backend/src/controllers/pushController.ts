import { Request, Response } from 'express';
import { PushSubscription } from '../models/pushSubscriptionModel';
import { getVapidPublicKey } from '../services/pushNotifications';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const pushController = {
  getVapidKey: async (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      data: { publicKey: getVapidPublicKey() },
      meta: { timestamp: new Date().toISOString() },
    });
  },

  subscribe: async (req: AuthenticatedRequest, res: Response) => {
    const { endpoint, keys, userAgent } = req.body;
    const existing = await PushSubscription.findOne({ endpoint });
    if (existing) {
      existing.keys = keys;
      existing.userAgent = userAgent || existing.userAgent;
      await existing.save();
    } else {
      await PushSubscription.create({
        user: req.user._id,
        endpoint,
        keys,
        userAgent: userAgent || req.headers['user-agent'],
      });
    }
    res.status(201).json({
      success: true,
      data: { message: 'Subscribed to push notifications' },
      meta: { timestamp: new Date().toISOString() },
    });
  },

  unsubscribe: async (req: AuthenticatedRequest, res: Response) => {
    const { endpoint } = req.body;
    await PushSubscription.deleteOne({ endpoint, user: req.user._id });
    res.json({
      success: true,
      data: { message: 'Unsubscribed from push notifications' },
      meta: { timestamp: new Date().toISOString() },
    });
  },
};
