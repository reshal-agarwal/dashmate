import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  platformCommission: number;
  defaultDeliveryFee: number;
  creditEarnRate: number;
  creditExpiryDays: number;
  maxOrdersPerDay: number;
  maxCreditsEarnedPerDay: number;
}

const settingsSchema = new Schema<ISettings>({
  platformCommission: { type: Number, default: 5, min: 0, max: 30 },
  defaultDeliveryFee: { type: Number, default: 10, min: 0, max: 100 },
  creditEarnRate: { type: Number, default: 0.05, min: 0, max: 1 },
  creditExpiryDays: { type: Number, default: 180, min: 30, max: 365 },
  maxOrdersPerDay: { type: Number, default: 20, min: 1, max: 100 },
  maxCreditsEarnedPerDay: { type: Number, default: 500, min: 100, max: 5000 },
}, { timestamps: true });

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
