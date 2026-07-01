'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Select, Label } from '@/components/ui/Form';
import { cn } from '@/lib/utils';
import { Ticket, AlertCircle, Plus, Trash2, Edit3 } from 'lucide-react';

interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  validUntil: string;
  isActive: boolean;
}

const defaultForm = { code: '', description: '', discountType: 'percentage', discountValue: 0, minOrderAmount: 0, maxDiscount: 0, usageLimit: -1, validUntil: '' };

export default function AdminCoupons() {
  const [data, setData] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/coupons');
      setData(res.data.data.items);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editId) {
        await api.put(`/admin/coupons/${editId}`, form);
      } else {
        await api.post('/admin/coupons', form);
      }
      setShowForm(false);
      setEditId(null);
      setForm(defaultForm);
      fetchData();
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      fetchData();
    } catch (err) {
      setError(handleApiError(err).message);
    }
  };

  const startEdit = (coupon: Coupon) => {
    setForm({ code: coupon.code, description: coupon.description, discountType: coupon.discountType, discountValue: coupon.discountValue, minOrderAmount: coupon.minOrderAmount, maxDiscount: coupon.maxDiscount || 0, usageLimit: coupon.usageLimit, validUntil: coupon.validUntil.split('T')[0] });
    setEditId(coupon._id);
    setShowForm(true);
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Coupons</h1>
        <Button size="sm" onClick={() => { setShowForm(!showForm); setEditId(null); setForm(defaultForm); }}>
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" /><span>{error}</span>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">{editId ? 'Edit Coupon' : 'New Coupon'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><Label required>Code</Label><Input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="SAVE20" /></div>
            <div><Label required>Type</Label><Select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})}><option value="percentage">Percentage</option><option value="flat">Flat</option></Select></div>
            <div><Label required>Value</Label><Input type="number" value={form.discountValue} onChange={e => setForm({...form, discountValue: Number(e.target.value)})} /></div>
            <div><Label>Min Order</Label><Input type="number" value={form.minOrderAmount} onChange={e => setForm({...form, minOrderAmount: Number(e.target.value)})} /></div>
            <div><Label>Max Discount</Label><Input type="number" value={form.maxDiscount} onChange={e => setForm({...form, maxDiscount: Number(e.target.value)})} /></div>
            <div><Label>Usage Limit</Label><Input type="number" value={form.usageLimit} onChange={e => setForm({...form, usageLimit: Number(e.target.value)})} placeholder="-1 = unlimited" /></div>
          </div>
          <div><Label required>Valid Until</Label><Input type="date" value={form.validUntil} onChange={e => setForm({...form, validUntil: e.target.value})} /></div>
          <div className="flex gap-2">
            <Button onClick={handleSave} loading={saving} className="flex-1">{editId ? 'Update' : 'Create'}</Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No coupons created</div>
      ) : (
        <div className="space-y-2">
          {data.map(c => (
            <div key={c._id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Ticket className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{c.code}</p>
                <p className="text-sm text-gray-500">
                  {c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`} off
                  {c.minOrderAmount > 0 ? ` • Min ₹${c.minOrderAmount}` : ''}
                  {' • '}{c.usedCount}/{c.usageLimit === -1 ? '∞' : c.usageLimit} used
                </p>
              </div>
              <span className={cn('text-xs font-medium px-2 py-1 rounded-full', new Date(c.validUntil) > new Date() ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>
                {new Date(c.validUntil) > new Date() ? 'Active' : 'Expired'}
              </span>
              <button onClick={() => startEdit(c)} className="p-2 rounded-lg hover:bg-gray-100"><Edit3 className="w-4 h-4 text-gray-500" /></button>
              <button onClick={() => handleDelete(c._id)} className="p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
