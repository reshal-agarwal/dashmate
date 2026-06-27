import { z } from 'zod';

export const acceptOrderSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const pickupOrderSchema = z.object({
  body: z.object({
    code: z.string().length(4, 'Pickup code must be 4 digits').regex(/^\d{4}$/),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const deliverOrderSchema = z.object({
  body: z.object({
    code: z.string().length(4, 'Delivery code must be 4 digits').regex(/^\d{4}$/),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const cancelCourierOrderSchema = z.object({
  body: z.object({
    reason: z.string().min(5).max(500),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const courierOrderQuerySchema = z.object({
  query: z.object({
    status: z.enum(['available', 'active', 'completed', 'cancelled']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});

export const payoutRequestSchema = z.object({
  body: z.object({
    amount: z.number().min(100, 'Minimum payout is ₹100'),
    upiId: z.string().regex(/^[\w.-]+@[\w.-]+$/, 'Invalid UPI ID'),
  }),
});