'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { StudentLayout } from '@/components/layout';
import { getStudentSocket, subscribeToOrder, unsubscribeFromOrder } from '@/lib/socket';
import { Order } from '@/types';
import { Bike, MapPin, Navigation, AlertCircle } from 'lucide-react';

interface CourierLocation {
  courierId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
}

const STATUS_MSG: Record<string, string> = {
  courier_assigned: 'Courier is on the way to restaurant',
  picked_up: 'Courier picked up your order — heading your way',
  delivered: 'Order delivered!',
};

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<CourierLocation | null>(null);
  const [error, setError] = useState('');

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api.get(`/orders/${params.id}`);
      if (res.data.success) setOrder(res.data.data);
    } catch {
      setError('Could not load order');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  useEffect(() => {
    if (!params.id) return;
    subscribeToOrder(params.id as string);
    const socket = getStudentSocket();
    if (!socket) return;

    socket.on('courier:location', (data: CourierLocation) => setLocation(data));
    socket.on('order:status', () => fetchOrder());

    return () => {
      unsubscribeFromOrder(params.id as string);
      socket.off('courier:location');
      socket.off('order:status');
    };
  }, [params.id, fetchOrder]);

  if (loading) {
    return (
      <StudentLayout title="Track Order" showBack>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </StudentLayout>
    );
  }

  if (error || !order) {
    return (
      <StudentLayout title="Track Order" showBack>
        <div className="flex flex-col items-center py-20 px-4">
          <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
          <p className="text-gray-500">{error || 'Order not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/orders')}>
            Back to Orders
          </Button>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Track Order" showBack>
      <div className="space-y-4 pb-8">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-5 h-5" />
            <h2 className="font-semibold">Order #{order.orderNumber}</h2>
          </div>
          <p className="text-primary-100 text-sm">
            {STATUS_MSG[order.status] || order.status.replace(/_/g, ' ')}
          </p>
          {location && (
            <div className="mt-3 flex items-center gap-4 text-sm text-primary-100">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </span>
              {location.speed && <span>{Math.round(location.speed * 3.6)} km/h</span>}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Bike className="w-4 h-4 text-gray-400" />
            Courier
          </h3>
          {order.courier ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <Bike className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{order.courier.name}</p>
                <p className="text-sm text-gray-500">{order.courier.phone}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Looking for a courier...</p>
          )}
        </div>

        {!location && order.status !== 'delivered' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-center gap-2">
            <Navigation className="w-4 h-4 shrink-0" />
            Waiting for courier location updates...
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
