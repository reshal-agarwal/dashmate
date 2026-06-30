'use client';

import { useState, useEffect } from 'react';
import { api, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { CourierLayout } from '@/components/layout';
import { Order } from '@/types';
import { cn } from '@/lib/utils';
import { MapPin, Clock, AlertCircle, ChevronRight } from 'lucide-react';

export default function AvailableOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  const fetchOrders = async (p: number) => {
    try {
      const res = await api.get(`/courier/orders/available?page=${p}&limit=10`);
      setOrders(prev => p === 1 ? res.data.data.items : [...prev, ...res.data.data.items]);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(1); }, []);

  const handleAccept = async (orderId: string) => {
    setAccepting(orderId);
    try {
      await api.post(`/courier/orders/${orderId}/accept`);
      window.location.href = '/courier/orders/active';
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setAccepting(null);
    }
  };

  return (
    <CourierLayout title="Available Orders" showBack backHref="/courier">
      <div className="p-4 space-y-3">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />
          ))
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No orders available right now</p>
            <p className="text-sm">Check back soon!</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{order.restaurant?.name}</h3>
                  <p className="text-xs text-gray-500">#{order.orderNumber}</p>
                </div>
                <span className="text-lg font-bold text-primary-600">₹{order.pricing.totalAmount}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <MapPin className="w-3 h-3" />
                {order.deliveryAddress.building}, {order.deliveryAddress.roomNumber}
              </div>

              <div className="flex gap-1 flex-wrap mb-3">
                {order.items.slice(0, 3).map((item, i) => (
                  <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded-full">{item.name}</span>
                ))}
                {order.items.length > 3 && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">+{order.items.length - 3}</span>
                )}
              </div>

              <Button size="sm" className="w-full" onClick={() => handleAccept(order.id)}
                loading={accepting === order.id}>
                Accept Delivery
              </Button>
            </div>
          ))
        )}

        {page < totalPages && (
          <Button variant="outline" size="full" onClick={() => { setPage(p => p + 1); fetchOrders(page + 1); }}>
            Load More
          </Button>
        )}
      </div>
    </CourierLayout>
  );
}
