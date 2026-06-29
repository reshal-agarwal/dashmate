'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { CourierLayout } from '@/components/layout';
import { useAuthStore } from '@/store';
import { Truck, Upload, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function CourierApplyPage() {
  const { user, updateUser } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    vehicleType: 'walking' as 'bicycle' | 'scooter' | 'walking',
    vehicleNumber: '',
    licenseNumber: '',
    aadharUrl: '',
    selfieUrl: '',
    drivingLicenseUrl: '',
    upiId: '',
  });

  useEffect(() => {
    api.get('/courier/application').then(r => {
      const s = r.data.data.kycStatus;
      setStatus(s);
      if (s === 'approved') router.push('/courier');
    }).catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/courier/apply', form);
      setStatus('pending');
      updateUser({ courier: { ...res.data.data, kycStatus: 'pending' } as any });
      router.push('/courier');
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'pending') {
    return (
      <CourierLayout title="Application Status">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Application Submitted</h2>
          <p className="text-gray-600 mb-2">Your courier application is being reviewed.</p>
          <p className="text-sm text-gray-500">We&apos;ll notify you once it&apos;s approved.</p>
        </div>
      </CourierLayout>
    );
  }

  return (
    <CourierLayout title="Become a Courier">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl p-4 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary-600" /> Vehicle Details
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
            <select
              value={form.vehicleType}
              onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value as any }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="walking">Walking</option>
              <option value="bicycle">Bicycle</option>
              <option value="scooter">Scooter</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number (optional)</label>
            <input
              type="text" value={form.vehicleNumber}
              onChange={e => setForm(f => ({ ...f, vehicleNumber: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary-600" /> KYC Documents
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Card URL *</label>
            <input type="url" value={form.aadharUrl} required
              onChange={e => setForm(f => ({ ...f, aadharUrl: e.target.value }))}
              placeholder="https://example.com/aadhar.jpg"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selfie URL *</label>
            <input type="url" value={form.selfieUrl} required
              onChange={e => setForm(f => ({ ...f, selfieUrl: e.target.value }))}
              placeholder="https://example.com/selfie.jpg"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Driving License URL (optional)</label>
            <input type="url" value={form.drivingLicenseUrl || ''}
              onChange={e => setForm(f => ({ ...f, drivingLicenseUrl: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 space-y-4">
          <h3 className="font-semibold text-gray-900">Bank Details</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID (optional)</label>
            <input type="text" value={form.upiId}
              onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))}
              placeholder="example@upi"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <Button type="submit" size="full" loading={loading}>
          Submit Application
        </Button>
      </form>
    </CourierLayout>
  );
}
