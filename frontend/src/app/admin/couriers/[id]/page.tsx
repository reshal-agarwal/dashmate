'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Users, ArrowLeft, AlertCircle, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';

interface CourierDetail {
  _id: string;
  name: string;
  phone: string;
  registerNumber: string;
  roomNumber?: string;
  hostelBlock?: string;
  courier: {
    isVerified: boolean;
    vehicleType: string;
    vehicleNumber?: string;
    licenseNumber?: string;
    kycStatus: string;
    kycDocuments: { aadhar: string; drivingLicense?: string; selfie: string };
    bankDetails: { upiId?: string; accountNumber?: string; ifsc?: string; accountHolderName?: string };
    rating: number;
    totalDeliveries: number;
    isOnline: boolean;
    earningsTotal: number;
  };
  createdAt: string;
}

export default function AdminCourierDetail() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<CourierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/admin/couriers/${params.id}`);
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
      await api.put(`/admin/couriers/${params.id}/verify`, { isVerified });
      await fetchData();
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      setActionLoading(true);
      await api.put(`/admin/couriers/${params.id}/toggle`);
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

  const c = data.courier;
  return (
    <div className="p-4 space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-fuchsia-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-fuchsia-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{data.name}</h1>
              <p className="text-sm text-gray-500">{data.registerNumber} • {data.phone}</p>
            </div>
          </div>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${c?.kycStatus === 'approved' ? 'bg-green-50 text-green-600' : c?.kycStatus === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
            {c?.kycStatus || 'none'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Room:</span> <span className="font-medium text-gray-900">{data.roomNumber || 'N/A'}, {data.hostelBlock || ''}</span></div>
          <div><span className="text-gray-500">Vehicle:</span> <span className="font-medium text-gray-900">{c?.vehicleType || 'N/A'} {c?.vehicleNumber ? `(${c.vehicleNumber})` : ''}</span></div>
          <div><span className="text-gray-500">License:</span> <span className="font-medium text-gray-900">{c?.licenseNumber || 'N/A'}</span></div>
          <div><span className="text-gray-500">Rating:</span> <span className="font-medium text-gray-900">{c?.rating?.toFixed(1) || '0'} ★</span></div>
          <div><span className="text-gray-500">Deliveries:</span> <span className="font-medium text-gray-900">{c?.totalDeliveries || 0}</span></div>
          <div><span className="text-gray-500">Earnings:</span> <span className="font-medium text-gray-900">₹{(c?.earningsTotal || 0).toLocaleString('en-IN')}</span></div>
          <div><span className="text-gray-500">Online:</span> <span className="font-medium text-gray-900">{c?.isOnline ? 'Yes' : 'No'}</span></div>
          <div><span className="text-gray-500">UPI:</span> <span className="font-medium text-gray-900">{c?.bankDetails?.upiId || '-'}</span></div>
        </div>

        <div className="flex gap-3 pt-2">
          {c?.kycStatus !== 'approved' && (
            <Button onClick={() => handleVerify(true)} loading={actionLoading} className="flex-1" variant="success">
              <CheckCircle className="w-4 h-4" /> Approve KYC
            </Button>
          )}
          {c?.kycStatus !== 'rejected' && (
            <Button onClick={() => handleVerify(false)} loading={actionLoading} className="flex-1" variant="danger">
              <XCircle className="w-4 h-4" /> Reject KYC
            </Button>
          )}
          <Button onClick={handleToggle} loading={actionLoading} variant="outline" className="flex-1">
            <ShieldCheck className="w-4 h-4" /> {c?.isOnline ? 'Go Offline' : 'Go Online'}
          </Button>
        </div>
      </div>
    </div>
  );
}
