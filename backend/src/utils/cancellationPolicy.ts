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

export interface CancellationCompensation {
  student: number;      // Amount student pays (negative = receives)
  courier: number;      // Amount courier receives (negative = penalty)
  restaurant: number;   // Amount restaurant pays (negative = receives)
  platform: number;     // Platform revenue/loss
  studentRefund: number; // Refund to student wallet
  courierPayout: number; // Payout to courier
  restaurantPayout: number; // Payout to restaurant
}

const POLICY: Record<string, CancellationCompensation> = {
  'student@placed': { student: 0, courier: 0, restaurant: 0, platform: 0, studentRefund: 1, courierPayout: 0, restaurantPayout: 0 },
  'student@confirmed': { student: 0, courier: 0, restaurant: 0, platform: 0, studentRefund: 1, courierPayout: 0, restaurantPayout: 0 },
  'student@preparing': { student: 0, courier: 0, restaurant: 0, platform: 0, studentRefund: 1, courierPayout: 0, restaurantPayout: 0 },
  'student@ready': { student: 0.5, courier: 0, restaurant: -0.5, platform: 0, studentRefund: 0.5, courierPayout: 0, restaurantPayout: 0.5 },
  'student@courier_assigned': { student: 0.5, courier: -20, restaurant: -0.5, platform: 0, studentRefund: 0.5, courierPayout: 20, restaurantPayout: 0.5 },
  'student@picked_up': { student: 1, courier: -1, restaurant: -1, platform: 0, studentRefund: 0, courierPayout: 1, restaurantPayout: 1 },

  'restaurant@placed': { student: 0, courier: 0, restaurant: 0, platform: 0, studentRefund: 1, courierPayout: 0, restaurantPayout: 0 },
  'restaurant@confirmed': { student: 0, courier: 0, restaurant: -20, platform: 20, studentRefund: 1, courierPayout: 20, restaurantPayout: 0 },
  'restaurant@preparing': { student: 0, courier: 0, restaurant: -1, platform: 0, studentRefund: 1, courierPayout: 0, restaurantPayout: 1 },
  'restaurant@ready': { student: 0, courier: -30, restaurant: -1.3, platform: 30, studentRefund: 1, courierPayout: 30, restaurantPayout: 1.3 },
  'restaurant@courier_assigned': { student: 0, courier: -30, restaurant: -1.3, platform: -30, studentRefund: 1, courierPayout: 30, restaurantPayout: 1.3 },

  'courier@courier_assigned': { student: 0, courier: 10, restaurant: 0, platform: -10, studentRefund: 1, courierPayout: 0, restaurantPayout: 0 },
  'courier@picked_up': { student: -1, courier: 50, restaurant: -1, platform: 0, studentRefund: 1, courierPayout: 0, restaurantPayout: 1 },

  'system@no_restaurant_response': { student: -0.2, courier: 0, restaurant: -20, platform: 20, studentRefund: 1.2, courierPayout: 0, restaurantPayout: 0 },
  'system@no_courier_15min': { student: -0.2, courier: 0, restaurant: -20, platform: 20, studentRefund: 1.2, courierPayout: 0, restaurantPayout: 0 },
};

function calculateAmounts(
  base: CancellationCompensation,
  orderTotal: number,
  deliveryFee: number,
  foodCost: number
): CancellationCompensation {
  return {
    student: base.student > 1 ? base.student : base.student * orderTotal,
    courier: base.courier,
    restaurant: base.restaurant > 1 ? base.restaurant : 
      base.restaurant < 0 ? Math.abs(base.restaurant) * foodCost : base.restaurant * orderTotal,
    platform: base.platform,
    studentRefund: base.studentRefund > 1 ? base.studentRefund : base.studentRefund * orderTotal,
    courierPayout: base.courierPayout,
    restaurantPayout: base.restaurantPayout > 1 ? base.restaurantPayout : 
      base.restaurantPayout < 0 ? Math.abs(base.restaurantPayout) * foodCost : base.restaurantPayout * orderTotal,
  };
}

export function getCancellationPolicy(
  cancelledBy: CancelledBy,
  status: OrderStatus,
  orderTotal: number,
  deliveryFee: number,
  foodCost: number
): CancellationCompensation {
  const key = `${cancelledBy}@${status}`;
  const base = POLICY[key] || POLICY[`${cancelledBy}@placed`] || { 
    student: 0, courier: 0, restaurant: 0, platform: 0, 
    studentRefund: 1, courierPayout: 0, restaurantPayout: 0 
  };
  return calculateAmounts(base, orderTotal, deliveryFee, foodCost);
}

export function canCancel(cancelledBy: CancelledBy, status: OrderStatus): boolean {
  const allowed: Record<CancelledBy, OrderStatus[]> = {
    student: ['placed', 'confirmed', 'preparing', 'ready', 'courier_assigned'],
    restaurant: ['placed', 'confirmed', 'preparing', 'ready', 'courier_assigned'],
    courier: ['courier_assigned', 'picked_up'],
    admin: ['placed', 'confirmed', 'preparing', 'ready', 'courier_assigned', 'picked_up', 'delivered'],
    system: ['placed', 'confirmed', 'preparing', 'ready', 'courier_assigned'],
  };
  return allowed[cancelledBy]?.includes(status) ?? false;
}

export function getNextStatus(current: OrderStatus, action: string): OrderStatus | null {
  const transitions: Record<OrderStatus, Record<string, OrderStatus>> = {
    placed: { confirm: 'confirmed', cancel: 'cancelled' },
    confirmed: { start_prep: 'preparing', cancel: 'cancelled' },
    preparing: { ready: 'ready', cancel: 'cancelled' },
    ready: { assign_courier: 'courier_assigned', cancel: 'cancelled' },
    courier_assigned: { pickup: 'picked_up', cancel: 'cancelled' },
    picked_up: { deliver: 'delivered', cancel: 'cancelled', dispute: 'disputed' },
    delivered: {},
    cancelled: {},
    disputed: { resolve: 'delivered' },
  };
  return transitions[current]?.[action] ?? null;
}

export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['courier_assigned', 'cancelled'],
  courier_assigned: ['picked_up', 'cancelled'],
  picked_up: ['delivered', 'cancelled', 'disputed'],
  delivered: [],
  cancelled: [],
  disputed: ['delivered'],
};

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}