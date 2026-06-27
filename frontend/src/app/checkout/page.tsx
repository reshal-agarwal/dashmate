'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, useAuthStore } from '@/store';
import { api, handleApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Form';
import { StudentLayout } from '@/components/layout';
import { cn } from '@/lib/utils';
import { OrderDeliveryAddress } from '@/types';
import {
  Wallet,
  CreditCard,
  Banknote,
  BadgePercent,
  Coins,
  ChevronRight,
  Loader2,
  MapPin,
} from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'wallet', label: 'Wallet', icon: Wallet },
  { value: 'upi', label: 'UPI', icon: CreditCard },
  { value: 'cod', label: 'Cash on Delivery', icon: Banknote },
  { value: 'credits', label: 'Credits', icon: Coins },
] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, restaurantId, getSubtotal, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [deliveryAddress, setDeliveryAddress] = useState<OrderDeliveryAddress>({
    building: '',
    floor: '',
    roomNumber: '',
    landmark: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<string>('wallet');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [applyCredits, setApplyCredits] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (items.length === 0) {
      router.replace('/cart');
    }
  }, [items.length, router]);

  const subtotal = getSubtotal();
  const deliveryFee = 20;
  const platformFee = 5;
  const maxCredits = Math.min(
    user?.creditsBalance || 0,
    Math.round(subtotal + deliveryFee + platformFee)
  );
  const creditsApplied = applyCredits ? maxCredits : 0;
  const discount = couponDiscount;
  const total = Math.max(0, subtotal + deliveryFee + platformFee - discount - creditsApplied);

  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim() || couponCode === appliedCoupon) return;
    setCouponLoading(true);
    setCouponError('');
    setCouponDiscount(0);
    try {
      const res = await api.get(`/coupons/validate/${couponCode.trim()}`, {
        params: { restaurantId, amount: subtotal },
      });
      const data = res.data;
      if (data.success) {
        setAppliedCoupon(couponCode.trim());
        setCouponDiscount(data.data.discount);
        setCouponCode('');
      }
    } catch (err) {
      const apiError = handleApiError(err);
      setCouponError(apiError.message);
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode, appliedCoupon, restaurantId, subtotal]);

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.building || !deliveryAddress.roomNumber) {
      setError('Building and room number are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
      }));

      const res = await api.post('/orders', {
        restaurantId,
        items: orderItems,
        deliveryAddress,
        paymentMethod,
        couponCode: appliedCoupon || undefined,
        creditsToApply: creditsApplied,
      });

      const data = res.data;
      if (data.success) {
        clearCart();
        router.push(`/orders/${data.data.id}`);
      }
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const updateAddress = (field: keyof OrderDeliveryAddress, value: string) => {
    setDeliveryAddress((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <StudentLayout title="Checkout" showBack>
      <div className="space-y-6 pb-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-400" />
            Delivery Address
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <div>
              <Label htmlFor="building" required>Building</Label>
              <Input
                id="building"
                placeholder="e.g. Main Building, Block A"
                value={deliveryAddress.building}
                onChange={(e) => updateAddress('building', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="floor">Floor</Label>
              <Input
                id="floor"
                placeholder="e.g. 3rd Floor"
                value={deliveryAddress.floor || ''}
                onChange={(e) => updateAddress('floor', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="roomNumber" required>Room Number</Label>
              <Input
                id="roomNumber"
                placeholder="e.g. 301"
                value={deliveryAddress.roomNumber}
                onChange={(e) => updateAddress('roomNumber', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="landmark">Landmark (optional)</Label>
              <Input
                id="landmark"
                placeholder="e.g. Near the library"
                value={deliveryAddress.landmark || ''}
                onChange={(e) => updateAddress('landmark', e.target.value)}
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-gray-400" />
            Payment Method
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all',
                    paymentMethod === method.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{method.label}</span>
                  {paymentMethod === method.value && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </button>
              );
            })}
          </div>

          {user && (
            <div className="mt-3 bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Wallet Balance</span>
                </div>
                <span className="font-semibold text-gray-900">₹{user.walletBalance.toFixed(2)}</span>
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BadgePercent className="w-5 h-5 text-gray-400" />
            Coupon
          </h2>
          {appliedCoupon ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800">Coupon Applied</p>
                  <p className="text-sm text-green-600">Code: {appliedCoupon}</p>
                  <p className="text-sm text-green-600">Discount: -₹{couponDiscount.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => {
                    setAppliedCoupon('');
                    setCouponDiscount(0);
                  }}
                  className="text-sm text-red-500 font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleApplyCoupon}
                  loading={couponLoading}
                  disabled={!couponCode.trim()}
                >
                  Apply
                </Button>
              </div>
              {couponError && (
                <p className="mt-2 text-sm text-red-600">{couponError}</p>
              )}
            </div>
          )}
        </section>

        {user && user.creditsBalance > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Coins className="w-5 h-5 text-gray-400" />
              Credits
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Use Credits</p>
                  <p className="text-sm text-gray-500">
                    Available: {user.creditsBalance.toFixed(2)} credits
                  </p>
                </div>
                <button
                  onClick={() => setApplyCredits(!applyCredits)}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors',
                    applyCredits ? 'bg-primary-600' : 'bg-gray-300'
                  )}
                  role="switch"
                  aria-checked={applyCredits}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                      applyCredits && 'translate-x-5'
                    )}
                  />
                </button>
              </div>
              {applyCredits && (
                <p className="mt-2 text-sm text-green-600">
                  Applying {creditsApplied.toFixed(2)} credits
                </p>
              )}
            </div>
          </section>
        )}

        <section className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between">
                <span className="text-gray-600 truncate flex-1">
                  {item.product.name} x{item.quantity}
                </span>
                <span className="text-gray-900 font-medium ml-2">
                  ₹{(item.product.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <hr className="my-3 border-gray-100" />
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-700">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Delivery Fee</span>
              <span className="text-gray-700">₹{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Platform Fee</span>
              <span className="text-gray-700">₹{platformFee.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-green-600">
                <span>Coupon Discount</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            {creditsApplied > 0 && (
              <div className="flex items-center justify-between text-green-600">
                <span>Credits Applied</span>
                <span>-₹{creditsApplied.toFixed(2)}</span>
              </div>
            )}
          </div>
          <hr className="my-3 border-gray-100" />
          <div className="flex items-center justify-between text-base">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-bold text-lg text-gray-900">₹{total.toFixed(2)}</span>
          </div>
        </section>

        <Button
          size="full"
          onClick={handlePlaceOrder}
          loading={loading}
          disabled={loading}
        >
          Place Order
        </Button>
      </div>
    </StudentLayout>
  );
}
