'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { StudentLayout } from '@/components/layout';
import { cn } from '@/lib/utils';
import { Order, OrderStatus } from '@/types';
import {
  ClipboardList,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';

const TABS = [
  { key: '', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
] as const;

const ACTIVE_STATUSES: OrderStatus[] = [
  'placed', 'confirmed', 'preparing', 'ready', 'courier_assigned', 'picked_up',
];

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  placed: { label: 'Placed', color: 'text-blue-700', bg: 'bg-blue-50' },
  confirmed: { label: 'Confirmed', color: 'text-indigo-700', bg: 'bg-indigo-50' },
  preparing: { label: 'Preparing', color: 'text-yellow-700', bg: 'bg-yellow-50' },
  ready: { label: 'Ready', color: 'text-orange-700', bg: 'bg-orange-50' },
  courier_assigned: { label: 'Courier Assigned', color: 'text-purple-700', bg: 'bg-purple-50' },
  picked_up: { label: 'Picked Up', color: 'text-cyan-700', bg: 'bg-cyan-50' },
  delivered: { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-50' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50' },
  disputed: { label: 'Disputed', color: 'text-gray-700', bg: 'bg-gray-50' },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.color, config.bg)}>
      {config.label}
    </span>
  );
}

function OrderCard({ order }: { order: Order }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/orders/${order.id}`)}
      className="w-full bg-white rounded-xl border border-gray-100 p-4 text-left hover:border-gray-200 transition-colors shadow-sm"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs text-gray-500 font-mono">#{order.orderNumber}</p>
          <h3 className="font-semibold text-gray-900 mt-0.5">{order.restaurant.name}</h3>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {new Date(order.timestamps.placedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-semibold text-gray-900">
            ₹{order.pricing.totalAmount.toFixed(2)}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </button>
  );
}

function OrderSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
      <div className="flex items-start justify-between mb-2">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-3">
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <div className="h-3 w-16 bg-gray-200 rounded" />
        </div>
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  const fetchOrders = useCallback(async (pageNum: number, append = false) => {
    try {
      const statusParam = activeTab === 'active'
        ? ACTIVE_STATUSES.join(',')
        : activeTab || undefined;

      const res = await api.get('/orders', {
        params: { status: statusParam, page: pageNum, limit },
      });

      const data = res.data;
      if (data.success) {
        const newOrders = data.data.items || data.data;
        setOrders((prev) => (append ? [...prev, ...newOrders] : newOrders));
        setHasMore(data.data.pagination?.page < data.data.pagination?.totalPages);
      }
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    setOrders([]);
    setPage(1);
    fetchOrders(1);
  }, [fetchOrders]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const filteredOrders = orders;

  if (error) {
    return (
      <StudentLayout title="Orders">
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-500 text-center">{error}</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Orders">
      <div className="sticky top-0 z-10 -mx-4 px-4 bg-gray-50 pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 pb-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <OrderSkeleton key={i} />)
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ClipboardList className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 text-center mb-6">
              {activeTab ? 'No orders in this category' : 'Place your first order to get started'}
            </p>
            <Button onClick={() => window.location.href = '/restaurants'}>
              Browse Restaurants
            </Button>
          </div>
        ) : (
          <>
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
            {hasMore && (
              <Button
                variant="outline"
                size="full"
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  fetchOrders(nextPage, true);
                }}
              >
                Load More
              </Button>
            )}
          </>
        )}
      </div>
    </StudentLayout>
  );
}
