'use client';

import { useState, useEffect } from 'react';
import { api, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { CourierLayout } from '@/components/layout';
import { Order, OrderStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Truck, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

const STATUS = [
  { key: '', label: 'All' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async (p: number, s: string) => {
    try {
      const res = await api.get(`/courier/orders/history?page=${p}&limit=10${s ? `&status=${s}` : ''}`);
      setOrders(prev => p === 1 ? res.data.data.items : [...prev, ...res.data.data.items]);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (err) {
      console.error(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); fetchOrders(1, status); }, [status]);

  return (
    <CourierLayout title="Order History" showBack backHref="/courier">
      <div className="sticky top-16 bg-gray-50 z-10 px-4 pt-3 pb-2">
        <div className="flex gap-2">
          {STATUS.map(s => (
            <button key={s.key} onClick={() => setStatus(s.key)}
              className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                status === s.key ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
              )}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No orders found</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
                {order.status === 'delivered' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{order.restaurant?.name}</span>
                <span>₹{order.pricing.totalAmount}</span>
              </div>
            </div>
          ))
        )}

        {page < totalPages && (
          <Button variant="outline" size="full" onClick={() => { setPage(p => p + 1); fetchOrders(page + 1, status); }}>
            Load More
          </Button>
        )}
      </div>
    </CourierLayout>
  );
}
