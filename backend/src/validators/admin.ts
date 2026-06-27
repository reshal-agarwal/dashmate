import { z } from 'zod';

export const verifyRestaurantSchema = z.object({
  body: z.object({
    isVerified: z.boolean(),
    rejectionReason: z.string().max(500).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const verifyCourierSchema = z.object({
  body: z.object({
    isVerified: z.boolean(),
    rejectionReason: z.string().max(500).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const processWithdrawalSchema = z.object({
  body: z.object({
    action: z.enum(['approve', 'reject']),
    note: z.string().max(500).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(20).toUpperCase(),
    description: z.string().max(500),
    discountType: z.enum(['percentage', 'flat']),
    discountValue: z.number().min(1).max(100),
    minOrderAmount: z.number().min(0).default(0),
    maxDiscount: z.number().min(1).optional(),
    usageLimit: z.number().int().min(-1).default(-1),
    usageLimitPerUser: z.number().int().min(1).default(1),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime(),
    applicableRestaurants: z.array(z.string()).optional(),
  }),
});

export const updateCouponSchema = createCouponSchema.shape.body.partial();

export const adminOrderQuerySchema = z.object({
  query: z.object({
    status: z.enum(['placed', 'confirmed', 'preparing', 'ready', 'courier_assigned', 'picked_up', 'delivered', 'cancelled', 'disputed']).optional(),
    studentId: z.string().optional(),
    restaurantId: z.string().optional(),
    courierId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export const refundOrderSchema = z.object({
  body: z.object({
    amount: z.number().min(1).max(100000),
    reason: z.string().min(5).max(500),
    type: z.enum(['full', 'partial']),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const updateSettingsSchema = z.object({
  body: z.object({
    platformCommission: z.number().min(0).max(30).optional(),
    defaultDeliveryFee: z.number().min(0).max(100).optional(),
    creditEarnRate: z.number().min(0).max(1).optional(),
    creditExpiryDays: z.number().int().min(30).max(365).optional(),
    maxOrdersPerDay: z.number().int().min(1).max(100).optional(),
    maxCreditsEarnedPerDay: z.number().int().min(100).max(5000).optional(),
  }),
});