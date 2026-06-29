'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store';
import { RestaurantLayout } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Form';
import { cn } from '@/lib/utils';
import { Product } from '@/types';
import {
  Utensils,
  Plus,
  X,
  AlertCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ChevronRight,
  Pencil,
  Trash2,
  Loader2,
  IndianRupee,
} from 'lucide-react';

export default function ProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', category: '', price: '',
    isVegetarian: false, isVegan: false, spiceLevel: '0',
    preparationTime: '10', stock: '-1',
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ success: boolean; data: { items: Product[] } }>('/restaurant/products', {
        params: { limit: 100 },
      });
      setProducts(res.data.data.items);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchProducts();
  }, [isAuthenticated, fetchProducts, router]);

  const resetForm = () => {
    setForm({ name: '', description: '', category: '', price: '', isVegetarian: false, isVegan: false, spiceLevel: '0', preparationTime: '10', stock: '-1' });
    setEditingId(null);
    setFormError(null);
  };

  const openEdit = (product: Product) => {
    setForm({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price: String(product.price),
      isVegetarian: product.isVegetarian,
      isVegan: product.isVegan,
      spiceLevel: String(product.spiceLevel),
      preparationTime: String(product.preparationTime),
      stock: String(product.stock),
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.category || !form.price) {
      setFormError('Name, category, and price are required');
      return;
    }
    setFormLoading(true);
    setFormError(null);

    try {
      const body = {
        ...form,
        price: parseFloat(form.price),
        spiceLevel: parseInt(form.spiceLevel),
        preparationTime: parseInt(form.preparationTime),
        stock: parseInt(form.stock),
      };

      if (editingId) {
        await api.put(`/restaurant/products/${editingId}`, body);
      } else {
        await api.post('/restaurant/products', body);
      }

      setShowForm(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      setFormError(handleApiError(err).message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.put(`/restaurant/products/${id}/toggle`);
      fetchProducts();
    } catch (err) {
      setError(handleApiError(err).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/restaurant/products/${id}`);
      fetchProducts();
    } catch (err) {
      setError(handleApiError(err).message);
    }
  };

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAuthenticated) return null;

  return (
    <RestaurantLayout title="Products">
      <div className="p-4 space-y-4">
        {/* Search + Add */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="primary" size="md" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Product List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-100 p-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {search ? 'No products found' : 'No products yet'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {search ? 'Try a different search' : 'Add your first product'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((product) => (
              <div key={product.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      {product.isVegetarian && <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Veg</span>}
                      {!product.isAvailable && <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Unavailable</span>}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{product.category} · ₹{product.price}</p>
                    {product.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{product.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <button
                      onClick={() => handleToggle(product.id)}
                      className={cn('p-2 rounded-lg transition-colors', product.isAvailable ? 'hover:bg-orange-50 text-orange-500' : 'hover:bg-green-50 text-green-500')}
                      title={product.isAvailable ? 'Disable' : 'Enable'}
                    >
                      {product.isAvailable ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => openEdit(product)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowForm(false); resetForm(); }} />
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Product' : 'Add Product'}
              </h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Chicken Biryani" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all min-h-[60px] resize-none text-sm"
                  placeholder="Brief description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select</option>
                    {['Main Course', 'Beverages', 'Snacks', 'Desserts', 'Starters', 'Combo', 'Other'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input id="price" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="250" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="spiceLevel">Spice Level</Label>
                  <Select id="spiceLevel" value={form.spiceLevel} onChange={(e) => setForm({ ...form, spiceLevel: e.target.value })}>
                    <option value="0">None</option>
                    <option value="1">Mild</option>
                    <option value="2">Medium</option>
                    <option value="3">Hot</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="prepTime">Prep (min)</Label>
                  <Input id="prepTime" type="number" min={1} value={form.preparationTime} onChange={(e) => setForm({ ...form, preparationTime: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input id="stock" type="number" min={-1} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="-1=unlimited" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isVegetarian} onChange={(e) => setForm({ ...form, isVegetarian: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                  <span className="text-sm text-gray-700">Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isVegan} onChange={(e) => setForm({ ...form, isVegan: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                  <span className="text-sm text-gray-700">Vegan</span>
                </label>
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <Button variant="primary" size="full" loading={formLoading} onClick={handleSubmit}>
                {editingId ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </RestaurantLayout>
  );
}
