import cron from 'node-cron';
import { User } from '../models/userModel';
import { Order } from '../models/orderModel';
import { Transaction } from '../models/transactionModel';
import { Notification } from '../models/notificationModel';
import { config } from '../config';
import { getCancellationPolicy, canCancel } from '../utils/cancellationPolicy';

export function initCronJobs(): void {
  console.log('Initializing cron jobs...');

  // 1. Credit Expiry - Daily 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[Cron] Running credit expiry job...');
    await expireInactiveCredits();
  });

  // 2. Auto-cancel Stuck Orders - Every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Cron] Checking for stuck orders...');
    await autoCancelStuckOrders();
  });

  // 3. Daily Stats Rollup - 1 AM
  cron.schedule('0 1 * * *', async () => {
    console.log('[Cron] Rolling up daily stats...');
    await rollupDailyStats();
  });

  // 4. Courier Payout Reminders - Monday 9 AM
  cron.schedule('0 9 * * 1', async () => {
    console.log('[Cron] Sending payout reminders...');
    await sendPayoutReminders();
  });

// 5. Daily Order Count Reset - Midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Resetting daily counters...');
    await resetDailyCounters();
  });

  console.log('Cron jobs initialized');
}

async function expireInactiveCredits(): Promise<void> {
  try {
    const expiryDate = new Date(Date.now() - config.credit.expiryDays * 24 * 60 * 60 * 1000);
    const users = await User.find({
      creditsBalance: { $gt: 0 },
      creditsLastActivityAt: { $lt: expiryDate },
    });

    for (const user of users) {
      const expired = user.creditsBalance;
      user.creditsBalance = 0;
      user.creditsLastActivityAt = new Date();
      await user.save();

      await Transaction.create({
        user: user._id,
        type: 'credits_expired',
        amount: -expired,
        balanceAfter: user.walletBalance,
        creditsBalanceAfter: 0,
        reference: { id: user._id, model: 'User' },
        description: `Credits expired due to ${config.credit.expiryDays} days inactivity`,
      });

      await Notification.create({
        user: user._id,
        type: 'system',
        title: 'Credits Expired',
        message: `${expired} credits expired due to inactivity. Place an order to keep credits alive.`,
        priority: 'high',
      });
    }

    console.log(`[Cron] Expired credits for ${users.length} users`);
  } catch (err) {
    console.error('[Cron] Credit expiry failed:', err);
  }
}

async function autoCancelStuckOrders(): Promise<void> {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Orders with no restaurant response for 10 minutes
    const noResponseOrders = await Order.find({
      status: 'placed',
      'timestamps.placedAt': { $lt: tenMinutesAgo },
    });

    for (const order of noResponseOrders) {
      await handleAutoCancel(order, 'system', 'no_restaurant_response');
    }

    // Orders ready but no courier for 15 minutes
    const noCourierOrders = await Order.find({
      status: 'ready',
      'timestamps.readyAt': { $lt: fifteenMinutesAgo },
    });

    for (const order of noCourierOrders) {
      await handleAutoCancel(order, 'system', 'no_courier_15min');
    }

    console.log(`[Cron] Auto-cancelled ${noResponseOrders.length + noCourierOrders.length} stuck orders`);
  } catch (err) {
    console.error('[Cron] Auto-cancel failed:', err);
  }
}

async function handleAutoCancel(order: any, cancelledBy: string, reason: string): Promise<void> {
  const policy = getCancellationPolicy(
    cancelledBy as any,
    order.status,
    order.pricing.totalAmount,
    order.pricing.deliveryFee,
    order.pricing.subtotal
  );

  order.status = 'cancelled';
  order.cancelledBy = cancelledBy;
  order.cancellationReason = reason;
  order.timestamps.cancelledAt = new Date();
  await order.save();

  // Process refunds/compensations based on policy
  // This would integrate with wallet service
}

async function rollupDailyStats(): Promise<void> {
  // Aggregate daily stats for admin dashboard
  // This would create daily summary documents
  console.log('[Cron] Daily stats rollup completed');
}

async function sendPayoutReminders(): Promise<void> {
  try {
    const couriers = await User.find({
      role: 'courier',
      'courier.bankDetails.upiId': { $exists: true, $ne: '' },
      walletBalance: { $gte: config.courier.minPayout },
    });

    for (const courier of couriers) {
      await Notification.create({
        user: courier._id,
        type: 'courier_earnings',
        title: 'Weekly Payout Available',
        message: `₹${courier.walletBalance} available. Request payout from earnings page.`,
        data: { amount: courier.walletBalance },
      });
    }

    console.log(`[Cron] Sent payout reminders to ${couriers.length} couriers`);
  } catch (err) {
    console.error('[Cron] Payout reminders failed:', err);
  }
}

async function resetDailyCounters(): Promise<void> {
  try {
    await User.updateMany(
      {},
      {
        $set: {
          orderCountToday: 0,
          creditEarnedToday: 0,
        },
      }
    );
    console.log('[Cron] Daily counters reset');
  } catch (err) {
    console.error('[Cron] Daily counter reset failed:', err);
  }
}