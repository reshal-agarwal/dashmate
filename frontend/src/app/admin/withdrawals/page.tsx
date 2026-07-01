'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Form';
import { cn } from '@/lib/utils';
import { IndianRupee, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface Withdrawal {
  _id: string;
  user: { name: string; phone: string };
  type: string;
  amount: number;
  bankDetails: { upiId?: string; accountHolderName?: string };
  status: string;
  createdAt: string;
}

export default function AdminWithdrawals() {
  const [data, setData] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [showReject, setShowReject] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/withdrawals', { params: { limit: 50 } });
      setData(res.data.data.items);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const processWithdrawal = async (id: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(id);
      await api.put(`/admin/withdrawals/${id}/process`, { action, note: rejectionNote });
      setShowReject(null);
      setRejectionNote('');
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
      <h1 className="text-xl font-bold text-gray-900">Withdrawal Requests</h1>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No withdrawal requests</div>
      ) : (
        <div className="space-y-3">
          {data.map(w => (
            <div key={w._id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-1">
                  <IndianRupee className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{w.user?.name}</p>
                  <p className="text-sm text-gray-500">{w.user?.phone} • {w.type}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">₹{w.amount.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-400">
                    UPI: {w.bankDetails?.upiId || '-'} • {w.bankDetails?.accountHolderName || ''}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(w.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={cn('text-xs font-medium px-2 py-1 rounded-full', w.status === 'pending' ? 'bg-orange-50 text-orange-600' : w.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>
                  {w.status}
                </span>
              </div>
              {w.status === 'pending' && (
                <div className="space-y-3">
                  {showReject === w._id && (
                    <Textarea placeholder="Reason for rejection..." value={rejectionNote} onChange={e => setRejectionNote(e.target.value)} />
                  )}
                  <div className="flex gap-2">
                    <Button onClick={() => processWithdrawal(w._id, 'approve')} loading={actionLoading === w._id} variant="success" size="sm" className="flex-1">
                      <CheckCircle className="w-4 h-4" /> Approve
                    </Button>
                    {showReject === w._id ? (
                      <Button onClick={() => processWithdrawal(w._id, 'reject')} loading={actionLoading === w._id} variant="danger" size="sm" className="flex-1">
                        <XCircle className="w-4 h-4" /> Confirm Reject
                      </Button>
                    ) : (
                      <Button onClick={() => setShowReject(w._id)} variant="outline" size="sm" className="flex-1">
                        <XCircle className="w-4 h-4" /> Reject
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
