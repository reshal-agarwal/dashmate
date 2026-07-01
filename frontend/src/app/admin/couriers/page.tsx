'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Users, ChevronRight, AlertCircle } from 'lucide-react';

interface CourierItem {
  _id: string;
  name: string;
  phone: string;
  registerNumber: string;
  courier: { kycStatus: string; isVerified: boolean };
  createdAt: string;
}

export default function AdminCouriers() {
  const [data, setData] = useState<CourierItem[]>([]);
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
      const res = await api.get('/admin/couriers', { params });
      setData(res.data.data.items);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const statusColor = (status: string) => {
    if (status === 'approved') return 'bg-green-50 text-green-600';
    if (status === 'rejected') return 'bg-red-50 text-red-600';
    return 'bg-orange-50 text-orange-600';
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Couriers</h1>

      <div className="flex gap-2">
        {['', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            className={cn('px-3 py-1.5 rounded-full text-sm font-medium transition-colors', filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
            {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
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
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No couriers found</div>
      ) : (
        <div className="space-y-2">
          {data.map(c => (
            <Link key={c._id} href={`/admin/couriers/${c._id}`}
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-fuchsia-50 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-fuchsia-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                <p className="text-sm text-gray-500">{c.registerNumber} • {c.phone}</p>
              </div>
              <span className={cn('text-xs font-medium px-2 py-1 rounded-full', statusColor(c.courier?.kycStatus))}>
                {c.courier?.kycStatus || 'none'}
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
