'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Store, ChevronRight, Search, AlertCircle } from 'lucide-react';

interface RestaurantItem {
  _id: string;
  name: string;
  category: string;
  isVerified: boolean;
  isActive: boolean;
  contactPhone: string;
  createdAt: string;
}

export default function AdminRestaurants() {
  const [data, setData] = useState<RestaurantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, limit: 20 };
      if (filter) params.isVerified = filter;
      const res = await api.get('/admin/restaurants', { params });
      setData(res.data.data.items);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Restaurants</h1>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2">
        {['', 'true', 'false'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            className={cn('px-3 py-1.5 rounded-full text-sm font-medium transition-colors', filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
            {f === '' ? 'All' : f === 'true' ? 'Verified' : 'Unverified'}
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
        <div className="text-center py-12 text-gray-500">No restaurants found</div>
      ) : (
        <div className="space-y-2">
          {data.map(r => (
            <Link key={r._id} href={`/admin/restaurants/${r._id}`}
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{r.name}</p>
                <p className="text-sm text-gray-500">{r.category} • {r.contactPhone}</p>
              </div>
              <span className={cn('text-xs font-medium px-2 py-1 rounded-full', r.isVerified ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600')}>
                {r.isVerified ? 'Verified' : 'Pending'}
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
