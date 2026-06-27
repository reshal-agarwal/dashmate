import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    registerNumber: z.string().min(1, 'Register number is required').max(20),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    roomNumber: z.string().max(20).optional(),
    hostelBlock: z.string().max(50).optional(),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    registerNumber: z.string().min(1, 'Register number is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    roomNumber: z.string().max(20).optional(),
    hostelBlock: z.string().max(50).optional(),
    preferences: z.object({
      notifications: z.boolean().optional(),
      dietaryRestrictions: z.array(z.string()).optional(),
    }).optional(),
  }),
});

export const applyCourierSchema = z.object({
  body: z.object({
    vehicleType: z.enum(['bicycle', 'scooter', 'walking']),
    vehicleNumber: z.string().max(20).optional(),
    licenseNumber: z.string().max(30).optional(),
    kycDocuments: z.object({
      aadhar: z.string().url('Aadhar must be a valid URL'),
      drivingLicense: z.string().url('License must be a valid URL').optional(),
      selfie: z.string().url('Selfie must be a valid URL'),
    }),
  }),
});

export const updateLocationSchema = z.object({
  body: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    heading: z.number().min(0).max(360).optional(),
    speed: z.number().min(0).optional(),
  }),
});

export const toggleOnlineSchema = z.object({
  body: z.object({
    isOnline: z.boolean(),
  }),
});