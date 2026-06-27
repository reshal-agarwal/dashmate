import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usageLimitPerUser: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  applicableRestaurants: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>({
  code: { type: String, required: true, unique: true, uppercase: true, minlength: 3, maxlength: 20 },
  description: { type: String, maxlength: 500 },
  discountType: { type: String, enum: ['percentage', 'flat'], required: true },
  discountValue: { type: Number, required: true, min: 1 },
  minOrderAmount: { type: Number, default: 0, min: 0 },
  maxDiscount: { type: Number, min: 1 },
  usageLimit: { type: Number, default: -1, min: -1 },
  usageLimitPerUser: { type: Number, default: 1, min: 1 },
  usedCount: { type: Number, default: 0 },
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },
  applicableRestaurants: [{ type: Schema.Types.ObjectId, ref: 'Restaurant' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);