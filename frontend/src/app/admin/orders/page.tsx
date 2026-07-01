'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { ShoppingBag, ChevronRight, AlertCircle } from 'lucide-react';

interface OrderItem {
  _id: string;
  orderNumber: string;
  status: string;
  student: { name: string };
  restaurant: { name: string };
  courier?: { name: string };
  pricing: { totalAmount: number };
  createdAt: string;
}

const statusColors: Record<string, string> = {
  placed: 'bg-blue-50 text-blue-600', confirmed: 'bg-indigo-50 text-indigo-600',
  preparing: 'bg-amber-50 text-amber-600', ready: 'bg-green-50 text-green-600',
  courier_assigned: 'bg-purple-50 text-purple-600', picked_up: 'bg-cyan-50 text-cyan-600',
  delivered: 'bg-emerald-50 text-emerald-600', cancelled: 'bg-red-50 text-red-600',
  disputed: 'bg-orange-50 text-orange-600',
};

export default function AdminOrders() {
  const [data, setData] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, limit: 20 };
      if (filter) params.status = filter;
      const res = await api.get('/admin/orders', { params });
      setData(res.data.data.items);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const statuses = ['', 'placed', 'confirmed', 'preparing', 'ready', 'courier_assigned', 'picked_up', 'delivered', 'cancelled', 'disputed'];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Orders</h1>

      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {statuses.map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }}
            className={cn('px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors', filter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
            {s === '' ? 'All' : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={fetchData} className="ml-auto text-sm font-medium hover:underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No orders found</div>
      ) : (
        <div className="space-y-2">
          {data.map(o => (
            <Link key={o._id} href={`/admin/orders/${o._id}`}
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{o.orderNumber}</p>
                <p className="text-sm text-gray-500 truncate">{o.restaurant?.name} → {o.student?.name}</p>
                <p className="text-xs text-gray-400">₹{o.pricing?.totalAmount} • {new Date(o.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={cn('text-xs font-medium px-2 py-1 rounded-full', statusColors[o.status] || 'bg-gray-50 text-gray-600')}>
                {o.status.replace(/_/g, ' ')}
              </span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          ))}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <span className="flex items-center text-sm text-gray-500">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
