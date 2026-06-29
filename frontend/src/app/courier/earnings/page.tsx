'use client';

import { useState, useEffect } from 'react';
import { api, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { CourierLayout } from '@/components/layout';
import { WithdrawalRequest } from '@/types';
import { cn } from '@/lib/utils';
import { Wallet, TrendingUp, Calendar, Clock, ArrowUpRight, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface EarningsData {
  today: number; week: number; month: number; total: number;
  pendingPayout: number; walletBalance: number;
}

export default function EarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [payouts, setPayouts] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutUpi, setPayoutUpi] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [earningsRes, payoutRes] = await Promise.all([
        api.get('/courier/earnings'),
        api.get('/courier/payout/history?limit=5'),
      ]);
      setData(earningsRes.data.data);
      setPayouts(payoutRes.data.data.items);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePayout = async () => {
    if (!payoutAmount || parseInt(payoutAmount) < 100) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post('/courier/payout/request', { amount: parseInt(payoutAmount), upiId: payoutUpi });
      setShowModal(false);
      setPayoutAmount('');
      fetchData();
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CourierLayout title="Earnings" showBack backHref="/courier">
      <div className="p-4 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-6 text-white">
          <p className="text-sm opacity-80 mb-1">Wallet Balance</p>
          <p className="text-3xl font-bold mb-4">₹{data?.walletBalance || 0}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowModal(true)}
              className="bg-white text-primary-700 hover:bg-gray-100">
              <ArrowUpRight className="w-4 h-4" /> Request Payout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Today', value: data?.today || 0, icon: Clock },
            { label: 'This Week', value: data?.week || 0, icon: Calendar },
            { label: 'This Month', value: data?.month || 0, icon: TrendingUp },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-3 border border-gray-100 text-center">
              <s.icon className="w-4 h-4 mx-auto mb-1 text-gray-400" />
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-lg font-bold text-gray-900">₹{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Total Earnings</h3>
            <span className="text-xl font-bold text-primary-600">₹{data?.total || 0}</span>
          </div>
          {data?.pendingPayout ? (
            <p className="text-sm text-amber-600">₹{data.pendingPayout} pending payout</p>
          ) : null}
        </div>

        {payouts.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold">Recent Payouts</h3>
            </div>
            {payouts.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-sm">₹{p.amount}</p>
                  <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={cn('text-xs font-medium px-2 py-1 rounded-full',
                  p.status === 'approved' && 'bg-green-50 text-green-700',
                  p.status === 'pending' && 'bg-yellow-50 text-yellow-700',
                  p.status === 'rejected' && 'bg-red-50 text-red-700',
                  p.status === 'processed' && 'bg-blue-50 text-blue-700',
                )}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold">Request Payout</h3>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Amount (min ₹100)</label>
              <input type="number" value={payoutAmount} min="100"
                onChange={e => setPayoutAmount(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg font-bold"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">UPI ID</label>
              <input type="text" value={payoutUpi}
                onChange={e => setPayoutUpi(e.target.value)}
                placeholder="example@upi"
                className="w-full rounded-lg border border-gray-300 px-4 py-3"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handlePayout} loading={submitting}
                disabled={!payoutAmount || parseInt(payoutAmount) < 100}>
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </CourierLayout>
  );
}
