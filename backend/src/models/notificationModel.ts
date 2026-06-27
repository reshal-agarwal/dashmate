import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType = 
  | 'order_placed'
  | 'order_confirmed'
  | 'order_ready'
  | 'courier_assigned'
  | 'order_picked_up'
  | 'order_delivered'
  | 'order_cancelled'
  | 'courier_new_order'
  | 'courier_earnings'
  | 'credits_earned'
  | 'promo'
  | 'system'
  | 'payout_initiated'
  | 'payout_completed'
  | 'verification_approved'
  | 'verification_rejected';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high';
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  markAsRead: () => Promise<INotification>;
}

const notificationSchema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: [
      'order_placed', 'order_confirmed', 'order_ready', 'courier_assigned',
      'order_picked_up', 'order_delivered', 'order_cancelled',
      'courier_new_order', 'courier_earnings', 'credits_earned',
      'promo', 'system', 'payout_initiated', 'payout_completed',
      'verification_approved', 'verification_rejected'
    ],
    required: true,
  },
  title: { type: String, required: true, maxlength: 100 },
  message: { type: String, required: true, maxlength: 500 },
  data: Schema.Types.Mixed,
  isRead: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  readAt: Date,
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });

notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);