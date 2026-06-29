'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store';
import { RestaurantLayout } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Order } from '@/types';
import {
  AlertCircle,
  ChevronLeft,
  ClipboardCheck,
  ChefHat,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Clock,
  MapPin,
  User,
  Phone,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  placed: { label: 'New Order', color: 'text-blue-700 bg-blue-50' },
  confirmed: { label: 'Confirmed', color: 'text-indigo-700 bg-indigo-50' },
  preparing: { label: 'Preparing', color: 'text-yellow-700 bg-yellow-50' },
  ready: { label: 'Ready', color: 'text-orange-700 bg-orange-50' },
  courier_assigned: { label: 'Courier Assigned', color: 'text-purple-700 bg-purple-50' },
  picked_up: { label: 'Picked Up', color: 'text-cyan-700 bg-cyan-50' },
  delivered: { label: 'Delivered', color: 'text-green-700 bg-green-50' },
  cancelled: { label: 'Cancelled', color: 'text-red-700 bg-red-50' },
  disputed: { label: 'Disputed', color: 'text-gray-700 bg-gray-50' },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    const fetchOrder = async () => {
      try {
        const res = await api.get<{ success: boolean; data: Order }>(`/restaurant/orders/${params.id}`);
        setOrder(res.data.data);
      } catch (err) {
        setError(handleApiError(err).message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [isAuthenticated, params.id, router]);

  const handleAction = async (action: string) => {
    if (!order) return;
    setActionLoading(true);
    try {
      await api.put(`/restaurant/orders/${order.id}/${action}`);
      const res = await api.get<{ success: boolean; data: Order }>(`/restaurant/orders/${order.id}`);
      setOrder(res.data.data);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <RestaurantLayout title="Order Detail" showBack>
        <div className="p-4 space-y-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-32 bg-gray-200 rounded-xl" />
        </div>
      </RestaurantLayout>
    );
  }

  if (error || !order) {
    return (
      <RestaurantLayout title="Order Detail" showBack>
        <div className="flex flex-col items-center py-20">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-gray-500">{error || 'Order not found'}</p>
        </div>
      </RestaurantLayout>
    );
  }

  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed;

  return (
    <RestaurantLayout title={`Order #${order.orderNumber}`} showBack>
      <div className="p-4 space-y-4">
        {/* Status Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-sm font-medium', config.color)}>
              {config.label}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(order.timestamps.placedAt).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {['placed', 'confirmed', 'preparing', 'ready'].map((step, i) => {
              const statuses: Record<string, number> = { placed: 0, confirmed: 1, preparing: 2, ready: 3 };
              const currentIdx = statuses[order.status] ?? 0;
              const stepIdx = statuses[step] ?? 0;
              return (
                <div key={step} className="flex items-center gap-2">
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold', stepIdx <= currentIdx ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400')}>
                    {i + 1}
                  </div>
                  {stepIdx < 3 && <div className={cn('w-8 h-0.5', stepIdx < currentIdx ? 'bg-primary-600' : 'bg-gray-200')} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.quantity}x {item.name}</span>
                <span className="font-medium text-gray-900">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{order.pricing.subtotal}</span></div>
            {order.pricing.deliveryFee > 0 && <div className="flex justify-between text-gray-500"><span>Delivery</span><span>₹{order.pricing.deliveryFee}</span></div>}
            {order.pricing.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.pricing.discount}</span></div>}
            <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100">
              <span>Total</span><span>₹{order.pricing.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        {order.student && typeof order.student === 'object' && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> Student Details
            </h3>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">{order.student.name}</p>
              <p className="text-gray-500 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {order.student.phone}</p>
              <p className="text-gray-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {order.deliveryAddress.building}, {order.deliveryAddress.roomNumber}</p>
            </div>
          </div>
        )}

        {/* Courier Info */}
        {order.courier && typeof order.courier === 'object' && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Courier</h3>
            <p className="text-sm text-gray-700">{order.courier.name} · {order.courier.phone}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {order.status === 'placed' && (
            <Button variant="primary" size="full" loading={actionLoading} onClick={() => handleAction('confirm')}>
              <ClipboardCheck className="w-4 h-4" /> Confirm Order
            </Button>
          )}
          {order.status === 'confirmed' && (
            <Button variant="primary" size="full" loading={actionLoading} onClick={() => handleAction('start-prep')}>
              <ChefHat className="w-4 h-4" /> Start Preparation
            </Button>
          )}
          {order.status === 'preparing' && (
            <Button variant="primary" size="full" loading={actionLoading} onClick={() => handleAction('ready')}>
              <CheckCircle2 className="w-4 h-4" /> Mark Ready
            </Button>
          )}
          {(order.status === 'placed' || order.status === 'confirmed' || order.status === 'preparing') && (
            <Button variant="outline" size="full" onClick={() => handleAction('cancel')} className="text-red-500 border-red-200 hover:bg-red-50">
              <XCircle className="w-4 h-4" /> Cancel Order
            </Button>
          )}
        </div>
      </div>
    </RestaurantLayout>
  );
}
