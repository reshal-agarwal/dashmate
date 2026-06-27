'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { StudentLayout } from '@/components/layout';
import { cn } from '@/lib/utils';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, getSubtotal } = useCartStore();
  const [instructions, setInstructions] = useState<Record<string, string>>({});

  if (items.length === 0) {
    return (
      <StudentLayout title="Cart">
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-4">
            <ShoppingBag className="w-10 h-10 text-orange-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 text-center mb-6">Looks like you haven&apos;t added anything yet</p>
          <Button onClick={() => router.push('/restaurants')}>
            Browse Restaurants
          </Button>
        </div>
      </StudentLayout>
    );
  }

  const subtotal = getSubtotal();

  return (
    <StudentLayout title={`Cart (${items.length})`}>
      <div className="flex flex-col min-h-[calc(100vh-8rem)]">
        <div className="flex-1 space-y-3 pb-4">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate">{item.product.name}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        ₹{item.product.price.toFixed(2)} each
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-2 -m-2 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label={`Remove ${item.product.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center font-medium text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="font-semibold text-gray-900">
                      ₹{(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Special instructions..."
                      value={instructions[item.product.id] || ''}
                      onChange={(e) =>
                        setInstructions((prev) => ({
                          ...prev,
                          [item.product.id]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={clearCart}
            className="text-sm text-red-500 font-medium px-1 py-2"
          >
            Clear Cart
          </button>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 pt-4 pb-2 -mx-4 px-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-lg font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
          </div>
          <Button
            size="full"
            onClick={() => router.push('/checkout')}
            className="mb-3"
          >
            Proceed to Checkout
          </Button>
          <Link
            href="/restaurants"
            className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </StudentLayout>
  );
}
