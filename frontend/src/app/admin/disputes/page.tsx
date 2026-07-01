'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Scale, CheckCircle, XCircle } from 'lucide-react';

interface DisputeOrder {
  _id: string;
  orderNumber: string;
  student: { name: string };
  restaurant: { name: string };
  courier?: { name: string };
  status: string;
  pricing: { totalAmount: number };
  cancellationReason?: string;
}

export default function AdminDisputes() {
  const [data, setData] = useState<DisputeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/disputes');
      setData(res.data.data.items);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveDispute = async (id: string, resolution: 'refund_student' | 'reject') => {
    try {
      setActionLoading(id);
      setMessage('');
      await api.put(`/admin/disputes/${id}/resolve`, { resolution });
      setMessage(`Dispute ${resolution === 'refund_student' ? 'resolved with refund' : 'rejected'}`);
      fetchData();
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Disputes</h1>

      {message && <div className="p-3 bg-green-50 rounded-lg text-green-600 text-sm">{message}</div>}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No disputes to resolve</div>
      ) : (
        <div className="space-y-3">
          {data.map(o => (
            <div key={o._id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 mt-1">
                  <Scale className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{o.orderNumber}</p>
                  <p className="text-sm text-gray-500">{o.restaurant?.name} → {o.student?.name}</p>
                  {o.courier && <p className="text-xs text-gray-400">Courier: {o.courier.name}</p>}
                  <p className="text-xs text-gray-400 mt-1">Amount: ₹{o.pricing?.totalAmount}</p>
                  {o.cancellationReason && (
                    <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded-lg p-2">{o.cancellationReason}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => resolveDispute(o._id, 'refund_student')} loading={actionLoading === o._id} variant="success" size="sm" className="flex-1">
                  <CheckCircle className="w-4 h-4" /> Refund Student
                </Button>
                <Button onClick={() => resolveDispute(o._id, 'reject')} loading={actionLoading === o._id} variant="outline" size="sm" className="flex-1">
                  <XCircle className="w-4 h-4" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
