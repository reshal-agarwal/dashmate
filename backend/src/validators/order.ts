import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    restaurantId: z.string().min(1),
    items: z.array(z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1).max(50),
      specialInstructions: z.string().max(500).optional(),
    })).min(1).max(20),
    deliveryAddress: z.object({
      building: z.string().min(1),
      floor: z.string().optional(),
      roomNumber: z.string().min(1),
      landmark: z.string().max(200).optional(),
      coordinates: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      }).optional(),
    }),
    paymentMethod: z.enum(['wallet', 'upi', 'cod', 'credits']).default('wallet'),
    couponCode: z.string().max(20).optional(),
    creditsToApply: z.number().min(0).optional(),
  }),
});

export const cancelOrderSchema = z.object({
  body: z.object({
    reason: z.string().min(5).max(500),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const rateOrderSchema = z.object({
  body: z.object({
    foodRating: z.number().min(1).max(5),
    deliveryRating: z.number().min(1).max(5),
    review: z.string().max(1000).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const orderQuerySchema = z.object({
  query: z.object({
    status: z.enum(['placed', 'confirmed', 'preparing', 'ready', 'courier_assigned', 'picked_up', 'delivered', 'cancelled', 'disputed']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});