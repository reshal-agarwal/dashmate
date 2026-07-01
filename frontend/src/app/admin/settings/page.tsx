'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Form';
import { Settings as SettingsIcon, AlertCircle, Save } from 'lucide-react';

interface PlatformSettings {
  platformCommission: number;
  defaultDeliveryFee: number;
  creditEarnRate: number;
  creditExpiryDays: number;
  maxOrdersPerDay: number;
  maxCreditsEarnedPerDay: number;
}

export default function AdminSettings() {
  const [data, setData] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/settings');
      setData(res.data.data);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = async () => {
    if (!data) return;
    try {
      setSaving(true);
      setError(null);
      setSuccess('');
      await api.put('/admin/settings', data);
      setSuccess('Settings saved successfully');
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="p-4 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Platform Settings</h1>

      {error && <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-600 text-sm"><AlertCircle className="w-4 h-4" /><span>{error}</span></div>}
      {success && <div className="p-3 bg-green-50 rounded-lg text-green-600 text-sm">{success}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Platform Configuration</h2>
            <p className="text-sm text-gray-500">Manage commissions, fees, and limits</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><Label required>Platform Commission (%)</Label><Input type="number" min="0" max="30" step="0.5" value={data?.platformCommission ?? 5} onChange={e => setData(prev => prev ? { ...prev, platformCommission: Number(e.target.value) } : null)} /></div>
          <div><Label required>Default Delivery Fee (₹)</Label><Input type="number" min="0" max="100" value={data?.defaultDeliveryFee ?? 10} onChange={e => setData(prev => prev ? { ...prev, defaultDeliveryFee: Number(e.target.value) } : null)} /></div>
          <div><Label required>Credit Earn Rate</Label><Input type="number" min="0" max="1" step="0.01" value={data?.creditEarnRate ?? 0.05} onChange={e => setData(prev => prev ? { ...prev, creditEarnRate: Number(e.target.value) } : null)} /></div>
          <div><Label required>Credit Expiry (days)</Label><Input type="number" min="30" max="365" value={data?.creditExpiryDays ?? 180} onChange={e => setData(prev => prev ? { ...prev, creditExpiryDays: Number(e.target.value) } : null)} /></div>
          <div><Label required>Max Orders/Day</Label><Input type="number" min="1" max="100" value={data?.maxOrdersPerDay ?? 20} onChange={e => setData(prev => prev ? { ...prev, maxOrdersPerDay: Number(e.target.value) } : null)} /></div>
          <div><Label required>Max Credits/Day</Label><Input type="number" min="100" max="5000" step="100" value={data?.maxCreditsEarnedPerDay ?? 500} onChange={e => setData(prev => prev ? { ...prev, maxCreditsEarnedPerDay: Number(e.target.value) } : null)} /></div>
        </div>

        <Button onClick={handleSave} loading={saving} className="w-full">
          <Save className="w-4 h-4" /> Save Settings
        </Button>
      </div>
    </div>
  );
}
