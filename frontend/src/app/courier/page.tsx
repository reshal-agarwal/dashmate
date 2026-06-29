'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { CourierLayout } from '@/components/layout';
import { cn } from '@/lib/utils';
import { MapPin, Truck, Wallet, Star, TrendingUp, AlertCircle, Play, Square } from 'lucide-react';

interface DashboardData {
  isOnline: boolean;
  earningsToday: number;
  earningsThisWeek: number;
  earningsTotal: number;
  totalDeliveries: number;
  rating: number;
  hasActiveOrder: boolean;
  activeOrderId: string | null;
  pendingPayout: number;
}

export default function CourierDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/courier/dashboard');
      setData(res.data.data);
    } catch (err) {
      console.error(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleToggleOnline = async () => {
    setToggling(true);
    try {
      const res = await api.put('/courier/status');
      setData(d => d ? { ...d, isOnline: res.data.data.isOnline } : d);
    } catch (err) {
      console.error(handleApiError(err));
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <CourierLayout title="Courier Dashboard">
        <div className="p-4 space-y-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </CourierLayout>
    );
  }

  return (
    <CourierLayout title="Courier Dashboard">
      <div className="p-4 space-y-4">
        <button
          onClick={handleToggleOnline}
          disabled={toggling}
          className={cn(
            'w-full p-4 rounded-xl flex items-center justify-between transition-colors',
            data?.isOnline ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
          )}
        >
          <span className="flex items-center gap-3">
            {data?.isOnline ? <Play className="w-6 h-6 text-green-600" /> : <Square className="w-6 h-6 text-gray-400" />}
            <span>
              <p className="font-semibold text-gray-900">{data?.isOnline ? "You're Online" : "You're Offline"}</p>
              <p className="text-sm text-gray-600">{data?.isOnline ? 'Available for deliveries' : 'Go online to receive orders'}</p>
            </span>
          </span>
          <span className={cn('w-3 h-3 rounded-full', data?.isOnline ? 'bg-green-500' : 'bg-gray-300')} />
        </button>

        {data?.hasActiveOrder && (
          <Link href={`/courier/orders/active`}
            className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">You have an active delivery</span>
            <span className="ml-auto text-amber-600 text-sm">View &rarr;</span>
          </Link>
        )}

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Truck} label="Deliveries" value={String(data?.totalDeliveries || 0)} />
          <StatCard icon={Star} label="Rating" value={(data?.rating || 0).toFixed(1)} />
          <StatCard icon={TrendingUp} label="Today" value={`₹${data?.earningsToday || 0}`} />
          <StatCard icon={Wallet} label="Total" value={`₹${data?.earningsTotal || 0}`} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <ActionCard href="/courier/orders/available" label="Available" icon={MapPin} />
          <ActionCard href="/courier/orders/history" label="History" icon={Truck} />
          <ActionCard href="/courier/earnings" label="Earnings" icon={TrendingUp} />
        </div>
      </div>
    </CourierLayout>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ActionCard({ href, label, icon: Icon }: { href: string; label: string; icon: any }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100">
      <Icon className="w-6 h-6 text-primary-600" />
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </Link>
  );
}
