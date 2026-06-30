import { z } from 'zod';

export const createRestaurantSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(1000).optional(),
    category: z.enum(['mess', 'cafe', 'grocery', 'stationery', 'pharmacy', 'other']),
    location: z.object({
      building: z.string().min(1),
      floor: z.string().optional(),
      roomNumber: z.string().min(1),
      coordinates: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      }),
    }),
    operatingHours: z.object({
      open: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format HH:MM'),
      close: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format HH:MM'),
      daysOpen: z.array(z.number().min(0).max(6)).min(1),
    }),
    minimumOrderAmount: z.number().min(0).default(0),
    deliveryFee: z.number().min(0).default(10),
    estimatedPrepTime: z.number().min(1).max(120).default(20),
    tags: z.array(z.string()).optional(),
    contactPhone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
    gstNumber: z.string().optional(),
    payoutUpiId: z.string().regex(/^[\w.-]+@[\w.-]+$/, 'Invalid UPI ID').optional(),
  }),
});

export const updateRestaurantSchema = createRestaurantSchema.shape.body.partial();

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
    category: z.string().min(1).max(50),
    price: z.number().min(0).max(10000),
    originalPrice: z.number().min(0).max(10000).optional(),
    images: z.array(z.string().url()).max(5).optional(),
    isAvailable: z.boolean().default(true),
    isVegetarian: z.boolean().default(false),
    isVegan: z.boolean().default(false),
    spiceLevel: z.number().min(0).max(3).default(0),
    preparationTime: z.number().min(1).max(120).default(10),
    stock: z.number().int().min(-1).default(-1),
    tags: z.array(z.string()).optional(),
  }),
});

export const updateProductSchema = createProductSchema.shape.body.partial();

export const bulkToggleProductsSchema = z.object({
  body: z.object({
    productIds: z.array(z.string()).min(1).max(100),
    isAvailable: z.boolean(),
  }),
});

export const bulkToggleCategorySchema = z.object({
  body: z.object({
    category: z.string().min(1).max(50),
    isAvailable: z.boolean(),
  }),
});

export const uploadImageSchema = z.object({
  body: z.object({
    image: z.string().min(1, 'Image data is required'),
  }),
});