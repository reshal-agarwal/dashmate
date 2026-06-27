'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Form';
import { StudentLayout } from '@/components/layout';
import { cn } from '@/lib/utils';
import { Order, OrderStatus, OrderRating } from '@/types';
import {
  Package,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle2,
  ChevronLeft,
  Star,
  XCircle,
  AlertCircle,
  RotateCcw,
  User,
  Store,
  ChefHat,
  Bike,
  MapPinned,
  Timer,
} from 'lucide-react';

const STATUS_FLOW: OrderStatus[] = [
  'placed', 'confirmed', 'preparing', 'ready', 'courier_assigned', 'picked_up', 'delivered',
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  courier_assigned: 'Courier Assigned',
  picked_up: 'Picked Up',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

const STATUS_ICONS: Record<OrderStatus, typeof Clock> = {
  placed: Clock,
  confirmed: CheckCircle2,
  preparing: ChefHat,
  ready: Package,
  courier_assigned: Bike,
  picked_up: MapPinned,
  delivered: CheckCircle2,
  cancelled: XCircle,
  disputed: AlertCircle,
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  placed: 'text-blue-500 border-blue-400',
  confirmed: 'text-indigo-500 border-indigo-400',
  preparing: 'text-yellow-500 border-yellow-400',
  ready: 'text-orange-500 border-orange-400',
  courier_assigned: 'text-purple-500 border-purple-400',
  picked_up: 'text-cyan-500 border-cyan-400',
  delivered: 'text-green-500 border-green-400',
  cancelled: 'text-red-500 border-red-400',
  disputed: 'text-gray-500 border-gray-400',
};

const STATUS_BG: Record<OrderStatus, string> = {
  placed: 'bg-blue-50',
  confirmed: 'bg-indigo-50',
  preparing: 'bg-yellow-50',
  ready: 'bg-orange-50',
  courier_assigned: 'bg-purple-50',
  picked_up: 'bg-cyan-50',
  delivered: 'bg-green-50',
  cancelled: 'bg-red-50',
  disputed: 'bg-gray-50',
};

const CANCELLABLE_STATUSES: OrderStatus[] = ['placed', 'confirmed', 'preparing'];

function StatusTimeline({ order }: { order: Order }) {
  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h3 className="font-semibold text-gray-900 mb-4">Order Progress</h3>
      <div className="space-y-0">
        {STATUS_FLOW.map((status, index) => {
          const Icon = STATUS_ICONS[status];
          const isCompleted = index <= currentIndex && !isCancelled;
          const isCurrent = index === currentIndex && !isCancelled;
          const isPending = index > currentIndex || isCancelled;

          const timestampKey = `${status}At` as keyof typeof order.timestamps;
          const timestamp = order.timestamps[timestampKey];

          return (
            <div key={status} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border-2',
                    isCompleted ? STATUS_COLORS[status] : 'border-gray-300 text-gray-400',
                    isCurrent && 'ring-2 ring-offset-2 ring-primary-500'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {index < STATUS_FLOW.length - 1 && (
                  <div
                    className={cn(
                      'w-0.5 h-8',
                      isCompleted && !isCancelled ? 'bg-primary-500' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
              <div className={cn('pb-6', isPending && 'opacity-40')}>
                <p
                  className={cn(
                    'text-sm font-medium',
                    isCurrent ? 'text-primary-700' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                  )}
                >
                  {STATUS_LABELS[status]}
                </p>
                {timestamp && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(timestamp).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {isCancelled && (
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-red-400 text-red-500 bg-red-50">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-red-700">Cancelled</p>
              {order.timestamps.cancelledAt && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(order.timestamps.cancelledAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
              {order.cancellationReason && (
                <p className="text-xs text-gray-500 mt-1">Reason: {order.cancellationReason}</p>
              )}
              {order.cancelledBy && (
                <p className="text-xs text-gray-500">Cancelled by: {order.cancelledBy}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RatingForm({ orderId, onRated }: { orderId: string; onRated: () => void }) {
  const [rating, setRating] = useState<OrderRating>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!rating.food && !rating.delivery) {
      setError('Please rate at least food or delivery');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/orders/${orderId}/rate`, rating);
      if (res.data.success) {
        onRated();
      }
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h3 className="font-semibold text-gray-900 mb-4">Rate Your Order</h3>

      <div className="space-y-4">
        <div>
          <Label>Food Rating</Label>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating((prev) => ({ ...prev, food: star }))}
                className="p-1"
              >
                <Star
                  className={cn(
                    'w-6 h-6 transition-colors',
                    (rating.food || 0) >= star
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Delivery Rating</Label>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating((prev) => ({ ...prev, delivery: star }))}
                className="p-1"
              >
                <Star
                  className={cn(
                    'w-6 h-6 transition-colors',
                    (rating.delivery || 0) >= star
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Review (optional)</Label>
          <Textarea
            placeholder="Share your experience..."
            value={rating.review || ''}
            onChange={(e) => setRating((prev) => ({ ...prev, review: e.target.value }))}
            rows={3}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button onClick={handleSubmit} loading={loading} size="full">
          Submit Rating
        </Button>
      </div>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [rated, setRated] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api.get(`/orders/${params.id}`);
      const data = res.data;
      if (data.success) {
        setOrder(data.data);
        setRated(!!data.data.rating?.ratedAt);
      }
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      const res = await api.post(`/orders/${params.id}/cancel`);
      if (res.data.success) {
        await fetchOrder();
      }
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout title="Order Details" showBack>
        <OrderDetailSkeleton />
      </StudentLayout>
    );
  }

  if (error || !order) {
    return (
      <StudentLayout title="Order Details" showBack>
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-500 text-center">{error || 'Order not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/orders')}>
            Back to Orders
          </Button>
        </div>
      </StudentLayout>
    );
  }

  const isCancellable = CANCELLABLE_STATUSES.includes(order.status);
  const isDelivered = order.status === 'delivered';
  const canRate = isDelivered && !rated;

  return (
    <StudentLayout title={`#${order.orderNumber}`} showBack>
      <div className="space-y-4 pb-8">
        <div className={cn('rounded-xl p-4', STATUS_BG[order.status])}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{order.restaurant.name}</h2>
              <p className="text-sm text-gray-600 mt-0.5">
                {STATUS_LABELS[order.status]}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-mono">#{order.orderNumber}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(order.timestamps.placedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
          {isCancellable && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleCancel}
              loading={cancelling}
            >
              Cancel Order
            </Button>
          )}
        </div>

        <StatusTimeline order={order} />

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            Items
          </h3>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">{item.quantity}x</span>
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                  </div>
                  {item.specialInstructions && (
                    <p className="text-xs text-gray-500 mt-0.5 ml-7">{item.specialInstructions}</p>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-900 ml-2">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Pricing</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-700">₹{order.pricing.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Delivery Fee</span>
              <span className="text-gray-700">₹{order.pricing.deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Platform Fee</span>
              <span className="text-gray-700">₹{order.pricing.platformFee.toFixed(2)}</span>
            </div>
            {order.pricing.discount > 0 && (
              <div className="flex items-center justify-between text-green-600">
                <span>Discount</span>
                <span>-₹{order.pricing.discount.toFixed(2)}</span>
              </div>
            )}
            {order.pricing.creditsApplied > 0 && (
              <div className="flex items-center justify-between text-green-600">
                <span>Credits Applied</span>
                <span>-₹{order.pricing.creditsApplied.toFixed(2)}</span>
              </div>
            )}
          </div>
          <hr className="my-3 border-gray-100" />
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-bold text-lg text-gray-900">
              ₹{order.pricing.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            Delivery Address
          </h3>
          <div className="text-sm text-gray-700 space-y-0.5">
            <p>{order.deliveryAddress.building}</p>
            {order.deliveryAddress.floor && <p>Floor: {order.deliveryAddress.floor}</p>}
            <p>Room: {order.deliveryAddress.roomNumber}</p>
            {order.deliveryAddress.landmark && <p>{order.deliveryAddress.landmark}</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-400" />
            Payment
          </h3>
          <div className="text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Method</span>
              <span className="text-gray-700 capitalize">{order.payment.method}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status</span>
              <span className={cn(
                'capitalize font-medium',
                order.payment.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
              )}>
                {order.payment.status}
              </span>
            </div>
            {order.payment.transactionId && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Transaction ID</span>
                <span className="text-gray-700 text-xs font-mono">{order.payment.transactionId}</span>
              </div>
            )}
          </div>
        </div>

        {order.courier && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Bike className="w-4 h-4 text-gray-400" />
              Courier
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{order.courier.name}</p>
                <p className="text-sm text-gray-500">{order.courier.phone}</p>
              </div>
            </div>
          </div>
        )}

        {canRate && (
          <RatingForm orderId={order.id} onRated={() => setRated(true)} />
        )}

        {rated && order.rating?.ratedAt && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Your Rating</h3>
            <div className="flex items-center gap-4 text-sm">
              {order.rating.food && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Food:</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          'w-4 h-4',
                          (order.rating?.food || 0) >= star
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
              {order.rating.delivery && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Delivery:</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          'w-4 h-4',
                          (order.rating?.delivery || 0) >= star
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            {order.rating.review && (
              <p className="text-sm text-gray-600 mt-2">{order.rating.review}</p>
            )}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}


