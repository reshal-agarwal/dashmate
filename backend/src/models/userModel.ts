import mongoose, { Schema, Document } from 'mongoose';

export interface ICourierProfile {
  isVerified: boolean;
  vehicleType: 'bicycle' | 'scooter' | 'walking';
  vehicleNumber?: string;
  licenseNumber?: string;
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected';
  kycDocuments: {
    aadhar: string;
    drivingLicense?: string;
    selfie: string;
  };
  bankDetails: {
    upiId?: string;
    accountNumber?: string;
    ifsc?: string;
    accountHolderName?: string;
  };
  rating: number;
  totalDeliveries: number;
  cancelledDeliveries: number;
  isOnline: boolean;
  earningsToday: number;
  earningsThisWeek: number;
  earningsTotal: number;
}

export interface IPreferences {
  notifications: boolean;
  dietaryRestrictions: string[];
}

export interface IUser extends Document {
  registerNumber: string;
  phone: string;
  name: string;
  password: string;
  roomNumber?: string;
  hostelBlock?: string;
  role: 'student' | 'courier' | 'admin' | 'restaurant_owner';
  walletBalance: number;
  creditsBalance: number;
  creditsLastActivityAt: Date;
  pointsBalance: number;
  courier?: ICourierProfile;
  restaurant?: mongoose.Types.ObjectId;
  preferences: IPreferences;
  isVerified: boolean;
  otp?: string;
  otpExpires?: Date;
  googleId?: string;
  orderCountToday: number;
  lastOrderAt?: Date;
  creditEarnedToday: number;
  createdAt: Date;
  updatedAt: Date;
}

const courierProfileSchema = new Schema<ICourierProfile>({
  isVerified: { type: Boolean, default: false },
  vehicleType: { type: String, enum: ['bicycle', 'scooter', 'walking'], default: 'walking' },
  vehicleNumber: String,
  licenseNumber: String,
  kycStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  kycDocuments: {
    aadhar: { type: String, required: true },
    drivingLicense: String,
    selfie: { type: String, required: true },
  },
  bankDetails: {
    upiId: { type: String, match: /^[\w.-]+@[\w.-]+$/ },
    accountNumber: String,
    ifsc: String,
    accountHolderName: String,
  },
  rating: { type: Number, default: 5.0, min: 1, max: 5 },
  totalDeliveries: { type: Number, default: 0 },
  cancelledDeliveries: { type: Number, default: 0 },
  isOnline: { type: Boolean, default: false },
  earningsToday: { type: Number, default: 0 },
  earningsThisWeek: { type: Number, default: 0 },
  earningsTotal: { type: Number, default: 0 },
});

const preferencesSchema = new Schema<IPreferences>({
  notifications: { type: Boolean, default: true },
  dietaryRestrictions: [{ type: String }],
}, { _id: false });

const userSchema = new Schema<IUser>({
  registerNumber: { type: String, required: true, unique: true, trim: true, maxlength: 20 },
  phone: { type: String, required: true, unique: true, match: /^[6-9]\d{9}$/ },
  name: { type: String, required: true, minlength: 2, maxlength: 100 },
  password: { type: String, required: true, minlength: 8 },
  roomNumber: { type: String, maxlength: 20 },
  hostelBlock: { type: String, maxlength: 50 },
  role: { type: String, enum: ['student', 'courier', 'admin', 'restaurant_owner'], default: 'student' },
  walletBalance: { type: Number, default: 0 },
  creditsBalance: { type: Number, default: 0 },
  creditsLastActivityAt: { type: Date, default: Date.now },
  pointsBalance: { type: Number, default: 0 },
  courier: courierProfileSchema,
  restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant' },
  preferences: { type: preferencesSchema, default: () => ({}) },
  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpires: Date,
  googleId: String,
  orderCountToday: { type: Number, default: 0 },
  lastOrderAt: Date,
  creditEarnedToday: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.index({ registerNumber: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ creditsLastActivityAt: 1 });

export const User = mongoose.model<IUser>('User', userSchema);