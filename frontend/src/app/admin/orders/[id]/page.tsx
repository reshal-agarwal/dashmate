'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Form';
import { ShoppingBag, ArrowLeft, AlertCircle, RotateCcw } from 'lucide-react';

interface OrderDetail {
  _id: string;
  orderNumber: string;
  status: string;
  student: { name: string; phone: string };
  restaurant: { name: string };
  courier?: { name: string; phone: string };
  items: { name: string; price: number; quantity: number }[];
  pricing: { subtotal: number; deliveryFee: number; platformFee: number; discount: number; totalAmount: number };
  payment: { method: string; status: string };
  deliveryAddress: { building: string; floor?: string; roomNumber: string };
  timestamps: Record<string, string>;
  earnings: { courierFee: number; restaurantPayout: number; platformRevenue: number };
}

export default function AdminOrderDetail() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/admin/orders/${params.id}`);
      setData(res.data.data);
      setRefundAmount(String(res.data.data?.pricing?.totalAmount || 0));
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const handleRefund = async () => {
    try {
      setActionLoading(true);
      await api.put(`/admin/orders/${params.id}/refund`, { amount: Number(refundAmount), reason: refundReason, type: Number(refundAmount) >= (data?.pricing?.totalAmount || 0) ? 'full' : 'partial' });
      await fetchData();
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  if (error) return (
    <div className="p-4">
      <div className="flex flex-col items-center py-20">
        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
        <p className="text-gray-500 text-center">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={fetchData}>Retry</Button>
      </div>
    </div>
  );
  if (!data) return null;

  return (
    <div className="p-4 space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{data.orderNumber}</h1>
              <p className="text-sm text-gray-500">{data.restaurant?.name} → {data.student?.name}</p>
            </div>
          </div>
          <span className="text-sm font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-600">{data.status.replace(/_/g, ' ')}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Student:</span> <span className="font-medium text-gray-900">{data.student?.name} ({data.student?.phone})</span></div>
          <div><span className="text-gray-500">Courier:</span> <span className="font-medium text-gray-900">{data.courier ? `${data.courier.name} (${data.courier.phone})` : 'Not assigned'}</span></div>
          <div><span className="text-gray-500">Delivery:</span> <span className="font-medium text-gray-900">{data.deliveryAddress?.building}, {data.deliveryAddress?.roomNumber}</span></div>
          <div><span className="text-gray-500">Payment:</span> <span className="font-medium text-gray-900">{data.payment?.method} • {data.payment?.status}</span></div>
        </div>

        <div className="border-t pt-3">
          <h3 className="font-semibold text-gray-900 mb-2">Items</h3>
          {data.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm py-1">
              <span className="text-gray-600">{item.name} × {item.quantity}</span>
              <span className="font-medium">₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="border-t mt-2 pt-2 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{data.pricing?.subtotal}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span>₹{data.pricing?.deliveryFee}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Platform Fee</span><span>₹{data.pricing?.platformFee}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Discount</span><span>-₹{data.pricing?.discount}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>₹{data.pricing?.totalAmount}</span></div>
          </div>
        </div>

        {data.status !== 'cancelled' && data.status !== 'delivered' && (
          <div className="border-t pt-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Refund Order</h3>
            <Input label="Amount" type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} />
            <Textarea placeholder="Reason for refund..." value={refundReason} onChange={e => setRefundReason(e.target.value)} />
            <Button onClick={handleRefund} loading={actionLoading} variant="danger" className="w-full">
              <RotateCcw className="w-4 h-4" /> Process Refund
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
