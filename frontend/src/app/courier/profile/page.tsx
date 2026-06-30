'use client';

import { useState, useEffect } from 'react';
import { api, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { CourierLayout } from '@/components/layout';
import { useAuthStore } from '@/store';
import { User } from '@/types';
import { cn } from '@/lib/utils';
import { User as UserIcon, Phone, MapPin, Star, Truck, AlertCircle, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CourierProfilePage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', upiId: '' });

  useEffect(() => {
    api.get('/courier/profile').then(r => {
      setProfile(r.data.data);
      setForm({ name: r.data.data.name, phone: r.data.data.phone, upiId: r.data.data.courier?.bankDetails?.upiId || '' });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      await api.put('/courier/profile', form);
      setEditing(false);
      setProfile((p: any) => p ? { ...p, ...form } : p);
    } catch (err) {
      console.error(handleApiError(err));
    }
  };

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <CourierLayout title="Profile" showBack>
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-gray-200 rounded-xl" />
            <div className="h-32 bg-gray-200 rounded-xl" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl p-6 border border-gray-100 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-lg font-semibold">{profile?.name}</h2>
              <p className="text-sm text-gray-500">{profile?.registerNumber}</p>
              {profile?.courier && (
                <div className="flex items-center justify-center gap-4 mt-3 text-sm">
                  <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400" /> {profile.courier.rating}</span>
                  <span className="flex items-center gap-1"><Truck className="w-4 h-4 text-primary-500" /> {profile.courier.totalDeliveries} deliveries</span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold">Personal Info</h3>
                <button onClick={() => setEditing(!editing)} className="text-sm text-primary-600 font-medium">Edit</button>
              </div>
              {editing ? (
                <div className="p-4 space-y-3">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Name" />
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Phone" />
                  <input value={form.upiId} onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="UPI ID" />
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>Cancel</Button>
                    <Button className="flex-1" onClick={handleSave}>Save</Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3 text-sm">
                  <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-gray-400" /> {profile?.phone}</div>
                  <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-gray-400" /> {profile?.hostelBlock || 'N/A'}, {profile?.roomNumber || 'N/A'}</div>
                  {profile?.courier?.bankDetails?.upiId && (
                    <div className="flex items-center gap-3"><Truck className="w-4 h-4 text-gray-400" /> UPI: {profile.courier.bankDetails.upiId}</div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="font-semibold mb-3">Vehicle & KYC</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Vehicle</span><span className="capitalize">{profile?.courier?.vehicleType || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">KYC Status</span>
                  <span className={cn('font-medium capitalize',
                    profile?.courier?.kycStatus === 'approved' ? 'text-green-600' : 
                    profile?.courier?.kycStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'
                  )}>{profile?.courier?.kycStatus || 'none'}</span>
                </div>
                {profile?.courier?.vehicleNumber && (
                  <div className="flex justify-between"><span className="text-gray-500">Vehicle No.</span><span>{profile.courier.vehicleNumber}</span></div>
                )}
              </div>
            </div>

            <Button variant="danger" size="full" onClick={handleLogout}>
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </>
        )}
      </div>
    </CourierLayout>
  );
}
