'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Store, ArrowLeft, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface RestaurantDetail {
  _id: string;
  name: string;
  description?: string;
  category: string;
  contactPhone: string;
  isActive: boolean;
  isVerified: boolean;
  minimumOrderAmount: number;
  deliveryFee: number;
  platformCommission: number;
  estimatedPrepTime: number;
  location: { building: string; floor?: string; roomNumber: string };
  operatingHours: { open: string; close: string; daysOpen: number[] };
  rating: number;
  totalOrders: number;
  payoutUpiId?: string;
  owner: { name: string; phone: string };
  createdAt: string;
}

export default function AdminRestaurantDetail() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/admin/restaurants/${params.id}`);
      setData(res.data.data);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const handleVerify = async (isVerified: boolean) => {
    try {
      setActionLoading(true);
      await api.put(`/admin/restaurants/${params.id}/verify`, { isVerified });
      await fetchData();
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  if (error) return (
    <div className="p-4">
      <div className="flex flex-col items-center py-20">
        <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
        <p className="text-gray-500 text-center">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={fetchData}>Retry</Button>
      </div>
    </div>
  );
  if (!data) return null;

  return (
    <div className="p-4 space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
              <Store className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{data.name}</h1>
              <p className="text-sm text-gray-500">{data.category} • {data.contactPhone}</p>
            </div>
          </div>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${data.isVerified ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
            {data.isVerified ? 'Verified' : 'Pending'}
          </span>
        </div>

        {data.description && <p className="text-gray-600 text-sm">{data.description}</p>}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Owner:</span> <span className="font-medium text-gray-900">{data.owner?.name || 'N/A'}</span></div>
          <div><span className="text-gray-500">Phone:</span> <span className="font-medium text-gray-900">{data.owner?.phone || 'N/A'}</span></div>
          <div><span className="text-gray-500">Location:</span> <span className="font-medium text-gray-900">{data.location?.building}, {data.location?.roomNumber}</span></div>
          <div><span className="text-gray-500">Hours:</span> <span className="font-medium text-gray-900">{data.operatingHours?.open} - {data.operatingHours?.close}</span></div>
          <div><span className="text-gray-500">Min Order:</span> <span className="font-medium text-gray-900">₹{data.minimumOrderAmount}</span></div>
          <div><span className="text-gray-500">Delivery Fee:</span> <span className="font-medium text-gray-900">₹{data.deliveryFee}</span></div>
          <div><span className="text-gray-500">Commission:</span> <span className="font-medium text-gray-900">{data.platformCommission}%</span></div>
          <div><span className="text-gray-500">Prep Time:</span> <span className="font-medium text-gray-900">{data.estimatedPrepTime} min</span></div>
          <div><span className="text-gray-500">Rating:</span> <span className="font-medium text-gray-900">{data.rating.toFixed(1)} ★</span></div>
          <div><span className="text-gray-500">Orders:</span> <span className="font-medium text-gray-900">{data.totalOrders}</span></div>
          <div><span className="text-gray-500">Upi ID:</span> <span className="font-medium text-gray-900">{data.payoutUpiId || '-'}</span></div>
          <div><span className="text-gray-500">Active:</span> <span className="font-medium text-gray-900">{data.isActive ? 'Yes' : 'No'}</span></div>
        </div>

        {!data.isVerified && (
          <div className="flex gap-3 pt-2">
            <Button onClick={() => handleVerify(true)} loading={actionLoading} className="flex-1">
              <CheckCircle className="w-4 h-4" /> Verify Restaurant
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
