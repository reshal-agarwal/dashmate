import mongoose, { Schema, Document } from 'mongoose';

export type OrderStatus = 
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'courier_assigned'
  | 'picked_up'
  | 'delivered'
  | 'cancelled'
  | 'disputed';

export type CancelledBy = 'student' | 'restaurant' | 'courier' | 'admin' | 'system';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

export interface IOrderPricing {
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  discount: number;
  creditsApplied: number;
  totalAmount: number;
}

export interface IOrderPayment {
  method: 'wallet' | 'upi' | 'cod' | 'credits';
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial_refund';
  transactionId?: string;
  paidAt?: Date;
}

export interface IOrderDeliveryAddress {
  building: string;
  floor?: string;
  roomNumber: string;
  landmark?: string;
  coordinates?: { lat: number; lng: number };
}

export interface IOrderTimestamps {
  placedAt: Date;
  confirmedAt?: Date;
  readyAt?: Date;
  courierAssignedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
}

export interface IOrderRating {
  food?: number;
  delivery?: number;
  review?: string;
  ratedAt?: Date;
}

export interface IOrderEarnings {
  studentCreditsEarned: number;
  courierFee: number;
  restaurantPayout: number;
  platformRevenue: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  student: mongoose.Types.ObjectId;
  restaurant: mongoose.Types.ObjectId;
  courier?: mongoose.Types.ObjectId;
  items: IOrderItem[];
  pricing: IOrderPricing;
  payment: IOrderPayment;
  status: OrderStatus;
  cancelledBy?: CancelledBy;
  cancellationReason?: string;
  cancellationFee: number;
  pickupCode: string;
  deliveryCode: string;
  deliveryAddress: IOrderDeliveryAddress;
  timestamps: IOrderTimestamps;
  rating: IOrderRating;
  earnings: IOrderEarnings;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>({
  orderNumber: { type: String, required: true, unique: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  courier: { type: Schema.Types.ObjectId, ref: 'User' },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, max: 50 },
    specialInstructions: { type: String, maxlength: 500 },
  }],
  pricing: {
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    platformFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    creditsApplied: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
  },
  payment: {
    method: { type: String, enum: ['wallet', 'upi', 'cod', 'credits'], default: 'wallet' },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded', 'partial_refund'], default: 'pending' },
    transactionId: String,
    paidAt: Date,
  },
  status: {
    type: String,
    enum: ['placed', 'confirmed', 'preparing', 'ready', 'courier_assigned', 'picked_up', 'delivered', 'cancelled', 'disputed'],
    default: 'placed',
  },
  cancelledBy: { type: String, enum: ['student', 'restaurant', 'courier', 'admin', 'system'] },
  cancellationReason: { type: String, maxlength: 500 },
  cancellationFee: { type: Number, default: 0 },
  pickupCode: { type: String, length: 4, match: /^\d{4}$/ },
  deliveryCode: { type: String, length: 4, match: /^\d{4}$/ },
  deliveryAddress: {
    building: { type: String, required: true },
    floor: String,
    roomNumber: { type: String, required: true },
    landmark: { type: String, maxlength: 200 },
    coordinates: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
    },
  },
  timestamps: {
    placedAt: { type: Date, default: Date.now },
    confirmedAt: Date,
    readyAt: Date,
    courierAssignedAt: Date,
    pickedUpAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
  },
  rating: {
    food: { type: Number, min: 1, max: 5 },
    delivery: { type: Number, min: 1, max: 5 },
    review: { type: String, maxlength: 1000 },
    ratedAt: Date,
  },
  earnings: {
    studentCreditsEarned: { type: Number, default: 0 },
    courierFee: { type: Number, default: 0 },
    restaurantPayout: { type: Number, default: 0 },
    platformRevenue: { type: Number, default: 0 },
  },
}, { timestamps: true });

orderSchema.index({ student: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, status: 1 });
orderSchema.index({ courier: 1, status: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1, 'timestamps.placedAt': 1 });
orderSchema.index({ 'deliveryAddress.coordinates': '2dsphere' });

function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `DM${year}${month}${day}${random}`;
}

function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

orderSchema.pre('validate', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = generateOrderNumber();
  }
  if (!this.pickupCode) {
    this.pickupCode = generateCode();
  }
  if (!this.deliveryCode) {
    this.deliveryCode = generateCode();
  }
  next();
});

export const Order = mongoose.model<IOrder>('Order', orderSchema);