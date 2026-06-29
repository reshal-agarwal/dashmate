'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store';
import { RestaurantLayout } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Form';
import { cn } from '@/lib/utils';
import {
  IndianRupee,
  AlertCircle,
  RefreshCw,
  Plus,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  Banknote,
  History,
} from 'lucide-react';

interface Payout {
  _id: string;
  amount: number;
  status: string;
  bankDetails: { upiId?: string };
  createdAt: string;
  rejectionReason?: string;
}

export default function PayoutsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showRequest, setShowRequest] = useState(false);
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const fetchPayouts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ success: boolean; data: { items: Payout[] } }>('/restaurant/payouts/history');
      setPayouts(res.data.data.items);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchPayouts();
  }, [isAuthenticated, fetchPayouts, router]);

  const handleRequest = async () => {
    const amt = parseInt(amount);
    if (isNaN(amt) || amt < 100) {
      setRequestError('Minimum payout amount is ₹100');
      return;
    }
    setRequestLoading(true);
    setRequestError(null);
    try {
      await api.post('/restaurant/payouts/request', { amount: amt, upiId: upiId || undefined });
      setShowRequest(false);
      setAmount('');
      setUpiId('');
      fetchPayouts();
    } catch (err) {
      setRequestError(handleApiError(err).message);
    } finally {
      setRequestLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      processed: 'bg-green-100 text-green-700',
    };
    return (
      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', colors[status] || 'bg-gray-100 text-gray-700')}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (!isAuthenticated) return null;

  return (
    <RestaurantLayout title="Payouts">
      <div className="p-4 space-y-4">
        {/* Request Payout Button */}
        <Button variant="primary" size="full" onClick={() => { setShowRequest(true); setRequestError(null); }}>
          <Plus className="w-4 h-4" /> Request Payout
        </Button>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><RefreshCw className="w-4 h-4" /></button>
          </div>
        )}

        {/* Payout History */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <History className="w-4 h-4" /> Payout History
          </h2>

          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-100 p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-12">
              <Banknote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No payout requests yet</p>
              <p className="text-sm text-gray-400 mt-1">Request your first payout above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payouts.map((p) => (
                <div key={p._id} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">₹{p.amount}</span>
                    {getStatusBadge(p.status)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(p.createdAt).toLocaleDateString('en-IN')}
                    </span>
                    {p.bankDetails?.upiId && <span>{p.bankDetails.upiId}</span>}
                  </div>
                  {p.rejectionReason && (
                    <p className="text-xs text-red-500 mt-2">Reason: {p.rejectionReason}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Request Payout Modal */}
      {showRequest && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRequest(false)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Request Payout</h3>
              <button onClick={() => setShowRequest(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (Min ₹100)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input id="amount" type="number" min={100} value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-8" placeholder="500" />
                </div>
              </div>
              <div>
                <Label htmlFor="upi">UPI ID (optional)</Label>
                <Input id="upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="you@upi" />
              </div>
              {requestError && <p className="text-sm text-red-600">{requestError}</p>}
              <Button variant="primary" size="full" loading={requestLoading} onClick={handleRequest}>
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </RestaurantLayout>
  );
}
