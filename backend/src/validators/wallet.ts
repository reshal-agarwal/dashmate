import { z } from 'zod';

export const topupWalletSchema = z.object({
  body: z.object({
    amount: z.number().min(10, 'Minimum topup is ₹10').max(50000, 'Maximum topup is ₹50,000'),
    method: z.enum(['upi', 'card', 'netbanking']).default('upi'),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
  }),
});

export const convertCreditsSchema = z.object({
  body: z.object({
    credits: z.number().int().min(100, 'Minimum 100 credits').max(10000, 'Maximum 10000 credits at once'),
  }),
});

export const walletQuerySchema = z.object({
  query: z.object({
    type: z.enum(['wallet_topup', 'wallet_deduction', 'wallet_refund', 'credits_earned', 'credits_spent', 'credits_expired', 'courier_earning', 'courier_payout', 'restaurant_payout', 'platform_fee']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});