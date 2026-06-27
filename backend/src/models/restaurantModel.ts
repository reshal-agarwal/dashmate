import mongoose, { Schema, Document } from 'mongoose';

export interface IRestaurant extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  category: 'mess' | 'cafe' | 'grocery' | 'stationery' | 'pharmacy' | 'other';
  location: {
    building: string;
    floor?: string;
    roomNumber: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  images: string[];
  operatingHours: {
    open: string;
    close: string;
    daysOpen: number[];
  };
  isActive: boolean;
  isVerified: boolean;
  rating: number;
  totalOrders: number;
  minimumOrderAmount: number;
  deliveryFee: number;
  platformCommission: number;
  estimatedPrepTime: number;
  tags: string[];
  contactPhone: string;
  gstNumber?: string;
  payoutUpiId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantSchema = new Schema<IRestaurant>({
  name: { type: String, required: true, minlength: 2, maxlength: 100 },
  description: { type: String, maxlength: 1000 },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { 
    type: String, 
    enum: ['mess', 'cafe', 'grocery', 'stationery', 'pharmacy', 'other'], 
    required: true 
  },
  location: {
    building: { type: String, required: true },
    floor: String,
    roomNumber: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true, min: -90, max: 90 },
      lng: { type: Number, required: true, min: -180, max: 180 },
    },
  },
  images: [{ type: String }],
  operatingHours: {
    open: { type: String, required: true, match: /^([01]\d|2[0-3]):([0-5]\d)$/ },
    close: { type: String, required: true, match: /^([01]\d|2[0-3]):([0-5]\d)$/ },
    daysOpen: [{ type: Number, min: 0, max: 6 }],
  },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalOrders: { type: Number, default: 0 },
  minimumOrderAmount: { type: Number, default: 0, min: 0 },
  deliveryFee: { type: Number, default: 10, min: 0 },
  platformCommission: { type: Number, default: 5, min: 0, max: 30 },
  estimatedPrepTime: { type: Number, default: 20, min: 1, max: 120 },
  tags: [{ type: String }],
  contactPhone: { type: String, required: true, match: /^[6-9]\d{9}$/ },
  gstNumber: String,
  payoutUpiId: { type: String, match: /^[\w.-]+@[\w.-]+$/ },
}, { timestamps: true });

restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ isActive: 1, isVerified: 1 });
restaurantSchema.index({ 'location.coordinates': '2dsphere' });
restaurantSchema.index({ category: 1 });

export const Restaurant = mongoose.model<IRestaurant>('Restaurant', restaurantSchema);