'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store';
import { RestaurantLayout } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import {
  TrendingUp, Download, IndianRupee, ShoppingBag, Clock,
  AlertCircle, Loader2,
} from 'lucide-react';

interface AnalyticsData {
  sales: { date: string; revenue: number; orders: number }[];
  topItems: { name: string; quantity: number; revenue: number }[];
  peakHours: { hour: number; count: number }[];
  totalRevenue: number;
  totalOrders: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; data: AnalyticsData }>('/restaurant/analytics');
      setData(res.data.data);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchAnalytics();
  }, [isAuthenticated, fetchAnalytics, router]);

  const handleDownload = async () => {
    try {
      const res = await api.get('/restaurant/analytics/download', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(handleApiError(err).message);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <RestaurantLayout title="Analytics">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Sales Analytics</h2>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4" /> CSV
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <IndianRupee className="w-4 h-4" /> Total Revenue
                </div>
                <p className="text-2xl font-bold text-gray-900">₹{data.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <ShoppingBag className="w-4 h-4" /> Total Orders
                </div>
                <p className="text-2xl font-bold text-gray-900">{data.totalOrders}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Daily Sales (Last 7 Days)</h3>
              <div className="space-y-2">
                {data.sales.map((s) => (
                  <div key={s.date} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{new Date(s.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500">{s.orders} orders</span>
                      <span className="font-medium text-gray-900">₹{s.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Top Items</h3>
              <div className="space-y-2">
                {data.topItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{item.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500">{item.quantity} sold</span>
                      <span className="font-medium text-gray-900">₹{item.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Peak Hours</h3>
              <div className="space-y-1">
                {data.peakHours.map((h) => (
                  <div key={h.hour} className="flex items-center gap-2 text-sm">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-600 w-16">{h.hour.toString().padStart(2, '0')}:00</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(100, (h.count / Math.max(...data.peakHours.map(x => x.count))) * 100)}%` }} />
                    </div>
                    <span className="text-gray-500 w-8 text-right">{h.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </RestaurantLayout>
  );
}
