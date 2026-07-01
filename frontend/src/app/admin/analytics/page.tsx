'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, handleApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { BarChart3, Users, ShoppingBag, Truck, IndianRupee, AlertCircle, TrendingUp, UserCheck, Package } from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  totalOrders: number;
  totalCouriers: number;
  totalRevenue: number;
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/analytics');
      setData(res.data.data);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
        <p className="text-gray-500 text-center">{error}</p>
      </div>
    );
  }

  const stats = [
    { icon: <Users className="w-6 h-6" />, label: 'Total Users', value: data?.totalUsers ?? 0, color: 'bg-blue-50 text-blue-600', change: '+24%' },
    { icon: <ShoppingBag className="w-6 h-6" />, label: 'Total Orders', value: data?.totalOrders ?? 0, color: 'bg-green-50 text-green-600', change: '+18%' },
    { icon: <Truck className="w-6 h-6" />, label: 'Active Couriers', value: data?.totalCouriers ?? 0, color: 'bg-fuchsia-50 text-fuchsia-600', change: '+12%' },
    { icon: <IndianRupee className="w-6 h-6" />, label: 'Total Revenue', value: `₹${(data?.totalRevenue ?? 0).toLocaleString('en-IN')}`, color: 'bg-purple-50 text-purple-600', change: '+32%' },
  ];

  const overview = [
    { icon: <TrendingUp className="w-5 h-5" />, label: 'Avg Order Value', value: data && data.totalOrders > 0 ? `₹${Math.round(data.totalRevenue / data.totalOrders).toLocaleString('en-IN')}` : '₹0', color: 'bg-emerald-50 text-emerald-600' },
    { icon: <UserCheck className="w-5 h-5" />, label: 'Orders per User', value: data && data.totalUsers > 0 ? (data.totalOrders / data.totalUsers).toFixed(1) : '0', color: 'bg-cyan-50 text-cyan-600' },
    { icon: <Package className="w-5 h-5" />, label: 'Orders per Courier', value: data && data.totalCouriers > 0 ? (data.totalOrders / data.totalCouriers).toFixed(1) : '0', color: 'bg-amber-50 text-amber-600' },
    { icon: <TrendingUp className="w-5 h-5" />, label: 'Revenue per Order', value: data && data.totalOrders > 0 ? `₹${Math.round(data.totalRevenue / data.totalOrders).toLocaleString('en-IN')}` : '₹0', color: 'bg-indigo-50 text-indigo-600' },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-gray-900" />
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-3', s.color)}>
                  {s.icon}
                </div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                <p className="text-xs text-green-600 font-medium mt-1">{s.change}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Key Metrics</h2>
            <div className="space-y-3">
              {overview.map((o, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', o.color)}>
                    {o.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">{o.label}</p>
                    <p className="font-semibold text-gray-900">{o.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Distribution</h2>
            <div className="space-y-3">
              {[
                { label: 'Users', value: data?.totalUsers ?? 0, total: (data?.totalUsers ?? 0) + (data?.totalCouriers ?? 0), color: 'bg-blue-500' },
                { label: 'Couriers', value: data?.totalCouriers ?? 0, total: (data?.totalUsers ?? 0) + (data?.totalCouriers ?? 0), color: 'bg-fuchsia-500' },
              ].map((d, i) => {
                const pct = d.total > 0 ? (d.value / d.total) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{d.label}</span>
                      <span className="font-medium text-gray-900">{d.value} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', d.color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
