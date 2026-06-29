'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store';
import { RestaurantLayout } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  ShoppingBag,
  IndianRupee,
  Clock,
  AlertCircle,
  TrendingUp,
  Star,
  Package,
  ChevronRight,
  RefreshCw,
  Utensils,
} from 'lucide-react';

interface DashboardData {
  todayOrders: number;
  todayRevenue: number;
  avgOrderValue: number;
  pendingOrders: number;
  activeOrders: number;
  totalOrders: number;
  rating: number;
  isActive: boolean;
}

export default function RestaurantDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ success: boolean; data: DashboardData }>('/restaurant/dashboard');
      setData(res.data.data);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchDashboard();
  }, [isAuthenticated, fetchDashboard, router]);

  if (!isAuthenticated) return null;

  if (error) {
    return (
      <RestaurantLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-500 text-center">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchDashboard}>
            Retry
          </Button>
        </div>
      </RestaurantLayout>
    );
  }

  return (
    <RestaurantLayout title="Dashboard">
      <div className="p-4 space-y-5">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<ShoppingBag className="w-5 h-5" />}
            label="Today's Orders"
            value={loading ? '...' : String(data?.todayOrders ?? 0)}
            color="blue"
          />
          <StatCard
            icon={<IndianRupee className="w-5 h-5" />}
            label="Revenue"
            value={loading ? '...' : `₹${(data?.todayRevenue ?? 0).toLocaleString('en-IN')}`}
            color="green"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Pending"
            value={loading ? '...' : String(data?.pendingOrders ?? 0)}
            color="orange"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Avg Order"
            value={loading ? '...' : `₹${data?.avgOrderValue ?? 0}`}
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <QuickActionCard
            href="/restaurant/orders"
            icon={<Package className="w-5 h-5" />}
            label="Orders"
            desc="View & manage orders"
            color="primary"
          />
          <QuickActionCard
            href="/restaurant/products"
            icon={<Utensils className="w-5 h-5" />}
            label="Products"
            desc="Manage your menu"
            color="fuchsia"
          />
          <QuickActionCard
            href="/restaurant/payouts"
            icon={<IndianRupee className="w-5 h-5" />}
            label="Payouts"
            desc="Earnings & withdrawals"
            color="emerald"
          />
          <QuickActionCard
            href="/restaurant/analytics"
            icon={<TrendingUp className="w-5 h-5" />}
            label="Analytics"
            desc="Sales & insights"
            color="indigo"
          />
        </div>

        {/* Status Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Status Overview</h2>
            <button onClick={fetchDashboard} className="p-2 rounded-lg hover:bg-gray-100">
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="space-y-3">
            <StatusRow label="Total Orders" value={String(data?.totalOrders ?? 0)} />
            <StatusRow label="Active Orders" value={String(data?.activeOrders ?? 0)} />
            <StatusRow label="Rating" value={data?.rating ? `${data.rating.toFixed(1)} ★` : 'No ratings'} />
            <StatusRow label="Status" value={data?.isActive ? 'Open' : 'Closed'} valueClass={data?.isActive ? 'text-green-600' : 'text-red-600'} />
          </div>
        </div>
      </div>
    </RestaurantLayout>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', colors[color])}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function QuickActionCard({ href, icon, label, desc, color }: { href: string; icon: React.ReactNode; label: string; desc: string; color: string }) {
  const colors: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600',
    fuchsia: 'bg-fuchsia-50 text-fuchsia-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors"
    >
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', colors[color])}>
        {icon}
      </div>
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
