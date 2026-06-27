'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Form';
import { StudentLayout } from '@/components/layout';
import {
  Wallet as WalletIcon,
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Loader2,
  X,
  AlertCircle,
  History,
  Coins,
  ArrowRight,
  CheckCircle,
  Clock,
  IndianRupee,
  Banknote,
} from 'lucide-react';

interface WalletData {
  balance: number;
  creditsBalance: number;
  transactions: {
    items: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

interface CreditsHistoryData {
  items: any[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function WalletPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [creditsHistory, setCreditsHistory] = useState<CreditsHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);

  const [showCreditsConvert, setShowCreditsConvert] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [creditsError, setCreditsError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [creditsPage, setCreditsPage] = useState(1);

  const fetchWallet = useCallback(async (p: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ success: boolean; data: WalletData }>('/wallet', {
        params: { page: p, limit: 20 },
      });
      setWallet(res.data.data);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCreditsHistory = useCallback(async (p: number = 1) => {
    try {
      const res = await api.get<{ success: boolean; data: CreditsHistoryData }>('/credits/history', {
        params: { page: p, limit: 20 },
      });
      setCreditsHistory(res.data.data);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchWallet(page);
    fetchCreditsHistory(creditsPage);
  }, [isAuthenticated, page, creditsPage, fetchWallet, fetchCreditsHistory, router]);

  const loadRazorpay = (): Promise<void> =>
    new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });

  const handleTopUp = async () => {
    const amount = parseInt(topUpAmount);
    if (isNaN(amount) || amount < 10 || amount > 50000) {
      setTopUpError('Amount must be between ₹10 and ₹50,000');
      return;
    }
    setTopUpLoading(true);
    setTopUpError(null);

    try {
      const orderRes = await api.post<{ success: boolean; data: { orderId: string; amount: number; currency: string } }>(
        '/wallet/topup',
        { amount }
      );
      const order = orderRes.data.data;

      await loadRazorpay();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'DashMate',
        description: 'Wallet Top Up',
        order_id: order.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await api.post('/wallet/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setShowTopUp(false);
            setTopUpAmount('');
            fetchWallet(page);
          } catch (err) {
            setTopUpError(handleApiError(err).message);
          }
        },
        modal: {
          ondismiss: () => {
            setTopUpLoading(false);
          },
        },
        prefill: {
          name: user?.name || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#0284c7',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      setTopUpError(handleApiError(err).message);
    } finally {
      setTopUpLoading(false);
    }
  };

  const handleCreditsConvert = async () => {
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount < 100) {
      setCreditsError('Minimum 100 credits required');
      return;
    }
    setCreditsLoading(true);
    setCreditsError(null);

    try {
      await api.post('/credits/convert', { amount });
      setShowCreditsConvert(false);
      setCreditAmount('');
      fetchWallet(page);
      fetchCreditsHistory(creditsPage);
    } catch (err) {
      setCreditsError(handleApiError(err).message);
    } finally {
      setCreditsLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    if (type.startsWith('wallet_topup')) return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
    if (type.startsWith('wallet_deduction')) return <ArrowUpRight className="w-5 h-5 text-red-600" />;
    if (type.startsWith('wallet_refund')) return <ArrowDownLeft className="w-5 h-5 text-blue-600" />;
    if (type.startsWith('credits')) return <Coins className="w-5 h-5 text-yellow-600" />;
    return <ArrowDownLeft className="w-5 h-5 text-gray-600" />;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      reversed: 'bg-yellow-100 text-yellow-700',
    };
    return (
      <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', colors[status] || 'bg-gray-100 text-gray-700')}>
        {status}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (!isAuthenticated) return null;

  return (
    <StudentLayout title="Wallet">
      <div className="p-4 space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-5 text-white space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WalletIcon className="w-5 h-5 opacity-90" />
              <span className="text-sm font-medium opacity-90">Wallet Balance</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchWallet(page)}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-3xl font-bold">₹{wallet?.balance.toLocaleString('en-IN') ?? '0'}</div>
          <div className="flex items-center justify-between pt-2 border-t border-white/20">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 opacity-90" />
              <span className="text-sm opacity-90">Credits</span>
              <span className="font-semibold">{wallet?.creditsBalance ?? 0}</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowTopUp(true)}
              className="bg-white text-primary-700 hover:bg-gray-100 font-semibold"
            >
              <Plus className="w-4 h-4" />
              Top Up
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowTopUp(true)}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-300 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 text-sm">Add Money</p>
              <p className="text-xs text-gray-500">Via UPI/Card</p>
            </div>
          </button>
          <button
            onClick={() => setShowCreditsConvert(true)}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-yellow-300 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Coins className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 text-sm">Convert Credits</p>
              <p className="text-xs text-gray-500">To wallet balance</p>
            </div>
          </button>
        </div>

        {/* Transaction History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5" />
              Transactions
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3 p-4 bg-white rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
              ))}
            </div>
          ) : wallet?.transactions.items.length === 0 ? (
            <div className="text-center py-10">
              <Banknote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No transactions yet</p>
              <p className="text-sm text-gray-400 mt-1">Your wallet activity will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {wallet?.transactions.items.map((txn: any) => (
                <div
                  key={txn.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                    {getTransactionIcon(txn.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{txn.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">{formatDate(txn.createdAt)}</span>
                      {getStatusBadge(txn.status)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn(
                      'text-sm font-semibold',
                      txn.amount > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {txn.amount > 0 ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(wallet?.transactions?.pagination?.totalPages ?? 0) > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="flex items-center text-sm text-gray-500 px-2">
                {page} / {wallet?.transactions.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (wallet?.transactions.pagination.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Credits History */}
        {creditsHistory && creditsHistory.items.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Coins className="w-5 h-5 text-yellow-600" />
              Credits History
            </h2>
            <div className="space-y-2">
              {creditsHistory.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100"
                >
                  <div className="w-9 h-9 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
                    <Coins className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.description}</p>
                    <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
                  </div>
                  <p className={cn(
                    'text-sm font-semibold shrink-0',
                    item.amount > 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {item.amount > 0 ? '+' : ''}{item.amount}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top-Up Modal */}
      {showTopUp && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { setShowTopUp(false); setTopUpError(null); }}
          />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add Money to Wallet</h3>
              <button
                onClick={() => { setShowTopUp(false); setTopUpError(null); }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (₹10 - ₹50,000)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <Input
                    id="amount"
                    type="number"
                    min={10}
                    max={50000}
                    placeholder="500"
                    value={topUpAmount}
                    onChange={(e) => { setTopUpAmount(e.target.value); setTopUpError(null); }}
                    className="pl-8"
                  />
                </div>
                {topUpError && <p className="mt-1 text-sm text-red-600">{topUpError}</p>}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => { setTopUpAmount(String(amt)); setTopUpError(null); }}
                    className={cn(
                      'py-2.5 rounded-lg border text-sm font-medium transition-colors',
                      topUpAmount === String(amt)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <Button
                variant="primary"
                size="full"
                loading={topUpLoading}
                onClick={handleTopUp}
                className="mt-2"
              >
                Proceed to Pay
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Credits Convert Modal */}
      {showCreditsConvert && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { setShowCreditsConvert(false); setCreditsError(null); }}
          />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Convert Credits</h3>
              <button
                onClick={() => { setShowCreditsConvert(false); setCreditsError(null); }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <p>Available Credits: <strong>{wallet?.creditsBalance ?? 0}</strong></p>
                <p className="text-xs mt-1">Minimum 100 credits. 1 credit = ₹1</p>
              </div>

              <div>
                <Label htmlFor="creditAmount">Credits to Convert</Label>
                <Input
                  id="creditAmount"
                  type="number"
                  min={100}
                  placeholder="100"
                  value={creditAmount}
                  onChange={(e) => { setCreditAmount(e.target.value); setCreditsError(null); }}
                />
                {creditsError && <p className="mt-1 text-sm text-red-600">{creditsError}</p>}
              </div>

              <Button
                variant="primary"
                size="full"
                loading={creditsLoading}
                onClick={handleCreditsConvert}
              >
                <ArrowRight className="w-4 h-4" />
                Convert to Wallet
              </Button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
