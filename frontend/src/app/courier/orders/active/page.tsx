'use client';

import { useState, useEffect } from 'react';
import { api, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { CourierLayout } from '@/components/layout';
import { Order } from '@/types';
import { Truck, Package, MapPin, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export default function ActiveOrderPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [pickupCode, setPickupCode] = useState('');
  const [deliveryCode, setDeliveryCode] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState('');

  const fetchOrder = async () => {
    try {
      const res = await api.get('/courier/orders/active');
      setOrder(res.data.data);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, []);

  const handleAction = async (action: string, body?: any) => {
    if (!order) return;
    setActionLoading(action);
    setError('');
    try {
      await api.post(`/courier/orders/${order.id}/${action}`, body);
      if (action === 'deliver' || action === 'cancel') {
        setOrder(null);
      } else {
        fetchOrder();
      }
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <CourierLayout title="Active Order" showBack backHref="/courier">
        <div className="p-4 animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-24 bg-gray-200 rounded-xl" />
        </div>
      </CourierLayout>
    );
  }

  if (!order) {
    return (
      <CourierLayout title="Active Order" showBack backHref="/courier">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <Package className="w-12 h-12 text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">No Active Order</h2>
          <p className="text-sm text-gray-500 mb-4">Check available orders to start delivering</p>
          <Button onClick={() => window.location.href = '/courier/orders/available'}>Browse Orders</Button>
        </div>
      </CourierLayout>
    );
  }

  return (
    <CourierLayout title="Active Order" showBack backHref="/courier">
      <div className="p-4 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">#{order.orderNumber}</h2>
            <span className="text-xs font-medium px-2 py-1 bg-primary-50 text-primary-700 rounded-full capitalize">
              {order.status.replace('_', ' ')}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>{item.name} x{item.quantity}</span>
                <span className="font-medium">₹{item.price * item.quantity}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>₹{order.pricing.totalAmount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-600" /> Delivery Details
          </h3>
          <p className="text-sm text-gray-600">
            {order.restaurant?.name} &rarr; {order.deliveryAddress.building}, {order.deliveryAddress.roomNumber}
          </p>
        </div>

        {order.status === 'courier_assigned' && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Pickup Code</label>
              <input type="text" maxLength={4} value={pickupCode}
                onChange={e => setPickupCode(e.target.value)}
                className="w-full text-center text-2xl tracking-widest rounded-lg border border-gray-300 px-4 py-3"
                placeholder="_ _ _ _"
              />
            </div>
            <Button size="full" onClick={() => handleAction('pickup', { code: pickupCode })}
              loading={actionLoading === 'pickup'} disabled={pickupCode.length !== 4}>
              <Package className="w-4 h-4" /> Confirm Pickup
            </Button>
          </div>
        )}

        {order.status === 'picked_up' && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Delivery Code</label>
              <input type="text" maxLength={4} value={deliveryCode}
                onChange={e => setDeliveryCode(e.target.value)}
                className="w-full text-center text-2xl tracking-widest rounded-lg border border-gray-300 px-4 py-3"
                placeholder="_ _ _ _"
              />
            </div>
            <Button size="full" variant="success" onClick={() => handleAction('deliver', { code: deliveryCode })}
              loading={actionLoading === 'deliver'} disabled={deliveryCode.length !== 4}>
              <CheckCircle2 className="w-4 h-4" /> Mark as Delivered
            </Button>
          </div>
        )}

        <details className="bg-white rounded-xl p-4 border border-gray-100">
          <summary className="text-sm font-medium text-red-600 cursor-pointer">Cancel Order</summary>
          <div className="mt-3 space-y-2">
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={2}
            />
            <Button size="full" variant="danger" onClick={() => handleAction('cancel', { reason: cancelReason })}
              loading={actionLoading === 'cancel'} disabled={cancelReason.length < 5}>
              <XCircle className="w-4 h-4" /> Cancel Order
            </Button>
          </div>
        </details>
      </div>
    </CourierLayout>
  );
}
