export type UserRole = 'student' | 'courier' | 'admin' | 'restaurant_owner';

export interface User {
  id: string;
  registerNumber: string;
  phone: string;
  name: string;
  role: UserRole;
  roomNumber?: string;
  hostelBlock?: string;
  walletBalance: number;
  creditsBalance: number;
  pointsBalance: number;
  courier?: CourierProfile;
  restaurant?: string;
  preferences: {
    notifications: boolean;
    dietaryRestrictions: string[];
  };
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourierProfile {
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

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  owner: string;
  category: 'mess' | 'cafe' | 'grocery' | 'stationery' | 'pharmacy' | 'other';
  location: {
    building: string;
    floor?: string;
    roomNumber: string;
    coordinates: { lat: number; lng: number };
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
}

export interface Product {
  id: string;
  restaurant: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  originalPrice?: number;
  images: string[];
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  spiceLevel: 0 | 1 | 2 | 3;
  preparationTime: number;
  stock: number;
  soldCount: number;
  tags: string[];
}

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

export interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

export interface OrderPricing {
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  discount: number;
  creditsApplied: number;
  totalAmount: number;
}

export interface OrderPayment {
  method: 'wallet' | 'upi' | 'cod' | 'credits';
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial_refund';
  transactionId?: string;
  paidAt?: string;
}

export interface OrderDeliveryAddress {
  building: string;
  floor?: string;
  roomNumber: string;
  landmark?: string;
  coordinates?: { lat: number; lng: number };
}

export interface OrderTimestamps {
  placedAt: string;
  confirmedAt?: string;
  readyAt?: string;
  courierAssignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

export interface OrderRating {
  food?: number;
  delivery?: number;
  review?: string;
  ratedAt?: string;
}

export interface OrderEarnings {
  studentCreditsEarned: number;
  courierFee: number;
  restaurantPayout: number;
  platformRevenue: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  student: User;
  restaurant: Restaurant;
  courier?: User;
  items: OrderItem[];
  pricing: OrderPricing;
  payment: OrderPayment;
  status: OrderStatus;
  cancelledBy?: CancelledBy;
  cancellationReason?: string;
  cancellationFee: number;
  pickupCode: string;
  deliveryCode: string;
  deliveryAddress: OrderDeliveryAddress;
  timestamps: OrderTimestamps;
  rating: OrderRating;
  earnings: OrderEarnings;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usageLimitPerUser: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  applicableRestaurants: string[];
  isActive: boolean;
}

export type TransactionType = 
  | 'wallet_topup'
  | 'wallet_deduction'
  | 'wallet_refund'
  | 'credits_earned'
  | 'credits_spent'
  | 'credits_expired'
  | 'courier_earning'
  | 'courier_payout'
  | 'restaurant_payout'
  | 'platform_fee'
  | 'referral_bonus'
  | 'first_order_bonus';

export interface Transaction {
  id: string;
  user: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  creditsBalanceAfter?: number;
  reference: {
    id: string;
    model: 'Order' | 'User' | 'Coupon' | 'ManualPayout' | 'WithdrawalRequest';
  };
  description: string;
  status: 'completed' | 'failed' | 'reversed';
  metadata?: Record<string, any>;
  createdAt: string;
}

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

export interface Notification {
  id: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high';
  readAt?: string;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  user: User;
  type: 'courier' | 'restaurant';
  amount: number;
  bankDetails: {
    upiId?: string;
    accountNumber?: string;
    ifsc?: string;
    accountHolderName?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  processedAt?: string;
  processedBy?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
    requestId: string;
  };
  meta: { timestamp: string };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface Address {
  id: string;
  building: string;
  floor?: string;
  roomNumber: string;
  landmark?: string;
  coordinates?: { lat: number; lng: number };
  isDefault: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  specialInstructions?: string;
}