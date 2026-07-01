'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  Users, Store, IndianRupee, ShoppingBag, AlertCircle, RefreshCw,
  ShieldCheck, Ticket, Settings, BarChart3, TrendingUp,
} from 'lucide-react';

interface DashboardData {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingCouriers: number;
  pendingWithdrawals: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ success: boolean; data: DashboardData }>('/admin/dashboard');
      setData(res.data.data);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'admin') { router.push('/'); return; }
    fetchDashboard();
  }, [isAuthenticated, user, fetchDashboard, router]);

  if (!isAuthenticated || user?.role !== 'admin') return null;

  if (error) {
    return (
      <div className="p-4">
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-500 text-center">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchDashboard}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Total Users"
          value={loading ? '...' : String(data?.totalUsers ?? 0)}
          color="blue"
        />
        <StatCard
          icon={<ShoppingBag className="w-5 h-5" />}
          label="Total Orders"
          value={loading ? '...' : String(data?.totalOrders ?? 0)}
          color="green"
        />
        <StatCard
          icon={<IndianRupee className="w-5 h-5" />}
          label="Revenue"
          value={loading ? '...' : `₹${(data?.totalRevenue ?? 0).toLocaleString('en-IN')}`}
          color="purple"
        />
        <StatCard
          icon={<ShieldCheck className="w-5 h-5" />}
          label="Pending KYC"
          value={loading ? '...' : String(data?.pendingCouriers ?? 0)}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <QuickActionCard href="/admin/restaurants" icon={<Store className="w-5 h-5" />} label="Restaurants" desc="Onboarding & verification" color="primary" />
        <QuickActionCard href="/admin/couriers" icon={<Users className="w-5 h-5" />} label="Couriers" desc="KYC verification" color="fuchsia" />
        <QuickActionCard href="/admin/orders" icon={<ShoppingBag className="w-5 h-5" />} label="Orders" desc="Oversight & disputes" color="emerald" />
        <QuickActionCard href="/admin/withdrawals" icon={<IndianRupee className="w-5 h-5" />} label="Withdrawals" desc="Approve payouts" color="indigo" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <QuickActionCard href="/admin/coupons" icon={<Ticket className="w-5 h-5" />} label="Coupons" desc="Create & manage" color="amber" />
        <QuickActionCard href="/admin/settings" icon={<Settings className="w-5 h-5" />} label="Settings" desc="Platform config" color="slate" />
        <QuickActionCard href="/admin/analytics" icon={<BarChart3 className="w-5 h-5" />} label="Analytics" desc="Reports & insights" color="cyan" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Pending Actions</h2>
          <button onClick={fetchDashboard} className="p-2 rounded-lg hover:bg-gray-100">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="space-y-3">
          <StatusRow label="Pending KYC Verifications" value={String(data?.pendingCouriers ?? 0)} valueClass="text-orange-600" />
          <StatusRow label="Pending Withdrawals" value={String(data?.pendingWithdrawals ?? 0)} valueClass="text-orange-600" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600', purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', colors[color])}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function QuickActionCard({ href, icon, label, desc, color }: { href: string; icon: React.ReactNode; label: string; desc: string; color: string }) {
  const colors: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600', fuchsia: 'bg-fuchsia-50 text-fuchsia-600',
    emerald: 'bg-emerald-50 text-emerald-600', indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600', slate: 'bg-slate-50 text-slate-600', cyan: 'bg-cyan-50 text-cyan-600',
  };
  return (
    <Link href={href} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors block">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', colors[color])}>{icon}</div>
      <p className="font-semibold text-gray-900 text-sm">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
    </Link>
  );
}

function StatusRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={cn('text-sm font-medium text-gray-900', valueClass)}>{value}</span>
    </div>
  );
}
