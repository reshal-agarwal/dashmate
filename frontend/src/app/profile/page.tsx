'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Form';
import { StudentLayout } from '@/components/layout';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Home,
  Building,
  LogOut,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  ChevronRight,
  CreditCard,
  CheckCircle,
  Shield,
} from 'lucide-react';

interface ProfileData {
  id: string;
  registerNumber: string;
  name: string;
  phone: string;
  roomNumber?: string;
  hostelBlock?: string;
  email?: string;
  addresses: Array<{
    id: string;
    building: string;
    floor?: string;
    roomNumber: string;
    landmark?: string;
    isDefault: boolean;
  }>;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, setAuth, logout, updateUser } = useAuthStore();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', roomNumber: '', hostelBlock: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ building: '', floor: '', roomNumber: '', landmark: '' });
  const [addressSaving, setAddressSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ success: boolean; data: ProfileData }>('/profile');
      const data = res.data.data;
      setProfile(data);
      setFormData({
        name: data.name || '',
        roomNumber: data.roomNumber || '',
        hostelBlock: data.hostelBlock || '',
      });
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, [isAuthenticated, fetchProfile, router]);

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      setSaveError('Name is required');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await api.put<{ success: boolean; data: ProfileData }>('/student/profile', formData);
      const updated = res.data.data;
      setProfile(updated);
      updateUser({ name: updated.name, roomNumber: updated.roomNumber, hostelBlock: updated.hostelBlock });
      setEditing(false);
    } catch (err) {
      setSaveError(handleApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.building.trim() || !newAddress.roomNumber.trim()) {
      return;
    }
    setAddressSaving(true);
    try {
      const res = await api.post<{ success: boolean; data: ProfileData }>('/student/addresses', newAddress);
      setProfile(res.data.data);
      setShowAddAddress(false);
      setNewAddress({ building: '', floor: '', roomNumber: '', landmark: '' });
    } catch (err) {
      setSaveError(handleApiError(err).message);
    } finally {
      setAddressSaving(false);
    }
  };

  const handleRemoveAddress = async (addressId: string) => {
    try {
      const res = await api.delete<{ success: boolean; data: ProfileData }>(`/student/addresses/${addressId}`);
      setProfile(res.data.data);
    } catch (err) {
      setSaveError(handleApiError(err).message);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
    router.refresh();
  };

  if (!isAuthenticated) return null;

  return (
    <StudentLayout title="Profile">
      <div className="p-4 space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200" />
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-200 rounded-xl" />
            ))}
          </div>
        ) : profile ? (
          <>
            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <User className="w-8 h-8 text-primary-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">{profile.name}</h2>
                <p className="text-sm text-gray-500">{profile.registerNumber}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(!editing)}
              >
                {editing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              </Button>
            </div>

            {/* User Info Card */}
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              <div className="flex items-center gap-3 p-4">
                <Building className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Hostel Block</p>
                  <p className="text-sm font-medium text-gray-900">{profile.hostelBlock || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4">
                <Home className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Room Number</p>
                  <p className="text-sm font-medium text-gray-900">{profile.roomNumber || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{profile.phone}</p>
                </div>
              </div>
              {profile.email && (
                <div className="flex items-center gap-3 p-4">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{profile.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Edit Profile Form */}
            {editing && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                <h3 className="font-semibold text-gray-900">Edit Profile</h3>
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => { setFormData((p) => ({ ...p, name: e.target.value })); setSaveError(null); }}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-room">Room Number</Label>
                  <Input
                    id="edit-room"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData((p) => ({ ...p, roomNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-block">Hostel Block</Label>
                  <Input
                    id="edit-block"
                    value={formData.hostelBlock}
                    onChange={(e) => setFormData((p) => ({ ...p, hostelBlock: e.target.value }))}
                  />
                </div>
                {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                <Button
                  variant="primary"
                  size="full"
                  loading={saving}
                  onClick={handleSaveProfile}
                >
                  <Save className="w-4 h-4" />
                  Update Profile
                </Button>
              </div>
            )}

            {/* Addresses Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Saved Addresses
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddAddress(true)}
                  className="text-primary-600"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>

              {profile.addresses.length === 0 ? (
                <div className="text-center py-6 bg-white rounded-xl border border-gray-200">
                  <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No saved addresses</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddAddress(true)}
                    className="mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Address
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {profile.addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200"
                    >
                      <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {addr.building} - {addr.roomNumber}
                        </p>
                        {addr.floor && <p className="text-xs text-gray-500">Floor: {addr.floor}</p>}
                        {addr.landmark && <p className="text-xs text-gray-500">{addr.landmark}</p>}
                        {addr.isDefault && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-primary-600 font-medium mt-1">
                            <CheckCircle className="w-3 h-3" />
                            Default
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveAddress(addr.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logout */}
            <div className="pt-4 border-t border-gray-200">
              <Button
                variant="danger"
                size="full"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </>
        ) : null}
      </div>

      {/* Add Address Modal */}
      {showAddAddress && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { setShowAddAddress(false); setSaveError(null); }}
          />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add Address</h3>
              <button
                onClick={() => { setShowAddAddress(false); setSaveError(null); }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="addr-building">Building *</Label>
                <Input
                  id="addr-building"
                  placeholder="e.g. Main Hostel"
                  value={newAddress.building}
                  onChange={(e) => setNewAddress((p) => ({ ...p, building: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="addr-room">Room Number *</Label>
                <Input
                  id="addr-room"
                  placeholder="e.g. 201"
                  value={newAddress.roomNumber}
                  onChange={(e) => setNewAddress((p) => ({ ...p, roomNumber: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="addr-floor">Floor (optional)</Label>
                <Input
                  id="addr-floor"
                  placeholder="e.g. 2nd Floor"
                  value={newAddress.floor}
                  onChange={(e) => setNewAddress((p) => ({ ...p, floor: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="addr-landmark">Landmark (optional)</Label>
                <Input
                  id="addr-landmark"
                  placeholder="e.g. Near the cafeteria"
                  value={newAddress.landmark}
                  onChange={(e) => setNewAddress((p) => ({ ...p, landmark: e.target.value }))}
                />
              </div>

              <Button
                variant="primary"
                size="full"
                loading={addressSaving}
                onClick={handleAddAddress}
              >
                <Plus className="w-4 h-4" />
                Save Address
              </Button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
