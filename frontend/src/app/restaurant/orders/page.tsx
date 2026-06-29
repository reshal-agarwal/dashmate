'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store';
import { RestaurantLayout } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Order, OrderStatus } from '@/types';
import {
  Package,
  AlertCircle,
  Clock,
  ChevronRight,
  RefreshCw,
  XCircle,
  CheckCircle2,
  ChefHat,
  ClipboardCheck,
  IndianRupee,
} from 'lucide-react';

const KANBAN_STATUSES: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'placed', label: 'New' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  placed: { label: 'New', color: 'text-blue-700', bg: 'bg-blue-50' },
  confirmed: { label: 'Confirmed', color: 'text-indigo-700', bg: 'bg-indigo-50' },
  preparing: { label: 'Preparing', color: 'text-yellow-700', bg: 'bg-yellow-50' },
  ready: { label: 'Ready', color: 'text-orange-700', bg: 'bg-orange-50' },
  courier_assigned: { label: 'Courier Assigned', color: 'text-purple-700', bg: 'bg-purple-50' },
  picked_up: { label: 'Picked Up', color: 'text-cyan-700', bg: 'bg-cyan-50' },
  delivered: { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-50' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50' },
  disputed: { label: 'Disputed', color: 'text-gray-700', bg: 'bg-gray-50' },
};

export default function RestaurantOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { limit: 50 };
      if (activeFilter !== 'all') params.status = activeFilter;
      const res = await api.get<{ success: boolean; data: { items: Order[] } }>('/restaurant/orders', { params });
      setOrders(res.data.data.items);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchOrders();
  }, [isAuthenticated, fetchOrders, router]);

  const handleAction = async (orderId: string, action: string) => {
    setActionLoading(orderId);
    try {
      await api.put(`/restaurant/orders/${orderId}/${action}`);
      fetchOrders();
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setActionLoading(null);
    }
  };

  const getActions = (order: Order) => {
    switch (order.status) {
      case 'placed': return [{ key: 'confirm', label: 'Confirm', icon: ClipboardCheck, color: 'bg-indigo-500' }];
      case 'confirmed': return [{ key: 'start-prep', label: 'Start Prep', icon: ChefHat, color: 'bg-yellow-500' }];
      case 'preparing': return [{ key: 'ready', label: 'Mark Ready', icon: CheckCircle2, color: 'bg-green-500' }];
      default: return [];
    }
  };

  if (!isAuthenticated) return null;

  return (
    <RestaurantLayout title="Orders">
      <div className="p-4 space-y-4">
        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
          {KANBAN_STATUSES.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveFilter(s.key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                activeFilter === s.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><RefreshCw className="w-4 h-4" /></button>
          </div>
        )}

        {/* Orders List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-100 p-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const config = STATUS_CONFIG[order.status];
              const actions = getActions(order);
              return (
                <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs text-gray-500 font-mono">#{order.orderNumber}</p>
                      <p className="text-sm text-gray-700 mt-0.5">
                        {order.student && typeof order.student === 'object'
                          ? `${order.student.name} · ${order.student.roomNumber || ''} ${order.student.hostelBlock || ''}`
                          : 'Student'}
                      </p>
                    </div>
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', config.color, config.bg)}>
                      {config.label}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    {order.items.slice(0, 3).map((item, i) => (
                      <p key={i} className="flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span>₹{item.price * item.quantity}</span>
                      </p>
                    ))}
                    {order.items.length > 3 && <p className="text-xs text-gray-400">+{order.items.length - 3} more items</p>}
                    <div className="flex justify-between font-medium text-gray-900 pt-1 border-t border-gray-100 mt-1">
                      <span>Total</span>
                      <span>₹{order.pricing.totalAmount}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    {actions.map((action) => (
                      <Button
                        key={action.key}
                        variant="primary"
                        size="sm"
                        loading={actionLoading === order.id}
                        onClick={() => handleAction(order.id, action.key)}
                        className={cn('text-xs', action.color)}
                      >
                        <action.icon className="w-3.5 h-3.5" />
                        {action.label}
                      </Button>
                    ))}
                    {(order.status === 'placed' || order.status === 'confirmed' || order.status === 'preparing') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const reason = prompt('Cancellation reason:');
                          if (reason !== null) handleAction(order.id, 'cancel');
                        }}
                        className="text-red-500 hover:bg-red-50 ml-auto"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel
                      </Button>
                    )}
                    <button
                      onClick={() => router.push(`/restaurant/orders/${order.id}`)}
                      className="ml-2 p-1.5 rounded-lg hover:bg-gray-100"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RestaurantLayout>
  );
}
